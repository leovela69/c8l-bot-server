// hooks/useWebSocket.ts
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket(roomId: string, userId: string, userName: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomUsers, setRoomUsers] = useState<any[]>([]);
  const [activeSingers, setActiveSingers] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [partyState, setPartyState] = useState<any>(null);
  const [tournamentScores, setTournamentScores] = useState<Map<string, number>>(new Map());
  
  const socketRef = useRef<Socket | null>(null);
  
  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });
    
    socketRef.current = socketInstance;
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
      
      // Unirse a la sala
      socketInstance.emit('join-room', {
        roomId,
        user: { id: userId, name: userName, avatar: '🎤', badges: [] },
      });
    });
    
    socketInstance.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    });
    
    socketInstance.on('room-state', (data) => {
      setRoomUsers(data.users);
      setActiveSingers(data.activeSingers);
      setAnnouncements(data.announcements);
    });
    
    socketInstance.on('user-joined', (data) => {
      setRoomUsers(data.users);
      addAnnouncement(`🎤 ¡${data.user.name} se unió a la sala!`);
    });
    
    socketInstance.on('user-left', (data) => {
      setRoomUsers(data.users);
      addAnnouncement(`👋 Un usuario abandonó la sala`);
    });
    
    socketInstance.on('scores-update', (data) => {
      setRoomUsers(prev => prev.map(user => 
        user.id === data.userId 
          ? { ...user, currentScore: data.score, streak: data.streak, isSinging: data.isSinging }
          : user
      ));
      setActiveSingers(data.users.filter((u: any) => u.isSinging).map((u: any) => u.id));
    });
    
    socketInstance.on('gift-sent', (data) => {
      addAnnouncement(`🎁 ¡${data.from} envió ${data.gift} a ${data.to}!`);
    });
    
    socketInstance.on('announcement', (data) => {
      addAnnouncement(data.message);
    });
    
    socketInstance.on('party-started', (data) => {
      setPartyState({ active: true, ...data });
      addAnnouncement(data.message);
    });
    
    socketInstance.on('party-ended', (data) => {
      setPartyState(null);
      addAnnouncement(data.message);
    });
    
    socketInstance.on('party-vote-update', (data) => {
      setPartyState((prev: any) => ({
        ...prev,
        votes: { ...prev?.votes, [data.participantId]: data.voteCount },
        totalVotes: data.totalVotes,
      }));
    });
    
    socketInstance.on('tournament-update', (data) => {
      const newScores = new Map();
      data.scores.forEach((s: any) => newScores.set(s.userId, s.score));
      setTournamentScores(newScores);
    });
    
    return () => {
      socketInstance.emit('leave-room', { roomId });
      socketInstance.disconnect();
    };
  }, [roomId, userId, userName]);
  
  const addAnnouncement = (message: string) => {
    setAnnouncements(prev => [message, ...prev].slice(0, 10));
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a !== message));
    }, 5000);
  };
  
  const sendScoreUpdate = useCallback((score: number, streak: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('score-update', { roomId, score, streak });
    }
  }, [roomId, isConnected]);
  
  const sendGift = useCallback((toUserId: string, giftType: string, coinsCost: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send-gift', { roomId, toUserId, giftType, coinsCost });
    }
  }, [roomId, isConnected]);
  
  const startParty = useCallback((participants: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('start-party', { roomId, participants });
    }
  }, [roomId, isConnected]);
  
  const voteParty = useCallback((participantId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('party-vote', { roomId, participantId });
    }
  }, [roomId, isConnected]);
  
  const endParty = useCallback((winnerId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('end-party', { roomId, winnerId });
    }
  }, [roomId, isConnected]);
  
  return {
    isConnected,
    roomUsers,
    activeSingers,
    announcements,
    partyState,
    tournamentScores,
    sendScoreUpdate,
    sendGift,
    startParty,
    voteParty,
    endParty,
  };
}