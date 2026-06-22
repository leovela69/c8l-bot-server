// =====================================================
// C8L AGENT v21.0 — CONFIGURACIONES DE BLOQUEO CON BASE LEGAL
// Las 4 Opciones Completas
// =====================================================

export interface BlockConfig {
  id: string;
  name: string;
  duration: number; // 0 = permanente
  severity: 'leve' | 'media' | 'grave' | 'critica';
  color: string;
  icon: string;
  applicableInfractions: string[];
  restrictions: string[];
  legalBasis: {
    title: string;
    regulation: string;
    article: string;
    duration: string;
  };
  escalation?: {
    requiresHumanReview: boolean;
    notifyAdmins: boolean;
    notifyModerators: boolean;
    appealAvailable: boolean;
    reviewTime?: string;
    escalateToPermanent?: boolean;
    permanentThreshold?: number;
    legalAction?: boolean;
    policeNotification?: boolean;
  };
  additionalMeasures?: string[];
  userNotification: {
    title: string;
    message: string;
    details: string[];
    footer: string;
  };
}


// =====================================================
// OPCIÓN 1: BLOQUEO LEVE — 3 DÍAS
// Base Legal: Artículo 6.1.f) RGPD (Interés legítimo)
// =====================================================
export const BLOCK_3_DAYS: BlockConfig = {
  id: 'block_3_days',
  name: 'Bloqueo Leve',
  duration: 3,
  severity: 'leve',
  color: '#3B82F6',
  icon: '🔵',
  applicableInfractions: [
    'spam', 'offensive_language_light', 'toxic_behavior_first', 'terms_violation_light'
  ],
  restrictions: [
    'no_chat_public', 'no_games_multiplayer', 'no_singing_room',
    'no_lives', 'no_challenges', 'no_casino', 'no_factions', 'no_events'
  ],
  legalBasis: {
    title: 'Suspensión Temporal por Infracción Leve',
    regulation: 'Ley Orgánica 3/2018 de Protección de Datos y Garantía de Derechos Digitales',
    article: 'Artículo 6.1.f) RGPD - Interés legítimo',
    duration: '3 días naturales'
  },
  userNotification: {
    title: '🚨 Has sido bloqueado por 3 días',
    message: 'Tu cuenta ha sido suspendida temporalmente por 3 días debido a una infracción leve.',
    details: [
      '📅 Fecha de inicio: {startDate}',
      '📅 Fecha de desbloqueo: {endDate}',
      '📋 Motivo: {reason}',
      '🔄 Puedes apelar esta sanción en: {appealLink}',
      '📧 Contacto: moderacion@c8l.agency'
    ],
    footer: '🤖 C8L Guardian • Bot Oficial • Sujeto a Protección de Datos'
  }
};

// =====================================================
// OPCIÓN 2: BLOQUEO MEDIO — 7 DÍAS
// Base Legal: Artículo 6.1.f) RGPD + Términos de Servicio
// =====================================================
export const BLOCK_7_DAYS: BlockConfig = {
  id: 'block_7_days',
  name: 'Bloqueo Medio',
  duration: 7,
  severity: 'media',
  color: '#F59E0B',
  icon: '🟡',
  applicableInfractions: [
    'malicious_links', 'harassment_verbal', 'inappropriate_content',
    'copyright_violation', 'toxic_recurrent', 'terms_violation_medium'
  ],
  restrictions: [
    'no_chat_public', 'no_games_multiplayer', 'no_singing_room',
    'no_lives', 'no_challenges', 'no_casino', 'no_factions',
    'no_events', 'no_profile_edits'
  ],
  legalBasis: {
    title: 'Suspensión Temporal por Infracción Media',
    regulation: 'Ley Orgánica 3/2018 de Protección de Datos y Garantía de Derechos Digitales',
    article: 'Artículo 6.1.f) RGPD + Términos de Servicio - Cláusula 4.3',
    duration: '7 días naturales'
  },
  escalation: {
    requiresHumanReview: true,
    notifyAdmins: true,
    notifyModerators: true,
    appealAvailable: true,
    reviewTime: '24 horas'
  },
  userNotification: {
    title: '🚨 Has sido bloqueado por 7 días',
    message: 'Tu cuenta ha sido suspendida temporalmente por 7 días debido a una infracción media.',
    details: [
      '📅 Fecha de inicio: {startDate}',
      '📅 Fecha de desbloqueo: {endDate}',
      '📋 Motivo: {reason}',
      '🔄 Puedes apelar esta sanción en: {appealLink}',
      '📧 Contacto: moderacion@c8l.agency',
      '⚠️ Esta sanción será revisada por un moderador humano'
    ],
    footer: '🤖 C8L Guardian • Bot Oficial • Sujeto a Protección de Datos'
  }
};


