import express from 'express';
import ip from 'ip';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importações dos módulos refatorados
import { safeNum, formatCurrency, getInterestRate } from './server_modules/gameUtils.js';
import { 
    ADMIN_PASSWORD, PROPERTIES_DB, ALL_CARDS, HOLIDAY_CARDS, VISIT_CARDS, NEIGHBORHOOD_SERVICES
} from './server_modules/gameData.js';

import { processAction } from './server_modules/gameLogic.js';
import prisma from './server_modules/db.js';
import { register, login, verifyToken } from './server_modules/auth.js';

const SALARY_AMOUNT = 200000;



const app = express();
app.use(cors());
app.use(express.json());

// --- PERSISTÊNCIA DE DADOS (POSTGRESQL) ---
let rooms = {};

// Carrega dados salvos ao iniciar
const loadRoomsFromDB = async () => {
  try {
    const dbRooms = await prisma.room.findMany();
    for (const room of dbRooms) {
      if (room.gameState) {
        rooms[room.code] = room.gameState;
      }
    }
    console.log(`📦 ${dbRooms.length} Salas carregadas do PostgreSQL`);
  } catch (e) {
    console.error('Erro ao carregar do BD:', e);
  }
};
loadRoomsFromDB();

// --- OTIMIZAÇÃO: DEBOUNCE SAVE ---
let saveTimeout;
const saveToDatabase = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      for (const [roomId, gameState] of Object.entries(rooms)) {
        // Encontra ou cria a sala no BD
        await prisma.room.upsert({
          where: { code: roomId },
          update: { gameState },
          create: {
            code: roomId,
            hostId: gameState.adminId || 'unknown', // Precisa de um host, 'unknown' falhará se não for um UUID válido. O ideal é que na criação da sala a gente defina.
            // Para simplificar a transição, vamos ignorar a criação cega aqui e criar na rota POST explícita.
            // Mas upsert exige um hostId válido se criar. Vamos buscar o user admin.
          }
        }).catch(async (e) => {
          // Se falhar no upsert (ex: hostId não existe), tenta criar com o primeiro usuário ou só ignora.
          // O melhor é garantir que a sala já exista. Então usamos updateMany ou ignoramos.
          await prisma.room.update({
            where: { code: roomId },
            data: { gameState }
          }).catch(err => { /* ignora se a sala não existir no DB */ });
        });
      }
    } catch (e) {
        console.error('Erro ao salvar no BD:', e);
    }
  }, 1000); // Aguarda 1000ms de inatividade
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// GET: Ping (Health Check)
app.get('/api/ping', (req, res) => {
  res.json({ pong: true, time: Date.now() });
});

// GET: Retorna todas as salas ativas (para o lobby)
app.get('/api/rooms', (req, res) => {
    const roomList = Object.keys(rooms).map(code => {
        const room = rooms[code];
        return {
            code,
            name: room.name || `Sala ${code}`,
            playersCount: Object.keys(room.players || {}).length,
            hasPassword: !!room.password,
            adminId: room.adminId
        };
    });
    res.json(roomList);
});

// POST: Cria uma nova sala com senha
app.post('/api/room/create', async (req, res) => {
    const { code, name, password, adminId, initialState } = req.body;
    
    if (rooms[code]) {
        return res.status(400).json({ error: 'Uma sala com esse código já existe.' });
    }

    const newRoom = {
        ...initialState,
        name: name || `Sala ${code}`,
        password: password || null,
        adminId: adminId
    };

    rooms[code] = newRoom;

    try {
        await prisma.room.upsert({
            where: { code },
            update: { gameState: newRoom },
            create: { code, hostId: adminId, gameState: newRoom }
        });
    } catch (e) {
        console.error("Erro ao registrar sala no BD:", e);
    }
    
    res.json({ success: true, code });
});

// POST: Entrar na sala verificando a senha
app.post('/api/room/:roomId/join', async (req, res) => {
    const { roomId } = req.params;
    const { password, playerState, userId } = req.body;
    
    const room = rooms[roomId];
    if (!room) return res.status(404).json({ error: 'Sala não encontrada.' });

    // Verifica a senha se houver
    if (room.password && room.password !== password) {
        // Se o admin (Banco Central) estiver entrando, não precisa contornar, ele deve saber a senha se for entrar em sala de outro, 
        // mas se for o próprio admin, a gente libera
        if (userId !== 'ADMIN' && room.adminId !== userId) {
             return res.status(403).json({ error: 'Senha incorreta.' });
        }
    }

    // Mescla apenas o playerState deste usuário no objeto players, sem apagar os outros
    if (playerState && userId) {
        const currentPlayers = room.players || {};
        // Só adiciona/sobrescreve o jogador em questão, mantendo os outros
        room.players = {
            ...currentPlayers,
            [userId]: {
                 ...(currentPlayers[userId] || {}),
                 ...playerState
            }
        };
        saveToDatabase();
    }

    res.json({ success: true, room });
});

