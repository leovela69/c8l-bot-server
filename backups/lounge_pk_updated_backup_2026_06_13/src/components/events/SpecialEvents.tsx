// components/events/SpecialEvents.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Gift, Star, Zap, Flame, Crown, Diamond, 
  Trophy, Music, Mic, Heart, Clock, Target, Award,
  PartyPopper, Sparkles, Bell, Timer, Rocket, CheckCircle
} from 'lucide-react';

interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'holiday' | 'weekend' | 'flash' | 'seasonal';
  startDate: Date;
  endDate: Date;
  rewards: {
    type: 'coins' | 'xp' | 'badge' | 'avatar' | 'discount' | 'multiplier';
    amount: number;
    item?: string;
  }[];
  missions: EventMission[];
  multiplier?: number;
  color: string;
  isActive: boolean;
}

interface EventMission {
  id: string;
  title: string;
  description: string;
  requiredValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardXP: number;
  isCompleted: boolean;
}

interface SpecialEventsProps {
  userId: string;
  userStats: {
    coversToday: number;
    giftsSentToday: number;
    practiceMinutesToday: number;
    partiesToday: number;
  };
  onClaimReward: (eventId: string, reward: any) => void;
}

const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    id: 'halloween',
    name: '🎃 HALLOWEEN C8L',
    description: 'Evento especial de terror musical. ¡Disfraces y premios de miedo!',
    icon: <Sparkles size={24} />,
    type: 'holiday',
    startDate: new Date(2024, 9, 25),
    endDate: new Date(2024, 10, 2),
    rewards: [
      { type: 'badge', amount: 0, item: '🎃 Rey de Halloween' },
      { type: 'coins', amount: 2500 },
    ],
    missions: [
      { id: 'halloween_1', title: '🎤 Cover de Miedo', description: 'Sube 3 covers con temática de terror', requiredValue: 3, currentValue: 0, rewardCoins: 500, rewardXP: 200, isCompleted: false },
      { id: 'halloween_2', title: '🎁 Regalo Embrujado', description: 'Envía 10 regalos', requiredValue: 10, currentValue: 0, rewardCoins: 300, rewardXP: 150, isCompleted: false },
    ],
    multiplier: 2,
    color: '#FF6600',
    isActive: true,
  },
  {
    id: 'weekend_bonus',
    name: '⚡ FINDE DE LOCURA',
    description: '¡Multiplicadores x2 en todas las recompensas durante el fin de semana!',
    icon: <Zap size={24} />,
    type: 'weekend',
    startDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 5)),
    endDate: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7)),
    rewards: [
      { type: 'multiplier', amount: 2 },
    ],
    missions: [
      { id: 'weekend_1', title: '🎉 Fiestero', description: 'Participa en 5 fiestas', requiredValue: 5, currentValue: 0, rewardCoins: 1000, rewardXP: 500, isCompleted: false },
    ],
    multiplier: 2,
    color: '#00F3FF',
    isActive: true,
  },
  {
    id: 'flash_sale',
    name: '🔥 OFERTA RELÁMPAGO',
    description: '¡Por 2 horas, todos los regalos tienen 50% de descuento!',
    icon: <Flame size={24} />,
    type: 'flash',
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    rewards: [
      { type: 'discount', amount: 50, item: 'gifts' },
    ],
    missions: [],
    color: '#FF0055',
    isActive: true,
  },
];

