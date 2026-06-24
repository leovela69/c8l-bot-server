// ==================== VIDEO DATA SHARED ====================
// Usado tanto por el homepage como por /watch

export interface VideoData {
  id: string
  title: string
  author: string
  authorEmoji: string
  authorSubscribers: string
  description: string
  views: number
  daysAgo: number
  likes: number
  dislikes: number
  duration: string
  thumbnail: string
  videoUrl: string
  category: string
  tags: string[]
  comments: CommentData[]
}

export interface CommentData {
  id: string
  author: string
  authorEmoji: string
  text: string
  likes: number
  timeAgo: string
  replies?: CommentData[]
}

export const CATEGORIES = [
  'Todas', 'Música', 'C8L Live', 'Beat', 'En Vivo', 'Dom', 'Bow',
  'Cluster', 'Freestyle', 'Beats', 'Salsa', 'Trap', 'Mixes', 'Comunidad'
]

export const CREATORS = [
  { name: 'Leo Vela', emoji: '🧡', subscribers: '12.4K', verified: true },
  { name: 'DJ Rayo', emoji: '⚡', subscribers: '8.7K', verified: true },
  { name: 'BeatMaster', emoji: '🎧', subscribers: '5.2K', verified: true },
  { name: 'Reina Melody', emoji: '👑', subscribers: '15.1K', verified: true },
  { name: 'MC Fuego', emoji: '🔥', subscribers: '3.8K', verified: false },
]

