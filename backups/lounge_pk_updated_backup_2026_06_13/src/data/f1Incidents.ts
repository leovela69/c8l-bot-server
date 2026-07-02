export type IncidentType = 'ACCIDENTE' | 'AVERÍA' | 'PINCHAZO' | 'SAFETY_CAR' | 'LIMPIO';

export interface F1Incident {
  tipo: IncidentType;
  descripcion: { es: string; en: string };
  requiereSafetyCar: boolean;
  eliminaAfectado: boolean;
  speedPenalty: number;      // 0.0–1.0 — multiplied during safety car phase (1.0 = no penalty)
  durationFrames: number;    // how many animation frames the SC phase lasts
  logColor: string;          // Tailwind color class for the log entry
}

// 30% chance of an incident, 70% clean race
export const INCIDENT_PROBABILITY = 0.30;

export const F1_INCIDENTS: F1Incident[] = [
  {
    tipo: 'ACCIDENTE',
    descripcion: {
      es: '🚨 ¡CHOQUE MÚLTIPLE en la curva! Dos coches se van contra el muro. Safety Car desplegado.',
      en: '🚨 MULTI-CAR CRASH on the corner! Two cars hit the wall. Safety Car deployed.',
    },
    requiereSafetyCar: true,
    eliminaAfectado: true,
    speedPenalty: 0.38,
    durationFrames: 180,
    logColor: '#FF0055',
  },
  {
    tipo: 'AVERÍA',
    descripcion: {
      es: '💨 ¡Humo negro en el motor! El coche pierde potencia y abandona la carrera.',
      en: '💨 Black smoke from the engine! The car loses power and retires.',
    },
    requiereSafetyCar: false,
    eliminaAfectado: true,
    speedPenalty: 1.0,
    durationFrames: 0,
    logColor: '#F59E0B',
  },
  {
    tipo: 'PINCHAZO',
    descripcion: {
      es: '💥 ¡ESPECTACULAR! Una rueda explota en plena recta. Safety Car activado inmediatamente.',
      en: '💥 SPECTACULAR! A tyre explodes at full speed. Safety Car immediately deployed.',
    },
    requiereSafetyCar: true,
    eliminaAfectado: true,
    speedPenalty: 0.40,
    durationFrames: 150,
    logColor: '#EF4444',
  },
  {
    tipo: 'SAFETY_CAR',
    descripcion: {
      es: '🚗 Incidente menor en pista. Safety Car neutraliza la carrera temporalmente.',
      en: '🚗 Minor incident on track. Safety Car temporarily neutralises the race.',
    },
    requiereSafetyCar: true,
    eliminaAfectado: false,
    speedPenalty: 0.42,
    durationFrames: 120,
    logColor: '#FBBF24',
  },
  {
    tipo: 'LIMPIO',
    descripcion: {
      es: '✅ Carrera limpia. Todos los pilotos al límite absoluto.',
      en: '✅ Clean race. All drivers pushing to the absolute limit.',
    },
    requiereSafetyCar: false,
    eliminaAfectado: false,
    speedPenalty: 1.0,
    durationFrames: 0,
    logColor: '#10B981',
  },
];

// Pick a random incident (weighted: 70% clean, 30% drama)
export function resolveIncident(): F1Incident {
  if (Math.random() >= INCIDENT_PROBABILITY) {
    return F1_INCIDENTS.find((i) => i.tipo === 'LIMPIO')!;
  }
  const dramaPool = F1_INCIDENTS.filter((i) => i.tipo !== 'LIMPIO');
  return dramaPool[Math.floor(Math.random() * dramaPool.length)];
}
