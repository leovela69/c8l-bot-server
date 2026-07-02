'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { raidSounds } from '@/lib/raid/soundEngine';
import { supabase } from '@/lib/supabase/client';

// ============================================
// TIPOS DE REGALOS (ATAQUES)
// ============================================
const GIFTS = [
  { 
    id: 'rose', 
    name: '🌹 ROSA', 
    damage: 100, 
    cost: 50, 
    color: '#FF69B4', 
    animation: '🌹',
    description: 'Un ramo de rosas electrónicas'
  },
  { 
    id: 'lightning', 
    name: '⚡ RELÁMPAGO', 
    damage: 250, 
    cost: 100, 
    color: '#00F3FF', 
    animation: '⚡',
    description: 'Rayo multiplicador'
  },
  { 
    id: 'music_note', 
    name: '🎵 NOTA MÁGICA', 
    damage: 400, 
    cost: 150, 
    color: '#D4AF37', 
    animation: '🎵🎶',
    description: 'Melodía encantada'
  },
  { 
    id: 'golden_mic', 
    name: '🎤 MIC DORADO', 
    damage: 1000, 
    cost: 500, 
    color: '#FFD700', 
    animation: '🎤✨',
    description: 'El micrófono legendario'
  },
  { 
    id: 'crown', 
    name: '👑 CORONA C8L', 
    damage: 2500, 
    cost: 1000, 
    color: '#D4AF37', 
    animation: '👑💎',
    description: 'La corona del rey del estudio'
  },
  { 
    id: 'diamond_storm', 
    name: '💎 TORMENTA DE DIAMANTES', 
    damage: 5000, 
    cost: 2000, 
    color: '#E0FFFF', 
    animation: '💎💎💎',
    description: 'Lluvia de diamantes puros'
  }
];

