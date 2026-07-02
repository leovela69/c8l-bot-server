import { Server as SocketIO } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: SocketIO;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const safeUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : 'https://placeholder-url.supabase.co';
const supabase = createClient(
  safeUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// Almacenamiento en memoria de estado de la sala
interface RoomState {
  id: string;
  users: Map<string, {
    id: string;
    name: string;
    avatar: string;
    seatNumber: number;
    isOnStage: boolean;
    isSinging: boolean;
    currentScore: number;
    streak: number;
    giftsSent: number;
    badges: string[];
  }>;
  activeSingers: Set<string>;
  currentPartyMode: {
    active: boolean;
    participants: string[];
    currentPerformer: string | null;
    votes: Map<string, string[]>;
  };
  currentTournament: {
    active: boolean;
    weekId: number;
    scores: Map<string, number>;
  };
  announcements: string[];
}

const rooms = new Map<string, RoomState>();

function createRoom(roomId: string): RoomState {
  const room: RoomState = {
    id: roomId,
    users: new Map(),
    activeSingers: new Set(),
    currentPartyMode: {
      active: false,
      participants: [],
      currentPerformer: null,
      votes: new Map(),
    },
    currentTournament: {
      active: false,
      weekId: 0,
      scores: new Map(),
    },
    announcements: [],
  };
  rooms.set(roomId, room);
  return room;
}

let ioInstance: SocketIO | null = null;

export function getSocket(): SocketIO {
  if (!ioInstance) {
    return {
      to: (room: string) => ({
        emit: (event: string, data: any) => {
          console.log(`[Mock IO] Emit to ${room}: ${event}`, data);
        }
      })
    } as any;
  }
  return ioInstance;
}

export async function GET(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    const httpServer: HTTPServer = res.socket.server;
    const io = new SocketIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
    });
    
    io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.id}`);
      
      // Unirse a una sala
      socket.on('join-room', async (data: { roomId: string; user: any }) => {
        const { roomId, user } = data;
        socket.join(roomId);
        
        let room = rooms.get(roomId);
        if (!room) {
          room = createRoom(roomId);
        }
        
        // Añadir usuario a la sala
        const seatNumber = user.seatNumber || (room.users.size + 1);
        const userData = {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '🎤',
          seatNumber,
          isOnStage: false,
          isSinging: false,
          currentScore: 0,
          streak: 0,
          giftsSent: 0,
          badges: user.badges || [],
        };
        room.users.set(socket.id, userData);
        
        // Notificar a todos los usuarios de la sala
        io.to(roomId).emit('user-joined', {
          user: userData,
          totalUsers: room.users.size,
          users: Array.from(room.users.values()),
        });
        
        socket.emit('room-state', {
          users: Array.from(room.users.values()),
          activeSingers: Array.from(room.activeSingers),
          announcements: room.announcements.slice(-5),
        });
      });
      
      // Actualizar puntuación en vivo (práctica / dueto)
      socket.on('score-update', (data: { roomId: string; score: number; streak: number }) => {
        const { roomId, score, streak } = data;
        const room = rooms.get(roomId);
        if (!room) return;
        
        const user = room.users.get(socket.id);
        if (user) {
          user.currentScore = score;
          user.streak = streak;
          user.isSinging = score > 0;
          
          if (score > 0 && !room.activeSingers.has(socket.id)) {
            room.activeSingers.add(socket.id);
          } else if (score === 0 && room.activeSingers.has(socket.id)) {
            room.activeSingers.delete(socket.id);
          }
          
          // Emitir actualización a todos
          io.to(roomId).emit('scores-update', {
            userId: socket.id,
            userName: user.name,
            score,
            streak,
            isSinging: user.isSinging,
            users: Array.from(room.users.values()).map(u => ({
              id: u.id,
              name: u.name,
              currentScore: u.currentScore,
              streak: u.streak,
              isSinging: u.isSinging,
            })),
          });
          
          // Actualizar torneo semanal
          if (room.currentTournament.active && score > 0) {
            const currentTotal = room.currentTournament.scores.get(user.id) || 0;
            room.currentTournament.scores.set(user.id, currentTotal + score);
            
            // Emitir actualización de torneo
            io.to(roomId).emit('tournament-update', {
              scores: Array.from(room.currentTournament.scores.entries()).map(([userId, userScore]) => ({
                userId,
                score: userScore,
              })),
            });
          }
        }
      });
      
      // Enviar regalo a otro usuario
      socket.on('send-gift', async (data: { roomId: string; toUserId: string; giftType: string; coinsCost: number }) => {
        const { roomId, toUserId, giftType, coinsCost } = data;
        const room = rooms.get(roomId);
        if (!room) return;
        
        const fromUser = room.users.get(socket.id);
        const toUser = Array.from(room.users.values()).find(u => u.id === toUserId);
        
        if (fromUser && toUser) {
          fromUser.giftsSent++;
          
          // Registrar en base de datos
          await supabase.from('gifts').insert({
            from_user_id: fromUser.id,
            to_user_id: toUserId,
            gift_type: giftType,
            coins_cost: coinsCost,
            room_id: roomId,
            created_at: new Date(),
          });
          
          // Notificar a la sala
          io.to(roomId).emit('gift-sent', {
            from: fromUser.name,
            fromAvatar: fromUser.avatar,
            to: toUser.name,
            gift: giftType,
            timestamp: new Date(),
          });
          
          // Anuncio especial para regalos legendarios
          if (giftType === '👑' || giftType === '💎') {
            const announcement = `🎁 ¡${fromUser.name} envió ${giftType} a ${toUser.name}! 🎁`;
            room.announcements.unshift(announcement);
            if (room.announcements.length > 10) room.announcements.pop();
            io.to(roomId).emit('announcement', { message: announcement, type: 'legendary' });
          }
        }
      });
      
      // Iniciar Modo Fiesta
      socket.on('start-party', (data: { roomId: string; participants: string[] }) => {
        const { roomId, participants } = data;
        const room = rooms.get(roomId);
        if (!room) return;
        
        room.currentPartyMode = {
          active: true,
          participants,
          currentPerformer: null,
          votes: new Map(),
        };
        
        io.to(roomId).emit('party-started', {
          participants,
          message: '🎉 ¡MODO FIESTA ACTIVADO! Comienzan las presentaciones 🎉',
        });
      });
      
      // Votar en Modo Fiesta
      socket.on('party-vote', (data: { roomId: string; participantId: string }) => {
        const { roomId, participantId } = data;
        const room = rooms.get(roomId);
        if (!room || !room.currentPartyMode.active) return;
        
        const votes = room.currentPartyMode.votes.get(participantId) || [];
        if (!votes.includes(socket.id)) {
          votes.push(socket.id);
          room.currentPartyMode.votes.set(participantId, votes);
          
          io.to(roomId).emit('party-vote-update', {
            participantId,
            voteCount: votes.length,
            totalVotes: Array.from(room.currentPartyMode.votes.values()).reduce((a, b) => a + b.length, 0),
          });
        }
      });
      
      // Finalizar Modo Fiesta
      socket.on('end-party', (data: { roomId: string; winnerId: string }) => {
        const { roomId, winnerId } = data;
        const room = rooms.get(roomId);
        if (!room) return;
        
        const winner = Array.from(room.users.values()).find(u => u.id === winnerId);
        const voteCounts = Array.from(room.currentPartyMode.votes.entries()).map(([userId, votes]) => ({
          userId,
          votes: votes.length,
        }));
        
        io.to(roomId).emit('party-ended', {
          winner: winner ? { name: winner.name, avatar: winner.avatar } : null,
          voteCounts,
          message: `🏆 ¡${winner?.name} ganó la fiesta! 🏆`,
        });
        
        room.currentPartyMode = {
          active: false,
          participants: [],
          currentPerformer: null,
          votes: new Map(),
        };
      });
      
      // Salir de la sala
      socket.on('leave-room', (data: { roomId: string }) => {
        const { roomId } = data;
        const room = rooms.get(roomId);
        if (room) {
          room.users.delete(socket.id);
          room.activeSingers.delete(socket.id);
          
          io.to(roomId).emit('user-left', {
            socketId: socket.id,
            totalUsers: room.users.size,
            users: Array.from(room.users.values()),
          });
        }
        socket.leave(roomId);
      });
      
      // Desconexión
      socket.on('disconnect', () => {
        console.log(`🔌 Usuario desconectado: ${socket.id}`);
        for (const [roomId, room] of rooms.entries()) {
          if (room.users.has(socket.id)) {
            room.users.delete(socket.id);
            room.activeSingers.delete(socket.id);
            io.to(roomId).emit('user-left', {
              socketId: socket.id,
              totalUsers: room.users.size,
              users: Array.from(room.users.values()),
            });
          }
        }
      });
    });
    
    res.socket.server.io = io;
  }
  ioInstance = res.socket.server.io;
  
  res.end();
}