// GET: Retorna o estado da sala
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(rooms[roomId] || {});
});

// POST: Cria ou atualiza o estado da sala (Merge simples)
app.post('/api/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const newData = req.body;
  const isNewRoom = !rooms[roomId];
  const currentRoom = rooms[roomId] || {};
  
  // FIX: Merge profundo de players para evitar o bug de apagar quem já está lá
  const mergedPlayers = { ...(currentRoom.players || {}), ...(newData.players || {}) };
  
  rooms[roomId] = { ...currentRoom, ...newData, players: mergedPlayers };
  
  if (isNewRoom && newData.adminId) {
      try {
          await prisma.room.upsert({
              where: { code: roomId },
              update: { gameState: rooms[roomId] },
              create: { code: roomId, hostId: newData.adminId, gameState: rooms[roomId] }
          });
      } catch (e) {
          console.error("Erro ao registrar sala no BD:", e);
      }
  } else {
      saveToDatabase();
  }
  
  res.json(rooms[roomId]);
});

// POST: Sorteio de Carta (RNG no Servidor)
app.post('/api/room/:roomId/draw-card', (req, res) => {
  const card = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
  
  // Notifica a sala sobre a carta tirada (para apresentação visual)
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = rooms[roomId];
  if (room && room.players[userId]) {
      // Registra no histórico
      const tx = {
          id: Date.now().toString(), timestamp: Date.now(), type: 'card_draw', amount: 0,
          description: `Carta: ${card.title}`,
          from: userId, senderName: room.players[userId].name
      };
      room.transactions = [tx, ...(room.transactions || []).slice(0, 49)];
      saveToDatabase();

      // Delay de 1.5s para que o jogador que tirou a carta veja a animação primeiro
      setTimeout(() => {
        io.to(roomId).emit('card_drawn', { roomId, userId, playerName: room.players[userId].name, card });
      }, 4000);
  }
  
  res.json(card);
});

// POST: Sorteio de Dados (RNG no Servidor)
app.post('/api/room/:roomId/roll-dice', (req, res) => {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  
  // Registra no histórico
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = rooms[roomId];
  if (room && room.players[userId]) {
      const tx = {
          id: Date.now().toString(), timestamp: Date.now(), type: 'dice_roll', amount: 0,
          description: `Dados: ${die1} + ${die2} = ${die1 + die2}`,
          from: userId, senderName: room.players[userId].name
      };
      room.transactions = [tx, ...(room.transactions || []).slice(0, 49)];
      saveToDatabase();
  }
  
  res.json({ result: die1 + die2, die1, die2 });
});

// POST: Evento de Tabuleiro (RNG no Servidor)
app.post('/api/room/:roomId/board-event', (req, res) => {
  const { type } = req.body;
  let card;
  if (type === 'feriado') {
    card = HOLIDAY_CARDS[Math.floor(Math.random() * HOLIDAY_CARDS.length)];
  } else if (type === 'visita') {
    card = VISIT_CARDS[Math.floor(Math.random() * VISIT_CARDS.length)];
  } else {
    return res.status(400).json({ error: 'Tipo de evento inválido' });
  }
  
  // Notifica a sala sobre o evento (para apresentação visual)
  const { roomId } = req.params;
  const { userId } = req.body;
  const room = rooms[roomId];
  if (room && room.players[userId]) {
      // Registra no histórico
      const tx = {
          id: Date.now().toString(), timestamp: Date.now(), type: 'event', amount: 0,
          note: type === 'feriado' ? 'Feriado' : 'Visita Social',
          description: `Evento: ${type === 'feriado' ? 'Feriado' : 'Visita'}`,
          from: userId, senderName: room.players[userId].name
      };
      room.transactions = [tx, ...(room.transactions || []).slice(0, 49)];
      saveToDatabase();

      setTimeout(() => {
        io.to(roomId).emit('card_drawn', { roomId, userId, playerName: room.players[userId].name, card });
      }, 4000);
  }
  
  res.json(card);
});

// POST: Ação do Jogo (Server-Authoritative)
app.post('/api/room/:roomId/action', (req, res) => {
  const { roomId } = req.params;
  const { userId, type, amount, targetId, note, propId } = req.body;
  
  if (!rooms[roomId]) return res.status(404).json({ error: 'Sala não encontrada' });
  const room = rooms[roomId];
  const player = room.players[userId];
  if (!player) return res.status(403).json({ error: 'Jogador não encontrado' });

  try {
      processAction(room, { userId, type, amount, targetId, note, propId });
      
      saveToDatabase();
      
      io.to(roomId).emit('room_update', { roomId, data: room });
      
      if (type === 'buy_prop') {
          const player = room.players[userId];
          const propName = PROPERTIES_DB.find(p => p.id === propId)?.name;
          io.to(roomId).emit('property_bought', { roomId, playerName: player.name, propName });
      }
      
      res.json(room);
  } catch (e) {
      res.status(400).json({ error: e.message });
  }
});