export const VIDEOS: VideoData[] = [
  {
    id: 'v1',
    title: 'LEO VELA - RITMO DE LA SELVA (DEEP HOUSE ORIGINAL MIX)',
    author: 'Leo Vela',
    authorEmoji: '🧡',
    authorSubscribers: '12.4K',
    description: `🎵 Nuevo track oficial de Leo Vela — "Ritmo de la Selva" combina los sonidos orgánicos de la naturaleza con beats profundos de Deep House a 122 BPM.

Producido enteramente en el Estudio C8L con herramientas de IA y masterización profesional.

🔥 Descarga el beat: próximamente en la Tienda C8L
🎧 Escúchalo en loop para máxima vibra

━━━━━━━━━━━━━━━━━━━━
🏷️ Tags: #DeepHouse #BoleroHouse #C8LAgency #LeoVela #RitmoDeLaSelva
━━━━━━━━━━━━━━━━━━━━

© 2026 C8L Agency - Todos los derechos reservados
Género: Bolero-House / Deep House
BPM: 122 | Key: Am`,
    views: 3120,
    daysAgo: 1,
    likes: 14,
    dislikes: 1,
    duration: '04:40',
    thumbnail: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Música',
    tags: ['Deep House', 'Bolero-House', 'C8L', 'Original Mix'],
    comments: [
      { id: 'c1', author: 'DJ Rayo', authorEmoji: '⚡', text: 'Hermano esto está BRUTAL 🔥🔥🔥 El drop a las 2:30 es otro nivel', likes: 8, timeAgo: '5 horas' },
      { id: 'c2', author: 'Reina Melody', authorEmoji: '👑', text: 'La fusión con sonidos de selva es genial. ¿Hacemos un duet?', likes: 12, timeAgo: '3 horas' },
      { id: 'c3', author: 'MC Fuego', authorEmoji: '🔥', text: 'Esto necesita un remix trap URGENTE', likes: 4, timeAgo: '1 hora' },
    ]
  },
  {
    id: 'v2',
    title: 'DJ RAYO - UNDERGROUND ACID LOUNGE SET (FULL SESSION)',
    author: 'DJ Rayo',
    authorEmoji: '⚡',
    authorSubscribers: '8.7K',
    description: `⚡ Sesión completa de 68 minutos grabada en el estudio subterráneo de C8L Agency.

Acid House + Lounge atmospheres + Progressive builds. Ideal para sesiones nocturnas.

Set grabado en una sola toma, sin edición.

🎧 Equipo: Pioneer DDJ-1000 + Ableton Push 3
🔊 Monitores: KRK Rokit 8

━━━━━━━━━━━━━━━━━━━━
Tracklist en los comentarios fijados
━━━━━━━━━━━━━━━━━━━━`,
    views: 4500,
    daysAgo: 1,
    likes: 26,
    dislikes: 2,
    duration: '68:00',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'Música',
    tags: ['Acid House', 'Lounge', 'DJ Set', 'Underground'],
    comments: [
      { id: 'c4', author: 'Leo Vela', authorEmoji: '🧡', text: '68 minutos de puro fuego acid. La transición del minuto 23 es de otro planeta 🌍', likes: 15, timeAgo: '12 horas' },
      { id: 'c5', author: 'BeatMaster', authorEmoji: '🎧', text: 'El sonido está impecable. ¿Qué plugins usaste para los leads?', likes: 7, timeAgo: '8 horas' },
    ]
  },
  {
    id: 'v3',
    title: 'REINA MELODY - BACHATA CYBERPUNK (LIVE COVER)',
    author: 'Reina Melody',
    authorEmoji: '👑',
    authorSubscribers: '15.1K',
    description: `👑 Cover en vivo de "Bachata Cyberpunk" — fusión de bachata tradicional con sintetizadores cyberpunk.

Grabado en directo durante el C8L Live Session #47.

Voz: Reina Melody
Guitarra: Sesión C8L
Producción: Estudio C8L IA

🎤 ¿Te gusta? Dale LIKE y SUSCRÍBETE para más covers en vivo cada semana.`,
    views: 8900,
    daysAgo: 1,
    likes: 87,
    dislikes: 3,
    duration: '05:30',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    category: 'Música',
    tags: ['Bachata', 'Cyberpunk', 'Live Cover', 'Vocal'],
    comments: [
      { id: 'c6', author: 'Leo Vela', authorEmoji: '🧡', text: 'La mejor voz de toda la plataforma. Sin discusión. 👑', likes: 23, timeAgo: '20 horas' },
      { id: 'c7', author: 'DJ Rayo', authorEmoji: '⚡', text: 'Necesitamos un remix de esto YA. Te mando DM.', likes: 11, timeAgo: '18 horas' },
      { id: 'c8', author: 'MC Fuego', authorEmoji: '🔥', text: 'La fusión bachata + cyberpunk es el futuro. Confirmado.', likes: 9, timeAgo: '15 horas' },
    ]
  },
  {
    id: 'v4',
    title: 'BEATMASTER - DAW HACKS: CREANDO BEATS EN 5 MINUTOS',
    author: 'BeatMaster',
    authorEmoji: '🎧',
    authorSubscribers: '5.2K',
    description: `🎧 Tutorial: Cómo crear un beat profesional de Bolero-House en solo 5 minutos.

Herramientas usadas:
- Ableton Live 12
- Serum (sintetizador)
- Estudio C8L IA (para la melodía base)
- RC-20 (para darle ese feeling vintage)

⏱️ Timestamps:
0:00 - Intro
0:30 - Kick & Hi-hats
1:45 - Bassline
2:50 - Melodía con IA
3:40 - Efectos & Bolero feel
4:30 - Mix final

📥 Descarga el proyecto: Link en la Tienda C8L`,
    views: 3200,
    daysAgo: 1,
    likes: 11,
    dislikes: 0,
    duration: '18:20',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    category: 'Beat',
    tags: ['Tutorial', 'DAW', 'Beat Making', 'Ableton'],
    comments: [
      { id: 'c9', author: 'Leo Vela', authorEmoji: '🧡', text: 'Increíble tutorial bro. El truco del RC-20 cambió mi vida 🙏', likes: 6, timeAgo: '1 día' },
      { id: 'c10', author: 'Reina Melody', authorEmoji: '👑', text: '¿Puedes hacer uno de cómo grabar vocals con el estudio C8L?', likes: 14, timeAgo: '22 horas' },
    ]
  },
  {
    id: 'v5',
    title: 'LEO VELA - BOLERO HOUSE SESSION VOL. 3',
    author: 'Leo Vela',
    authorEmoji: '🧡',
    authorSubscribers: '12.4K',
    description: `🎵 Bolero House Session Vol. 3 — La tercera entrega de la serie más escuchada de C8L Agency.

Fusión de bolero clásico con house moderno a 118 BPM. Voces emotivas + drops electrónicos.

Esta es la esencia de C8L: tradición + innovación.

🔥 Vol. 1: 15K views | Vol. 2: 22K views | Vol. 3: ¡Aquí estamos!`,
    views: 5600,
    daysAgo: 2,
    likes: 45,
    dislikes: 2,
    duration: '03:15',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    category: 'Música',
    tags: ['Bolero-House', 'Session', 'Vol 3', 'C8L Original'],
    comments: [
      { id: 'c11', author: 'DJ Rayo', authorEmoji: '⚡', text: 'Cada vol. es mejor que el anterior. Vol. 4 WHEN?? 🔥', likes: 19, timeAgo: '1 día' },
      { id: 'c12', author: 'BeatMaster', authorEmoji: '🎧', text: 'El mastering de este track está perfecto. Suena como un release de sello grande.', likes: 8, timeAgo: '1 día' },
    ]
  },
  {
    id: 'v6',
    title: 'DJ RAYO - NEON NIGHTS DEEP MIX (20 MIN)',
    author: 'DJ Rayo',
    authorEmoji: '⚡',
    authorSubscribers: '8.7K',
    description: `⚡ Mix corto de 20 minutos perfecto para noches de neón.

Deep House + Melodic Techno + Atmospheric pads.

Grabado en el Estudio C8L con visuales generados por IA en tiempo real.

🌃 Ideal para: trabajar de noche, conducir, sesiones creativas.`,
    views: 7200,
    daysAgo: 3,
    likes: 63,
    dislikes: 4,
    duration: '20:00',
    thumbnail: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    category: 'Mixes',
    tags: ['Deep Mix', 'Neon', 'Melodic Techno', 'Night'],
    comments: [
      { id: 'c13', author: 'Reina Melody', authorEmoji: '👑', text: 'Lo pongo siempre para componer. La vibra es perfecta 🌃✨', likes: 21, timeAgo: '2 días' },
      { id: 'c14', author: 'Leo Vela', authorEmoji: '🧡', text: 'Los visuales IA son una locura. Necesitamos hacer un live con esto.', likes: 16, timeAgo: '2 días' },
    ]
  },
  {
    id: 'v7',
    title: 'REINA MELODY - TECHNO SALSA DUET (FT. MC FUEGO)',
    author: 'Reina Melody',
    authorEmoji: '👑',
    authorSubscribers: '15.1K',
    description: `👑🔥 Duet épico: Techno + Salsa con MC Fuego.

La primera colaboración oficial entre Reina Melody y MC Fuego. Salsa urbana con drops de techno y versos freestyle.

Grabado durante el Duet Challenge #12 de C8L TV.

🏆 Este video ganó el premio al Mejor Duet de Junio 2026.`,
    views: 4100,
    daysAgo: 2,
    likes: 38,
    dislikes: 1,
    duration: '04:05',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Freestyle',
    tags: ['Duet', 'Techno Salsa', 'Freestyle', 'Collab'],
    comments: [
      { id: 'c15', author: 'Leo Vela', authorEmoji: '🧡', text: 'ESTO es lo que C8L representa. Fusión total. 🔥👑', likes: 14, timeAgo: '1 día' },
      { id: 'c16', author: 'DJ Rayo', authorEmoji: '⚡', text: 'MC Fuego entró con todo. Ese verso a las 2:15 🤯', likes: 9, timeAgo: '1 día' },
    ]
  },
  {
    id: 'v8',
    title: 'BEATMASTER - LIVE CODING BEATS SESSION (STREAMING)',
    author: 'BeatMaster',
    authorEmoji: '🎧',
    authorSubscribers: '5.2K',
    description: `🎧 Sesión de Live Coding: creando beats en vivo mientras explico cada paso.

Lo que verás:
- Programación de drums en tiempo real
- Sound design desde cero
- Uso de IA para generar melodías
- Tips de mixing en vivo

⚡ Grabado en stream para la comunidad C8L. Sin edición, sin filtros, puro proceso creativo.`,
    views: 2800,
    daysAgo: 4,
    likes: 19,
    dislikes: 1,
    duration: '14:50',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    category: 'C8L Live',
    tags: ['Live Coding', 'Stream', 'Beat Making', 'Tutorial'],
    comments: [
      { id: 'c17', author: 'Reina Melody', authorEmoji: '👑', text: 'Me encanta ver el proceso creativo en vivo. Más de estos porfa 🙏', likes: 7, timeAgo: '3 días' },
      { id: 'c18', author: 'MC Fuego', authorEmoji: '🔥', text: 'El tip del minuto 8 sobre layering me voló la cabeza', likes: 5, timeAgo: '3 días' },
    ]
  },
]

export function getVideoById(id: string): VideoData | undefined {
  return VIDEOS.find(v => v.id === id)
}

export function getRelatedVideos(currentId: string, limit: number = 6): VideoData[] {
  return VIDEOS.filter(v => v.id !== currentId).slice(0, limit)
}
