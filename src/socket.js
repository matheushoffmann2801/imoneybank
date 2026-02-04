import { io } from 'socket.io-client';

// Configuração dinâmica para funcionar em localhost e na rede (IP)
// A porta 3000 é onde o server.js está rodando a API e o Socket.IO
const PROTOCOL = window.location.protocol; // 'http:' ou 'https:'
const HOST = window.location.hostname;     // 'localhost' ou '192.168.x.x'
const PORT = 3000;

const SERVER_URL = `${PROTOCOL}//${HOST}:${PORT}`;

export const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log(`✅ Socket conectado: ${socket.id}`));
socket.on('disconnect', () => console.log('❌ Socket desconectado'));