// DELETE: Apaga a sala completamente
app.delete('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (rooms[roomId]) {
    delete rooms[roomId];
    
    saveToDatabase();
  }
  res.json({ success: true });
});

// POST: Reset Administrativo (Emergência)
app.post('/api/admin/reset', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Senha incorreta' });
  }
  rooms = {};
  saveToDatabase();
  res.json({ success: true, message: 'Servidor resetado com sucesso.' });
});

// --- SERVIR FRONTEND (PRODUÇÃO) ---
// Serve os arquivos estáticos gerados pelo Vite (npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// Qualquer rota não capturada pela API retorna o index.html (SPA)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Inicia servidor
const PORT = 3000;
const sslKey = path.join(__dirname, 'imoneybank.app.br-key.pem');
const sslCert = path.join(__dirname, 'imoneybank.app.br.pem');

let server;
const isSsl = fs.existsSync(sslKey) && fs.existsSync(sslCert);

if (isSsl) {
  server = https.createServer({
    key: fs.readFileSync(sslKey),
    cert: fs.readFileSync(sslCert)
  }, app);
} else {
  server = http.createServer(app);
}

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexões de qualquer origem (Manager UI, React App, etc)
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET || 'supersecret123', (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado via Socket.IO: ${socket.id}`);
  
  // Exemplo: Enviar status inicial
  socket.emit('status', { running: true, pid: process.pid, players: Object.keys(rooms).length });

  // --- CHAT EM TEMPO REAL ---
  socket.on('send_message', ({ roomId, userId, content }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    const player = room.players[userId];
    if (!player) return;

    const newChat = {
        id: Date.now().toString() + Math.random().toString().slice(2,5),
        senderId: userId,
        senderName: player.name,
        content,
        timestamp: Date.now()
    };

    room.chat = [newChat, ...(room.chat || [])].slice(0, 50);
    saveToDatabase();

    io.to(roomId).emit('chat_new_message', { roomId, chat: newChat });
    io.to(roomId).emit('room_update', { roomId, data: room });
  });

  // --- DADOS SINCRONIZADOS ---
  socket.on('roll_dice', ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room || !room.players[userId]) return;

      const player = room.players[userId];

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      const totalSteps = die1 + die2;

      const tx = {
          id: Date.now().toString(), timestamp: Date.now(), type: 'dice_roll', amount: 0,
          description: `Dados: ${die1} + ${die2} = ${totalSteps}`,
          from: userId, senderName: player.name
      };
      room.transactions = [tx, ...(room.transactions || []).slice(0, 49)];
      saveToDatabase();
      
      io.to(roomId).emit('room_update', { roomId, data: room });
      io.to(roomId).emit('dice_rolled', { roomId, userId, result: totalSteps, die1, die2 });
  });

  // --- PRESENÇA E DIGITAÇÃO ---
  socket.on('join_room', ({ roomId, userId }) => {
    // FIX: Sai da sala anterior se houver troca para evitar receber eventos duplicados
    if (socket.data.roomId && socket.data.roomId !== roomId) {
        socket.leave(socket.data.roomId);
    }

    socket.join(roomId);
    socket.join(userId); // Canal privado para sinalização WebRTC (Voz)
    // Armazena metadados no socket para usar no disconnect
    socket.data.roomId = roomId;
    socket.data.userId = userId;
    
    // Atualiza status online
    if (rooms[roomId] && rooms[roomId].players[userId]) {
        rooms[roomId].players[userId].online = true;
        // Inicializa posição se não existir
        if (rooms[roomId].players[userId].position === undefined) {
            rooms[roomId].players[userId].position = 0;
        }
        io.to(roomId).emit('room_update', { roomId, data: rooms[roomId] });
    }
    
    // Avisa a sala que alguém entrou
    socket.to(roomId).emit('player_presence', { roomId, userId, online: true });
  });

  socket.on('typing', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('player_typing', { roomId, userId, isTyping });
  });


  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
    const { roomId, userId } = socket.data;
    if (roomId && userId) {
      if (rooms[roomId] && rooms[roomId].players[userId]) {
          rooms[roomId].players[userId].online = false;
          io.to(roomId).emit('room_update', { roomId, data: rooms[roomId] });
      }
      socket.to(roomId).emit('player_presence', { roomId, userId, online: false });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const protocol = isSsl ? 'https' : 'http';
  const myIp = ip.address();
  console.log('================================================');
  console.log(`🚀 API REST + SOCKET.IO RODANDO (${protocol.toUpperCase()})!`);
  console.log(`👉 ${protocol}://${myIp}:${PORT}/api`);
  console.log('================================================');
});
