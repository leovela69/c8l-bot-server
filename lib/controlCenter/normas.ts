/**
 * C8L Control Center — Normas de la Comunidad & Sistema de Sanciones
 * Integrado con el sistema de bloqueo automático
 */

export interface Norma {
  id: number
  titulo: string
  descripcion: string
  categoria: 'comportamiento' | 'contenido' | 'seguridad' | 'casino'
}

export interface Sancion {
  nivel: 'leve' | 'media' | 'grave' | 'permanente'
  color: string
  emoji: string
  duracion: string
  dias: number // -1 = permanente
  descripcion: string
  articulos: string
  apelacion: string
}

export const NORMAS: Norma[] = [
  { id: 1, titulo: 'Respeto mutuo', descripcion: 'No acoso, insultos ni discriminación.', categoria: 'comportamiento' },
  { id: 2, titulo: 'Sin spam', descripcion: 'No contenido repetitivo ni publicidad no autorizada.', categoria: 'contenido' },
  { id: 3, titulo: 'Contenido apropiado', descripcion: 'No material violento, sexual o ilegal.', categoria: 'contenido' },
  { id: 4, titulo: 'Privacidad', descripcion: 'No compartir datos de otros sin consentimiento.', categoria: 'seguridad' },
  { id: 5, titulo: 'Juego responsable', descripcion: 'El casino es entretenimiento. jugarbien.es', categoria: 'casino' },
  { id: 6, titulo: 'Una cuenta', descripcion: 'No multicuentas ni suplantación.', categoria: 'seguridad' },
  { id: 7, titulo: 'Colaboración', descripcion: 'Reporta comportamientos inadecuados.', categoria: 'comportamiento' },
]

export const SANCIONES: Sancion[] = [
  {
    nivel: 'leve',
    color: 'blue',
    emoji: '🔵',
    duracion: '3 días',
    dias: 3,
    descripcion: 'Spam, lenguaje ofensivo leve.',
    articulos: 'Art. 6.1.f RGPD',
    apelacion: '48h'
  },
  {
    nivel: 'media',
    color: 'yellow',
    emoji: '🟡',
    duracion: '7 días',
    dias: 7,
    descripcion: 'Acoso verbal, enlaces maliciosos.',
    articulos: 'Art. 173.1 CP',
    apelacion: 'Revisión humana'
  },
  {
    nivel: 'grave',
    color: 'orange',
    emoji: '🟠',
    duracion: '30 días',
    dias: 30,
    descripcion: 'Odio, amenazas, acoso sexual.',
    articulos: 'Arts. 169, 510 CP',
    apelacion: 'Revisión obligatoria'
  },
  {
    nivel: 'permanente',
    color: 'red',
    emoji: '🔴',
    duracion: 'Permanente',
    dias: -1,
    descripcion: 'Amenazas muerte, estafa, suplantación.',
    articulos: 'CP Arts. múltiples',
    apelacion: 'Sin apelación'
  },
]

export interface Bloqueo {
  id: string
  userId: string
  username: string
  nivel: 'leve' | 'media' | 'grave' | 'permanente'
  normaViolada: number // ID de la norma
  motivo: string
  fechaInicio: string
  fechaFin: string | null // null = permanente
  activo: boolean
  ejecutadoPor: 'bot' | 'admin'
}

const STORAGE_KEY = 'c8l_bloqueos'

export function getBloqueos(): Bloqueo[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function addBloqueo(bloqueo: Bloqueo): void {
  const bloqueos = getBloqueos()
  bloqueos.unshift(bloqueo)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bloqueos))
}

export function removeBloqueo(id: string): void {
  const bloqueos = getBloqueos()
  const idx = bloqueos.findIndex(b => b.id === id)
  if (idx >= 0) {
    bloqueos[idx].activo = false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bloqueos))
  }
}

export function isUserBlocked(username: string): Bloqueo | null {
  const bloqueos = getBloqueos()
  const activo = bloqueos.find(b => b.username === username && b.activo)
  if (!activo) return null
  
  // Check if expired
  if (activo.fechaFin) {
    const fin = new Date(activo.fechaFin)
    if (fin < new Date()) {
      removeBloqueo(activo.id)
      return null
    }
  }
  return activo
}

/**
 * Calcula la fecha de fin según el nivel de sanción
 */
export function calcularFechaFin(nivel: 'leve' | 'media' | 'grave' | 'permanente'): string | null {
  const sancion = SANCIONES.find(s => s.nivel === nivel)
  if (!sancion || sancion.dias === -1) return null
  const fin = new Date()
  fin.setDate(fin.getDate() + sancion.dias)
  return fin.toISOString()
}
