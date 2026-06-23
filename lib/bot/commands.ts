/**
 * C8L Bot v2.0 — Sistema de Comandos
 * El bot entiende comandos directos y responde con acciones
 */

export interface CommandResult {
  message: string
  action?: 'navigate' | 'mission' | 'profile' | 'ranking' | 'help' | 'admin' | 'none'
  navigateTo?: string
  data?: any
}

interface Command {
  triggers: string[]
  description: string
  handler: (args: string, username: string) => CommandResult
}

const COMMANDS: Command[] = [
  // === NAVEGACIÓN ===
  {
    triggers: ['casino', 'jugar', 'slots', 'ruleta', 'blackjack', 'apostar'],
    description: 'Ir al Casino Quantum',
    handler: () => ({
      message: '🎰 ¡Vamos al Casino Quantum! Slots, Ruleta y Blackjack te esperan. Juega responsable.\n\n👉 Te redirijo al Casino...',
      action: 'navigate',
      navigateTo: '/casino'
    })
  },
  {
    triggers: ['estudio', 'musica', 'cancion', 'crear musica', 'beat', 'producir'],
    description: 'Ir al Estudio Musical',
    handler: () => ({
      message: '🎵 ¡Vamos al Estudio! Crea tu canción con IA. Elige género, BPM, mood y a producir.\n\n👉 Te llevo al Estudio...',
      action: 'navigate',
      navigateTo: '/studio'
    })
  },
  {
    triggers: ['karaoke', 'cantar', 'canto'],
    description: 'Ir al Karaoke',
    handler: () => ({
      message: '🎤 ¡A cantar! La Sala de Canto te espera con medidores de tono y energía en tiempo real.\n\n👉 Vamos al Karaoke...',
      action: 'navigate',
      navigateTo: '/karaoke'
    })
  },
  {
    triggers: ['tv', 'videos', 'contenido', 'ver'],
    description: 'Ir a C8L TV',
    handler: () => ({
      message: '📺 ¡C8L TV! 8 videos esperándote. Música, tutoriales, gaming y más.\n\n👉 Te llevo a la TV...',
      action: 'navigate',
      navigateTo: '/tv'
    })
  },
  {
    triggers: ['bandos', 'familia', 'clan', 'guerra'],
    description: 'Ir a Bandos',
    handler: () => ({
      message: '⚔️ ¡Sistema de Bandos! Crea tu familia, participa en guerras y sube en el ranking.\n\n👉 Vamos a Bandos...',
      action: 'navigate',
      navigateTo: '/bandos'
    })
  },
  {
    triggers: ['lives', 'directo', 'stream', 'streaming'],
    description: 'Ir a Lives',
    handler: () => ({
      message: '📺 ¡Lives en directo! Mira streams, envía regalos y participa.\n\n👉 Te llevo a Lives...',
      action: 'navigate',
      navigateTo: '/lives'
    })
  },
  {
    triggers: ['monedero', 'wallet', 'coins', 'dinero', 'saldo'],
    description: 'Ver tu Monedero',
    handler: () => ({
      message: '💰 Tu Monedero C8L. Aquí ves tus Coins, Diamantes y BID.\n\n👉 Abriendo Monedero...',
      action: 'navigate',
      navigateTo: '/monedero'
    })
  },
  {
    triggers: ['inicio', 'home', 'principal', 'menu'],
    description: 'Ir al Home',
    handler: () => ({
      message: '🏠 ¡De vuelta al inicio! Todas las secciones te esperan.\n\n👉 Vamos al Home...',
      action: 'navigate',
      navigateTo: '/'
    })
  },

  // === PERFIL Y CUENTA ===
  {
    triggers: ['perfil', 'mi cuenta', 'mi perfil', 'cuenta'],
    description: 'Ver tu perfil',
    handler: (_args, username) => ({
      message: `👤 Tu perfil, @${username}:\n\n👉 Te llevo a tu cuenta...`,
      action: 'navigate',
      navigateTo: '/registro'
    })
  },
  {
    triggers: ['nivel', 'xp', 'experiencia', 'mi nivel', 'level'],
    description: 'Ver tu nivel y XP',
    handler: (_args, username) => ({
      message: '', // Se rellena en chatEngine con formatLevelProfile
      action: 'profile',
    })
  },

  // === MISIONES ===
  {
    triggers: ['mision', 'misiones', 'tarea', 'tareas', 'daily', 'diaria'],
    description: 'Ver misiones disponibles',
    handler: (_args, username) => ({
      message: '🎯 ¡Misiones del día! Completa tareas para ganar C8L Coins.',
      action: 'mission',
    })
  },

  // === RANKING ===
  {
    triggers: ['ranking', 'top', 'mejores', 'leaderboard'],
    description: 'Ver el ranking de XP',
    handler: () => ({
      message: '', // Se rellena en chatEngine con datos reales
      action: 'ranking',
    })
  },

  // === AYUDA ===
  {
    triggers: ['ayuda', 'help', 'comandos', 'que puedes hacer', 'opciones'],
    description: 'Lista de comandos',
    handler: () => ({
      message: `🤖 **Comandos del Bot C8L:**\n\n🎰 "casino" — Ir a jugar\n🎵 "estudio" — Crear música\n🎤 "karaoke" — Cantar\n📺 "tv" — Ver videos\n⚔️ "bandos" — Familias y guerras\n📺 "lives" — Streams en directo\n💰 "monedero" — Tu wallet\n👤 "perfil" — Tu cuenta\n🎯 "misión" — Tareas diarias\n🏆 "ranking" — Top usuarios\n❓ "ayuda" — Este menú\n\nO simplemente háblame de lo que quieras. Soy filósofo moderno. 🧠`,
      action: 'help',
    })
  },

  // === NORMAS ===
  {
    triggers: ['normas', 'reglas', 'legal', 'terminos'],
    description: 'Ver normas de la comunidad',
    handler: () => ({
      message: '⚖️ **Normas de C8L:**\n\n1. Respeto mutuo\n2. Sin spam\n3. Contenido apropiado\n4. Privacidad (no datos ajenos)\n5. Juego responsable\n6. Una sola cuenta\n7. Reporta lo inadecuado\n\n🔵 Leve: 3 días | 🟡 Media: 7 días | 🟠 Grave: 30 días | 🔴 Permanente\n\n👉 Te llevo a Legal...',
      action: 'navigate',
      navigateTo: '/legal'
    })
  },
]