// ============================================
// JEFES DISPONIBLES
// ============================================
const BOSSES = [
  { 
    id: 1,
    name: 'Rey del Ruido', 
    emoji: '👑🎸', 
    hp: 8000, 
    color: '#FF0055', 
    rewardMultiplier: 1,
    description: 'Un monstruo del volumen que distorsiona todo a su paso',
    specialAbility: 'Cada 30s, absorbe 500 HP de regalos'
  },
  { 
    id: 2,
    name: 'Dios del Silencio', 
    emoji: '🎧😈', 
    hp: 15000, 
    color: '#9B59B6', 
    rewardMultiplier: 1.5,
    description: 'Sumerge el estudio en un vacío auditivo',
    specialAbility: 'Reduce el daño de los regalos en 20%'
  },
  { 
    id: 3,
    name: 'Mega Track Infernal', 
    emoji: '🔥🎚️', 
    hp: 30000, 
    color: '#FF4500', 
    rewardMultiplier: 2,
    description: 'El track maldito que quema los decibelios',
    specialAbility: 'Contraataca con fuego cada 45s'
  },
  { 
    id: 4,
    name: 'DJ Fantasma', 
    emoji: '👻🎧', 
    hp: 50000, 
    color: '#00CED1', 
    rewardMultiplier: 3,
    description: 'Un productor espectral de otra dimensión',
    specialAbility: 'Aparece y desaparece, solo vulnerable 15s'
  },
  { 
    id: 5,
    name: 'Rey Midas del Beat', 
    emoji: '👑🎼', 
    hp: 100000, 
    color: '#D4AF37', 
    rewardMultiplier: 5,
    description: 'Todo lo que toca se convierte en oro... o en ruido',
    specialAbility: 'Dobla las recompensas pero tiene escudo cada 60s'
  }
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
interface RaidBossProps {
  streamerId: string;
  streamerName?: string;
  userCoins: number;
  setUserCoins: (coins: number) => void;
  userName?: string;
  onGiftSent?: (giftType: string, damage: number, userName: string) => void;
  onRaidEnd?: (winner: string, totalDamage: number) => void;
}

export function RaidBoss({ 
  streamerId, 
  streamerName = "Streamer", 
  userCoins, 
  setUserCoins, 
  userName = "Tú",
  onGiftSent, 
  onRaidEnd 
}: RaidBossProps) {
  
  // Estados del juego
  const [currentBoss, setCurrentBoss] = useState(BOSSES[0]);
  const [bossHp, setBossHp] = useState(BOSSES[0].hp);
  const [maxHp, setMaxHp] = useState(BOSSES[0].hp);
  const [isActive, setIsActive] = useState(true);
  const [nextRaidTimer, setNextRaidTimer] = useState(0);
  const [bossAbilityTimer, setBossAbilityTimer] = useState(0);
  const [bossShield, setBossShield] = useState(false);
  const [clanContribution, setClanContribution] = useState(0);
  
  // Participantes y estadísticas
  const [participants, setParticipants] = useState<{ name: string; damage: number; gifts: Record<string, number> }[]>([]);
  const [lastAttacks, setLastAttacks] = useState<{ userName: string; gift: string; damage: number; timestamp: Date }[]>([]);
  const [totalDamage, setTotalDamage] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // UI states
  const [showReward, setShowReward] = useState<{ winner: string; damage: number; reward: number } | null>(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboCount, setComboCount] = useState(0);
  const [lastComboTime, setLastComboTime] = useState(Date.now());
  
  // Timer para la raid
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
      
      // Habilidad especial del jefe cada 30 segundos
      if (bossAbilityTimer <= 0 && isActive && bossHp > 0) {
        activateBossAbility();
        setBossAbilityTimer(30);
      } else {
        setBossAbilityTimer(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, bossAbilityTimer, bossHp]);
  
  // Activar habilidad especial del jefe
  const activateBossAbility = () => {
    if (!isActive || bossHp <= 0) return;
    
    let newHp = bossHp;
    
    switch(currentBoss.id) {
      case 1: // Rey del Ruido - absorbe HP
        const absorb = Math.min(500, bossHp);
        newHp = bossHp - absorb;
        break;
      case 2: // Dios del Silencio - escudo
        setBossShield(true);
        setTimeout(() => setBossShield(false), 10000);
        break;
      case 3: // Mega Track Infernal - contraataque
        break;
      case 4: // DJ Fantasma - desaparece
        break;
      case 5: // Rey Midas - escudo dorado
        setBossShield(true);
        setTimeout(() => setBossShield(false), 10000);
        break;
    }
    
    setLastAttacks(prev => [{
      userName: '⚔️ JEFE ⚔️',
      gift: currentBoss.emoji,
      damage: 0,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
    
    if (newHp !== bossHp) {
      setBossHp(Math.max(0, newHp));
    }
  };
  
  // Función de ataque
  const attack = async (gift: typeof GIFTS[0]) => {
    if (!isActive) {
      alert('⏳ No hay raid activa ahora. Espera la próxima.');
      return;
    }
    
    if (bossHp <= 0) {
      alert('🏆 ¡El jefe ya fue derrotado! Espera la próxima raid.');
      return;
    }
    
    if (userCoins < gift.cost) {
      alert(`❌ Necesitas ${gift.cost} coins para enviar ${gift.name}`);
      return;
    }
    
    if (bossShield && currentBoss.id !== 5) {
      alert(`🛡️ ¡${currentBoss.name} tiene escudo activo! Espera ${bossAbilityTimer}s 🛡️`);
      return;
    }

    // Reproducir sonido según el tipo de regalo
    if (gift.id === 'crown' || gift.id === 'diamond_storm') {
      raidSounds.playLegendaryGiftSound();
    } else if (comboCount > 2) {
      raidSounds.playComboSound(comboCount);
    } else {
      raidSounds.playAttackSound(gift.id);
    }
    
    // Calcular daño (con combo)
    const now = Date.now();
    let currentCombo = comboMultiplier;
    let newComboCount = comboCount;
    
    if (now - lastComboTime < 3000) { // 3 segundos para mantener combo
      newComboCount = comboCount + 1;
      currentCombo = 1 + (newComboCount * 0.1);
      setComboMultiplier(currentCombo);
    } else {
      newComboCount = 1;
      setComboMultiplier(1);
    }
    
    setComboCount(newComboCount);
    setLastComboTime(now);
    
    // Daño final con shield reduction
    let finalDamage = Math.floor(gift.damage * currentCombo);
    if (bossShield) {
      finalDamage = Math.floor(finalDamage * 0.5);
    }
    
    // Aplicar daño
    const newHp = Math.max(0, bossHp - finalDamage);
    setBossHp(newHp);
    setTotalDamage(prev => prev + finalDamage);
    
    // Restar costo al usuario
    setUserCoins(userCoins - gift.cost);
    
    // Registrar ataque localmente
    const attackRecord = {
      userName: userName,
      gift: gift.name,
      damage: finalDamage,
      timestamp: new Date()
    };
    setLastAttacks(prev => [attackRecord, ...prev].slice(0, 10));
    
    // Registrar participante localmente
    setParticipants(prev => {
      const existing = prev.find(p => p.name === userName);
      if (existing) {
        return prev.map(p => 
          p.name === userName 
            ? { 
                ...p, 
                damage: p.damage + finalDamage,
                gifts: { ...p.gifts, [gift.id]: (p.gifts[gift.id] || 0) + 1 }
              } 
            : p
        );
      }
      return [...prev, { 
        name: userName, 
        damage: finalDamage, 
        gifts: { [gift.id]: 1 } 
      }];
    });
    
    // Notificar al padre
    onGiftSent?.(gift.name, finalDamage, userName);

    // Registrar en Supabase (persistencia)
    try {
      await supabase.from('raid_attacks').insert({
        user_name: userName,
        gift_type: gift.id,
        damage: finalDamage,
        boss_id: currentBoss.id,
        timestamp: new Date()
      });
      
      // Actualizar contribución al clan
      await supabase.rpc('add_clan_damage', {
        p_user_id: streamerId,
        p_damage: finalDamage
      });
      
      setClanContribution(prev => prev + finalDamage);
    } catch (error) {
      console.error('Error guardando ataque:', error);
    }
    
    // Verificar si boss murió
    if (newHp === 0) {
      await endRaid();
    }
  };
  
  // Finalizar raid
  const endRaid = async () => {
    setIsActive(false);
    
    // Ordenar participantes por daño
    const sorted = [...participants].sort((a, b) => b.damage - a.damage);
    const topDonors = sorted.slice(0, 5);
    const winner = topDonors[0] || { name: streamerName, damage: 0 };
    
    // Calcular recompensas
    const baseReward = 500 + Math.floor(totalDamage * 0.05);
    const streamerReward = Math.floor(baseReward * currentBoss.rewardMultiplier);
    
    // Dar recompensa al streamer
    setUserCoins(userCoins + streamerReward);
    
    setShowReward({ 
      winner: winner.name, 
      damage: winner.damage, 
      reward: streamerReward 
    });
    
    onRaidEnd?.(winner.name, totalDamage);

    // Guardar récord en Supabase
    try {
      await supabase.from('raid_records').insert({
        boss_id: currentBoss.id,
        boss_name: currentBoss.name,
        total_damage: totalDamage,
        duration_seconds: timeElapsed,
        participants_count: participants.length,
        winner_name: winner.name,
        winner_damage: winner.damage
      });
      
      raidSounds.playVictorySound();
    } catch (error) {
      console.error('Error guardando récord:', error);
    }
    
    // Programar próxima raid (120 segundos)
    setNextRaidTimer(120);
    const timer = setInterval(() => {
      setNextRaidTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          startNewRaid();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Iniciar nueva raid
  const startNewRaid = () => {
    let availableBosses = BOSSES;
    if (totalDamage > 50000) {
      availableBosses = BOSSES.filter(b => b.id >= 3);
    } else if (totalDamage > 20000) {
      availableBosses = BOSSES.filter(b => b.id >= 2);
    }
    
    const newBoss = availableBosses[Math.floor(Math.random() * availableBosses.length)];
    setCurrentBoss(newBoss);
    setBossHp(newBoss.hp);
    setMaxHp(newBoss.hp);
    setIsActive(true);
    setParticipants([]);
    setLastAttacks([]);
    setTotalDamage(0);
    setTimeElapsed(0);
    setShowReward(null);
    setComboMultiplier(1);
    setComboCount(0);
    setBossShield(false);
    setBossAbilityTimer(0);
  };
  
  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Porcentaje de vida
  const hpPercentage = (bossHp / maxHp) * 100;
  
  return (
    <div className="border-4 border-black bg-gradient-to-b from-red-950 to-black p-6 shadow-[8px_8px_0px_#FF0055] relative overflow-hidden">
      
      {/* === EFECTOS DE FONDO === */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent" />
      </div>
      
      {/* === HEADER DEL JEFE === */}
      <div className="text-center mb-6 relative">
        <motion.div
          animate={{ scale: bossHp > 0 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: bossHp > 0 ? Infinity : 0 }}
        >
          <div className="text-7xl mb-2 filter drop-shadow-lg">{currentBoss.emoji}</div>
        </motion.div>
        <h2 className="text-3xl font-black text-white" style={{ color: currentBoss.color }}>{currentBoss.name}</h2>
        <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">{currentBoss.description}</p>
        <div className="text-xs text-gray-500 mt-1">✨ {currentBoss.specialAbility} ✨</div>
      </div>
      
      {/* === TIMER Y ESTADO === */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <div className="bg-black/50 px-3 py-1 rounded-full">
          <span className="text-[#D4AF37]">⏱️ {formatTime(timeElapsed)}</span>
        </div>
        <div className="bg-black/50 px-3 py-1 rounded-full">
          <span className="text-[#00F3FF]">💥 Daño total: {totalDamage.toLocaleString()}</span>
        </div>
        {nextRaidTimer > 0 && (
          <div className="bg-black/50 px-3 py-1 rounded-full animate-pulse">
            <span className="text-[#FF0055]">⏳ Próxima raid: {nextRaidTimer}s</span>
          </div>
        )}
      </div>
      
      {/* === BARRA DE VIDA DEL JEFE === */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-mono text-gray-300">❤️ HP DEL JEFE</span>
          <span className="font-mono text-gray-300">{Math.floor(hpPercentage)}%</span>
        </div>
        <div className="h-8 bg-black border-2 border-red-500 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-red-600 to-red-400 flex items-center justify-end pr-3 text-xs font-bold text-white"
            initial={{ width: '100%' }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 0.3 }}
            style={{ width: `${hpPercentage}%` }}
          >
            {hpPercentage < 30 && <span className="animate-pulse">⚡ EN PELIGRO ⚡</span>}
          </motion.div>
        </div>
        <div className="text-right text-xs text-gray-500 mt-1">
          {bossHp.toLocaleString()} / {maxHp.toLocaleString()} HP
          {bossShield && <span className="ml-2 text-[#D4AF37] animate-pulse">🛡️ ESCUDO ACTIVO</span>}
        </div>
      </div>
      
      {/* === COMBO MULTIPLIER === */}
      {comboCount > 1 && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-4"
        >
          <span className="bg-[#00F3FF] text-black px-4 py-2 rounded-full font-black text-lg">
            🔥 COMBO x{comboMultiplier.toFixed(1)} ({comboCount} golpes seguidos) 🔥
          </span>
        </motion.div>
      )}
      
      {/* === GRID DE REGALOS (ATAQUES) === */}
      <div className="mb-6">
        <h3 className="text-sm font-mono text-[#D4AF37] mb-2 text-center">⚔️ SELECCIONA TU ATAQUE ⚔️</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {GIFTS.map(gift => (
            <motion.button
              key={gift.id}
              onClick={() => attack(gift)}
              disabled={!isActive || bossHp <= 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-black border-2 border-[#D4AF37] text-center hover:bg-[#D4AF37]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
            >
              <div className="text-3xl">{gift.animation}</div>
              <div className="text-xs font-mono text-[#D4AF37] font-bold">{gift.damage}</div>
              <div className="text-[10px] text-gray-500">{gift.cost} coins</div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {gift.description}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* === TABLA DE PARTICIPANTES === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        
        {/* Top Daño */}
        <div className="bg-black/50 p-3 border border-gray-800">
          <div className="text-xs text-[#D4AF37] mb-2 flex items-center gap-2">
            <span>🏆 TOP DAÑO 🏆</span>
            <span className="text-gray-500 text-[10px]">(Los mejores guerreros)</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {participants.slice(0, 5).map((p, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-between text-xs py-1 border-b border-gray-800"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5">{i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                  <span className="truncate max-w-[120px]">{p.name}</span>
                </span>
                <span className="text-[#FF0055] font-mono">{p.damage.toLocaleString()} daño</span>
              </motion.div>
            ))}
            {participants.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">
                😢 Sin participantes aún. ¡Sé el primero en atacar!
              </div>
            )}
          </div>
        </div>
        
        {/* Últimos ataques (feed en vivo) */}
        <div className="bg-black/50 p-3 border border-gray-800">
          <div className="text-xs text-[#00F3FF] mb-2 flex items-center gap-2">
            <span>⚡ ÚLTIMOS ATAQUES ⚡</span>
            <span className="text-gray-500 text-[10px]">(En vivo)</span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {lastAttacks.map((attackRecord, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between text-xs py-1 border-b border-gray-800 font-mono"
              >
                <span className="text-[#D4AF37] truncate max-w-[100px]">{attackRecord.userName}</span>
                <span className="text-gray-400">{attackRecord.gift}</span>
                <span className="text-green-400">+{attackRecord.damage.toLocaleString()}</span>
              </motion.div>
            ))}
            {lastAttacks.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-4">
                💤 Esperando ataques...
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* === ANIMACIÓN DE RECOMPENSA === */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 backdrop-blur-sm"
          >
            <div className="text-center p-8 border-4 border-[#D4AF37] bg-black max-w-md mx-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-4"
              >
                🏆
              </motion.div>
              <div className="text-3xl font-black text-[#D4AF37] mb-2">¡JEFE DERROTADO!</div>
              <div className="text-sm text-gray-400 mb-4">
                {currentBoss.name} ha caído después de {formatTime(timeElapsed)}
              </div>
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <div className="text-xs text-gray-400">🏅 TOP DONADOR</div>
                <div className="text-xl font-bold text-[#D4AF37]">{showReward.winner}</div>
                <div className="text-xs text-gray-500">{showReward.damage.toLocaleString()} de daño</div>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-4">
                +{showReward.reward.toLocaleString()} COINS
              </div>
              <button 
                onClick={() => setShowReward(null)}
                className="px-8 py-3 bg-[#D4AF37] text-black font-black text-lg hover:bg-[#FFD700] transition-all"
              >
                RECLAMAR RECOMPENSAS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* === SALDO ACTUAL DEL USUARIO Y CONTRIBUCIÓN === */}
      <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="text-sm font-mono text-gray-500 text-left">
          <div>💰 TU SALDO: <span className="text-[#D4AF37] font-bold">{userCoins.toLocaleString()} COINS</span></div>
          <div className="text-xs text-purple-400">🛡️ CONTRIBUCIÓN CLAN: {clanContribution.toLocaleString()} DAÑO</div>
        </div>
        {!isActive && nextRaidTimer === 0 && (
          <button
            onClick={startNewRaid}
            className="px-4 py-2 bg-[#00F3FF] text-black font-black text-sm hover:bg-[#00F3FF]/80 transition-all animate-pulse"
          >
            🔄 INICIAR RAID MANUALMENTE
          </button>
        )}
      </div>
      
    </div>
  );
}