// =====================================================
// OPCIÓN 3: BLOQUEO GRAVE — 30 DÍAS
// Base Legal: Artículo 6.1.f) RGPD + Código Penal
// =====================================================
export const BLOCK_30_DAYS: BlockConfig = {
  id: 'block_30_days',
  name: 'Bloqueo Grave',
  duration: 30,
  severity: 'grave',
  color: '#EF4444',
  icon: '🟠',
  applicableInfractions: [
    'hate_speech', 'physical_threat', 'violence_apology',
    'sexual_harassment', 'psychological_harassment',
    'privacy_violation', 'game_manipulation', 'community_sabotage'
  ],
  restrictions: [
    'no_chat_public', 'no_games_multiplayer', 'no_singing_room',
    'no_lives', 'no_challenges', 'no_casino', 'no_factions',
    'no_events', 'no_profile_edits', 'no_content_upload', 'no_private_messages'
  ],
  legalBasis: {
    title: 'Suspensión Temporal por Infracción Grave',
    regulation: 'Ley Orgánica 3/2018 de Protección de Datos y Garantía de Derechos Digitales',
    article: 'Artículo 6.1.f) RGPD + Código Penal - Artículos 169, 173, 184, 510',
    duration: '30 días naturales'
  },
  escalation: {
    requiresHumanReview: true,
    notifyAdmins: true,
    notifyModerators: true,
    appealAvailable: true,
    reviewTime: '48 horas',
    escalateToPermanent: true,
    permanentThreshold: 2
  },
  userNotification: {
    title: '🚨 Has sido bloqueado por 30 días',
    message: 'Tu cuenta ha sido suspendida temporalmente por 30 días debido a una infracción grave.',
    details: [
      '📅 Fecha de inicio: {startDate}',
      '📅 Fecha de desbloqueo: {endDate}',
      '📋 Motivo: {reason}',
      '🔄 Puedes apelar esta sanción en: {appealLink}',
      '📧 Contacto: moderacion@c8l.agency',
      '⚠️ Esta sanción será revisada por un moderador humano',
      '⚠️ Dos infracciones graves consecutivas derivan en bloqueo permanente'
    ],
    footer: '🤖 C8L Guardian • Bot Oficial • Sujeto a Protección de Datos'
  }
};

// =====================================================
// OPCIÓN 4: BLOQUEO PERMANENTE
// Base Legal: RGPD + Código Penal + Ley de Seguridad Ciudadana
// =====================================================
export const BLOCK_PERMANENT: BlockConfig = {
  id: 'block_permanent',
  name: 'Bloqueo Permanente',
  duration: 0,
  severity: 'critica',
  color: '#DC2626',
  icon: '🔴',
  applicableInfractions: [
    'death_threat', 'violence_incitement', 'collective_harassment',
    'explicit_violence', 'identity_impersonation', 'fraud',
    'data_leak', 'hate_incitement', 'critical_recidivism'
  ],
  restrictions: [
    'no_chat_public', 'no_games_multiplayer', 'no_singing_room',
    'no_lives', 'no_challenges', 'no_casino', 'no_factions',
    'no_events', 'no_profile_edits', 'no_content_upload',
    'no_private_messages', 'no_account_creation', 'no_ip_access', 'no_device_access'
  ],
  legalBasis: {
    title: 'Suspensión Definitiva de Cuenta',
    regulation: 'Ley Orgánica 3/2018 de Protección de Datos y Garantía de Derechos Digitales',
    article: 'Artículo 6.1.f) RGPD + Código Penal + Ley de Seguridad Ciudadana',
    duration: 'Permanente'
  },
  escalation: {
    requiresHumanReview: true,
    notifyAdmins: true,
    notifyModerators: true,
    appealAvailable: false,
    reviewTime: '24 horas',
    legalAction: true,
    policeNotification: true
  },
  additionalMeasures: [
    'Bloqueo de IP asociadas',
    'Bloqueo de dispositivos',
    'Notificación a autoridades',
    'Registro permanente en lista negra',
    'Impedimento de nuevas cuentas'
  ],
  userNotification: {
    title: '⛔ Has sido bloqueado PERMANENTEMENTE',
    message: 'Tu cuenta ha sido suspendida de forma definitiva debido a una infracción crítica.',
    details: [
      '📅 Fecha de bloqueo: {startDate}',
      '📋 Motivo: {reason}',
      '🔒 Esta decisión es definitiva',
      '📧 Contacto: legal@c8l.agency para asuntos legales',
      '⚠️ Se han tomado medidas adicionales de seguridad'
    ],
    footer: '🤖 C8L Guardian • Bot Oficial • Sujeto a Protección de Datos'
  }
};

// =====================================================
// EXPORTAR TODAS LAS CONFIGURACIONES
// =====================================================
export const ALL_BLOCK_CONFIGS = [BLOCK_3_DAYS, BLOCK_7_DAYS, BLOCK_30_DAYS, BLOCK_PERMANENT];

export function getBlockConfig(severity: string): BlockConfig {
  switch (severity) {
    case 'leve': return BLOCK_3_DAYS;
    case 'media': return BLOCK_7_DAYS;
    case 'grave': return BLOCK_30_DAYS;
    case 'critica': return BLOCK_PERMANENT;
    default: return BLOCK_3_DAYS;
  }
}