/**
 * Procesa un mensaje y detecta si es un comando
 * Retorna null si no es un comando (para pasar al chat IA normal)
 */
export function processCommand(message: string, username: string): CommandResult | null {
  const lower = message.toLowerCase().trim()
  
  // Detectar saludo → respuesta rápida
  if (/^(hola|hey|buenas|que tal|hi|hello|ey|wena)$/i.test(lower)) {
    return {
      message: `👋 ¡Qué pasa, @${username}! Soy el Bot de C8L. ¿Qué te apetece?\n\n🎰 Casino | 🎵 Estudio | 🎤 Karaoke | 📺 TV | ⚔️ Bandos\n\nO escribe "ayuda" para ver todo lo que puedo hacer.`,
      action: 'none'
    }
  }

  // Buscar comando que coincida
  for (const cmd of COMMANDS) {
    for (const trigger of cmd.triggers) {
      if (lower.includes(trigger)) {
        return cmd.handler(lower.replace(trigger, '').trim(), username)
      }
    }
  }

  return null // No es un comando, pasar a IA
}

/**
 * Retorna la lista de comandos para referencia
 */
export function getCommandList(): { trigger: string; description: string }[] {
  return COMMANDS.map(c => ({
    trigger: c.triggers[0],
    description: c.description
  }))
}