export function SpecialEvents({ userId, userStats, onClaimReward }: SpecialEventsProps) {
  const [events, setEvents] = useState<SpecialEvent[]>(SPECIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState<Record<string, { hours: number; minutes: number; seconds: number }>>({});
  const [showReward, setShowReward] = useState<{ event: SpecialEvent; coins: number; xp: number } | null>(null);
  
  // Calcular tiempo restante para cada evento
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: Record<string, any> = {};
      
      events.forEach(event => {
        const now = new Date().getTime();
        const end = event.endDate.getTime();
        const diff = end - now;
        
        if (diff > 0) {
          newTimeLeft[event.id] = {
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((diff % (1000 * 60)) / 1000),
          };
        } else {
          newTimeLeft[event.id] = { hours: 0, minutes: 0, seconds: 0 };
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [events]);
  
  // Actualizar progreso de misiones
  useEffect(() => {
    setEvents(prev => prev.map(event => ({
      ...event,
      missions: event.missions.map(mission => {
        let currentValue = 0;
        switch(mission.id) {
          case 'halloween_1':
          case 'weekend_1':
            currentValue = userStats.partiesToday;
            break;
          case 'halloween_2':
            currentValue = userStats.giftsSentToday;
            break;
          default:
            currentValue = mission.currentValue;
        }
        
        const isCompleted = currentValue >= mission.requiredValue;
        return { ...mission, currentValue, isCompleted };
      }),
    })));
  }, [userStats]);
  
  const claimMissionReward = (event: SpecialEvent, mission: EventMission) => {
    if (!mission.isCompleted) return;
    
    const rewardCoins = mission.rewardCoins * (event.multiplier || 1);
    const rewardXP = mission.rewardXP * (event.multiplier || 1);
    
    setShowReward({ event, coins: rewardCoins, xp: rewardXP });
    onClaimReward(event.id, { coins: rewardCoins, xp: rewardXP });
    
    setEvents(prev => prev.map(e => 
      e.id === event.id 
        ? { ...e, missions: e.missions.map(m => 
            m.id === mission.id ? { ...m, isCompleted: true } : m
          )}
        : e
    ));
    
    setTimeout(() => setShowReward(null), 3000);
  };
  
  const getEventIcon = (type: string) => {
    switch(type) {
      case 'holiday': return '🎉';
      case 'weekend': return '⚡';
      case 'flash': return '🔥';
      default: return '⭐';
    }
  };
  
  return (
    <div className="bg-black border-4 border-[#D4AF37] p-4">
      
      <h3 className="text-lg font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Calendar size={18} /> EVENTOS ESPECIALES
      </h3>
      
      {/* Lista de eventos */}
      <div className="space-y-4">
        {events.filter(e => e.isActive).map(event => (
          <motion.div
            key={event.id}
            whileHover={{ scale: 1.01 }}
            onClick={() => setSelectedEvent(event)}
            className={`relative overflow-hidden cursor-pointer rounded-lg border-2 p-4 transition-all`}
            style={{ borderColor: event.color, backgroundColor: `${event.color}10` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div className="text-8xl -mt-4 -mr-4">{getEventIcon(event.type)}</div>
            </div>
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl`} style={{ backgroundColor: `${event.color}20` }}>
                  {event.icon}
                </div>
                <div>
                  <h4 className="font-bold text-white">{event.name}</h4>
                  <p className="text-xs text-gray-400">{event.description}</p>
                </div>
              </div>
              
              {timeLeft[event.id] && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">TERMINA EN</div>
                  <div className="font-mono text-sm text-[#D4AF37]">
                    {timeLeft[event.id].hours}h {timeLeft[event.id].minutes}m
                  </div>
                </div>
              )}
            </div>
            
            {event.multiplier && (
              <div className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-black" style={{ backgroundColor: event.color, color: 'black' }}>
                x{event.multiplier} MULTIPLICADOR
              </div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Modal de evento */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="relative max-w-md w-full"
              style={{ backgroundColor: `${selectedEvent.color}10` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: selectedEvent.color }} />
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-4xl`} style={{ backgroundColor: `${selectedEvent.color}30` }}>
                      {selectedEvent.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{selectedEvent.name}</h2>
                      <p className="text-sm text-gray-400">{selectedEvent.description}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-white text-2xl">
                    ✕
                  </button>
                </div>
                
                {/* Timer */}
                {timeLeft[selectedEvent.id] && (
                  <div className="bg-black/50 p-3 rounded-lg text-center mb-4">
                    <div className="text-xs text-gray-500">TIEMPO RESTANTE</div>
                    <div className="text-2xl font-mono font-black text-[#D4AF37]">
                      {timeLeft[selectedEvent.id].hours}:{timeLeft[selectedEvent.id].minutes.toString().padStart(2, '0')}:{timeLeft[selectedEvent.id].seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
                
                {/* Beneficios */}
                <div className="mb-4">
                  <h4 className="text-[#D4AF37] font-black text-sm mb-2">🎁 BENEFICIOS DEL EVENTO</h4>
                  <div className="space-y-2">
                    {selectedEvent.rewards.map((reward, i) => (
                      <div key={i} className="bg-black/50 p-2 rounded-lg flex items-center gap-2">
                        {reward.type === 'multiplier' && <Zap size={16} className="text-[#D4AF37]" />}
                        {reward.type === 'badge' && <Award size={16} className="text-[#D4AF37]" />}
                        {reward.type === 'discount' && <Gift size={16} className="text-[#D4AF37]" />}
                        <span className="text-sm">
                          {reward.type === 'multiplier' && `x${reward.amount} en todas las recompensas`}
                          {reward.type === 'badge' && `Insignia: ${reward.item}`}
                          {reward.type === 'discount' && `${reward.amount}% de descuento en ${reward.item}`}
                          {reward.type === 'coins' && `${reward.amount} coins`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Misiones del evento */}
                {selectedEvent.missions.length > 0 && (
                  <div>
                    <h4 className="text-[#D4AF37] font-black text-sm mb-2">📋 MISIONES DEL EVENTO</h4>
                    <div className="space-y-2">
                      {selectedEvent.missions.map(mission => (
                        <div key={mission.id} className="bg-black/50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-white text-sm">{mission.title}</div>
                              <div className="text-xs text-gray-400">{mission.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-green-400">+{mission.rewardCoins * (selectedEvent.multiplier || 1)}💰</div>
                              <div className="text-xs text-[#00F3FF]">+{mission.rewardXP * (selectedEvent.multiplier || 1)}⭐</div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progreso</span>
                              <span className="text-[#D4AF37]">{mission.currentValue}/{mission.requiredValue}</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-500"
                                style={{ width: `${(mission.currentValue / mission.requiredValue) * 100}%`, backgroundColor: selectedEvent.color }}
                              />
                            </div>
                          </div>
                          {mission.isCompleted && !mission.isCompleted && (
                            <button
                              onClick={() => claimMissionReward(selectedEvent, mission)}
                              className="w-full mt-2 py-1 text-sm font-black rounded transition-all"
                              style={{ backgroundColor: selectedEvent.color, color: 'black' }}
                            >
                              RECLAMAR RECOMPENSA
                            </button>
                          )}
                          {mission.isCompleted && (
                            <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                              <CheckCircle size={12} /> Completado
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Animación de recompensa */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed bottom-24 right-6 z-50 p-4 rounded-lg shadow-xl"
            style={{ backgroundColor: showReward.event.color, color: 'black' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-2xl">
                {showReward.event.icon}
              </div>
              <div>
                <div className="text-sm font-black">¡RECOMPENSA DEL EVENTO!</div>
                <div className="font-bold">{showReward.event.name}</div>
                <div className="text-xs">+{showReward.coins} coins +{showReward.xp} XP</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}