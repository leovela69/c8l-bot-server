// lib/backpack/items.ts
export const BACKPACK_ITEMS = [
  // Categoría Comida (XP básica para salas)
  { id: 'cookie', name: '🍪 Galleta Mágica', description: 'Una galleta crujiente con chispas de energía', emoji: '🍪', category: 'food', xp_value: 5, friendship_xp: 3, cover_boost: 1 },
  { id: 'coffee', name: '☕ Café C8L', description: 'El café oficial del estudio. Da energía extra', emoji: '☕', category: 'food', xp_value: 10, friendship_xp: 5, cover_boost: 2 },
  { id: 'pizza', name: '🍕 Pizza Musical', description: 'Comparte una pizza con amigos', emoji: '🍕', category: 'food', xp_value: 20, friendship_xp: 10, cover_boost: 3 },
  { id: 'cake', name: '🎂 Tarta de Cumpleaños', description: '¡Celebra los logros!', emoji: '🎂', category: 'food', xp_value: 50, friendship_xp: 25, cover_boost: 5 },
  
  // Categoría Juguetes (para amistad y diversión)
  { id: 'balloon', name: '🎈 Globo de Colores', description: 'Un globo para alegrar la sala', emoji: '🎈', category: 'toy', xp_value: 8, friendship_xp: 4, cover_boost: 1 },
  { id: 'teddy', name: '🧸 Osito C8L', description: 'Un abrazo suave y cálido', emoji: '🧸', category: 'toy', xp_value: 15, friendship_xp: 8, cover_boost: 2 },
  { id: 'confetti', name: '🎊 Confeti de Fiesta', description: '¡Explosión de alegría!', emoji: '🎊', category: 'toy', xp_value: 30, friendship_xp: 15, cover_boost: 4 },
  
  // Categoría Emociones (para apoyo emocional)
  { id: 'hug', name: '🤗 Abrazo Virtual', description: 'Un abrazo para cuando más lo necesitas', emoji: '🤗', category: 'emotion', xp_value: 12, friendship_xp: 12, cover_boost: 2 },
  { id: 'highfive', name: '✋ Choca Esos Cinco', description: '¡Buen trabajo!', emoji: '✋', category: 'emotion', xp_value: 8, friendship_xp: 8, cover_boost: 1 },
  { id: 'heart', name: '💖 Corazón C8L', description: 'Un gesto de cariño especial', emoji: '💖', category: 'emotion', xp_value: 25, friendship_xp: 25, cover_boost: 5 },
  { id: 'star', name: '⭐ Estrella de Apoyo', description: 'Eres una estrella', emoji: '⭐', category: 'emotion', xp_value: 40, friendship_xp: 20, cover_boost: 8 },
  
  // Categoría Especiales (difíciles de conseguir, gran impacto)
  { id: 'rainbow', name: '🌈 Arcoíris C8L', description: 'Un arcoíris llena la sala de magia', emoji: '🌈', category: 'special', xp_value: 100, friendship_xp: 50, cover_boost: 15, is_limited: true },
  { id: 'unicorn', name: '🦄 Unicornio Legendario', description: 'El regalo más especial. ¡Trae buena suerte!', emoji: '🦄', category: 'special', xp_value: 200, friendship_xp: 100, cover_boost: 30, is_limited: true },
];

// Niveles de Sala (1 a 99)
export const ROOM_LEVELS = Array.from({ length: 99 }, (_, i) => ({
  level: i + 1,
  xp_needed: 100 + (i * 15), // Nivel 1: 100, Nivel 99: ~1570
  effects: {
    level_10: '💫 Efecto de partículas básicas',
    level_25: '✨ Iluminación especial',
    level_50: '🎆 Fuegos artificiales en nivel up',
    level_75: '👑 Asientos VIP en la sala',
    level_99: '🌟 Sala Legendaria - Efectos exclusivos',
  },
  visibility_multiplier: 1 + (i * 0.02), // +2% por nivel, máximo +196%
}));

// Niveles de Amistad
export const FRIENDSHIP_LEVELS = [
  { level: 1, name: '👋 Conocidos', xp_needed: 0, bonus: 'Sin bonificaciones' },
  { level: 2, name: '🤝 Amigos', xp_needed: 50, bonus: '+5% XP en duetos' },
  { level: 3, name: '🎵 Cómplices Musicales', xp_needed: 150, bonus: '+10% XP en duetos, desbloquea regalo 🤗' },
  { level: 4, name: '💪 Equipo C8L', xp_needed: 300, bonus: '+15% XP en duetos, desbloquea regalo 💖' },
  { level: 5, name: '🔥 Hermanos de Escenario', xp_needed: 500, bonus: '+20% XP en duetos, +1 regalo gratis/semana' },
  { level: 6, name: '👑 Leyendas Unidos', xp_needed: 800, bonus: '+30% XP en duetos, avatar de amistad exclusivo' },
  { level: 7, name: '💎 Almas Gemelas', xp_needed: 1200, bonus: '+50% XP en duetos, regalo especial desbloqueado' },
  { level: 8, name: '🌟 Eternos C8L', xp_needed: 1800, bonus: 'XP compartida, efectos visuales al entrar juntos' },
  { level: 9, name: '⚡ Inseparables', xp_needed: 2500, bonus: 'Bonus máximo en todo, título exclusivo' },
  { level: 10, name: '🏆 Maestros de la Amistad', xp_needed: 3500, bonus: '¡Máximo nivel! Todos los beneficios duplicados' },
];