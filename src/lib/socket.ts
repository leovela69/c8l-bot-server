// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    socket.on('connect', () => {
      console.log('Conectado a WebSocket');
    });
    
    socket.on('user_joined', (data: any) => {
      console.log(`${data.userName} se unió a la sala`);
    });
    
    socket.on('score_update', (data: any) => {
      // Actualizar puntuación de un usuario en tiempo real
      window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: data }));
    });
    
    socket.on('gift_sent', (data: any) => {
      // Mostrar notificación de regalo
      console.log(`🎁 ${data.from} envió ${data.gift} a ${data.to}`);
    });
  }
  return socket;
};

export const emitPracticeScore = (userId: string, score: number, streak: number) => {
  const socket = getSocket();
  socket.emit('practice_update', { userId, score, streak });
};