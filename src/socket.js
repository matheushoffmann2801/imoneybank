import { io } from 'socket.io-client';

// Detecta dinamicamente o IP/Hostname para conectar no backend (porta 3000)
const getSocketUrl = () => {
  if (import.meta.env.PROD) return undefined; // Em produção, usa a mesma origem (domínio atual)
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:3000`;
};

export const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});