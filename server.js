import express from 'express';
import ip from 'ip';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';

// Importações dos módulos refatorados
import { safeNum, formatCurrency, getInterestRate } from './server_modules/gameUtils.js';
import { 
    ADMIN_PASSWORD, PROPERTIES_DB, ALL_CARDS, HOLIDAY_CARDS, VISIT_CARDS 
} from './server_modules/gameData.js';

import { processAction } from './server_modules/gameLogic.js';

const app = express();
app.use(cors());
app.use(express.json());

// --- PERSISTÊNCIA DE DADOS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria a pasta 'data' se não existir
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const DATA_FILE = path.join(DATA_DIR, 'rooms.json');
let rooms = {};

// Carrega dados salvos ao iniciar
if (fs.existsSync(DATA_FILE)) {
  try {
    rooms = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('📦 Dados carregados de rooms.json');
  } catch (e) {
    console.error('Erro ao carregar backup:', e);
  }
}

// --- OTIMIZAÇÃO: DEBOUNCE SAVE ---
let saveTimeout;
const saveToDisk = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFile(tempFile, JSON.stringify(rooms, null, 2), (err) => {
      if (err) {
        console.error('Erro ao salvar temporário:', err);
        return;
      }
      fs.rename(tempFile, DATA_FILE, (err) => {
        if (err) console.error('Erro ao mover arquivo final:', err);
      });
    });
  }, 500); // Aguarda 500ms de inatividade para salvar
};

// GET: Ping (Health Check)
app.get('/api/ping', (req, res) => {
  res.json({ pong: true, time: Date.now() });
});

// GET: Retorna o estado da sala
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(rooms[roomId] || {});
});

// POST: Atualiza o estado da sala (Merge simples)
app.post('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const newData = req.body;
  
  // Cria ou atualiza a sala mesclando os dados
  rooms[roomId] = { ...(rooms[roomId] || {}), ...newData };
  
  saveToDisk();
  
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
      saveToDisk();

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
      saveToDisk();
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
      saveToDisk();

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
      
      saveToDisk();
      
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
    
    saveToDisk();
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
  saveToDisk();
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
    saveToDisk();

    io.to(roomId).emit('chat_new_message', { roomId, chat: newChat });
    io.to(roomId).emit('room_update', { roomId, data: room });
  });

  // --- DADOS SINCRONIZADOS ---
  socket.on('roll_dice', ({ roomId, userId }) => {
      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;
      
      // FIX: Salvar no histórico (Frontend usa apenas socket agora)
      const room = rooms[roomId];
      if (room && room.players[userId]) {
          const tx = {
              id: Date.now().toString(), timestamp: Date.now(), type: 'dice_roll', amount: 0,
              description: `Dados: ${die1} + ${die2} = ${die1 + die2}`,
              from: userId, senderName: room.players[userId].name
          };
          room.transactions = [tx, ...(room.transactions || []).slice(0, 49)];
          saveToDisk();
          io.to(roomId).emit('room_update', { roomId, data: room });
      }
      
      io.to(roomId).emit('dice_rolled', { roomId, userId, result: die1 + die2, die1, die2 });
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
        io.to(roomId).emit('room_update', { roomId, data: rooms[roomId] });
    }
    
    // Avisa a sala que alguém entrou
    socket.to(roomId).emit('player_presence', { roomId, userId, online: true });
  });

  socket.on('typing', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('player_typing', { roomId, userId, isTyping });
  });

  // --- SINALIZAÇÃO DE VOZ (WEBRTC) ---
  socket.on('voice_signal', ({ to, signal, from }) => {
    io.to(to).emit('voice_signal', { signal, from });
  });

  socket.on('voice_joined', ({ roomId, userId }) => {
      socket.to(roomId).emit('voice_joined', { userId });
  });
  
  socket.on('voice_left', ({ roomId, userId }) => {
      socket.to(roomId).emit('voice_left', { userId });
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
