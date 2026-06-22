// =====================================================
// C8L AGENT v21.0 — TEXTOS LEGALES DE BLOQUEO
// Textos completos con base legal para cada opción
// =====================================================

export const BLOCK_3_DAYS_LEGAL = {
  id: 'block_3_days',
  legalText: (reason: string, startDate: string, endDate: string) => `
⚖️ SANCIÓN LEVE - SUSPENSIÓN TEMPORAL DE 3 DÍAS

De conformidad con el Artículo 6.1.f) del RGPD y la Ley Orgánica 3/2018,
se procede a la suspensión temporal de su cuenta por 3 días.

📋 Motivo: ${reason}
📅 Inicio: ${startDate}
📅 Fin: ${endDate}

🛡️ DERECHOS DEL USUARIO:
• Derecho de acceso (Art. 15 RGPD)
• Derecho de rectificación (Art. 16 RGPD)
• Derecho de supresión (Art. 17 RGPD)
• Derecho a presentar una apelación: moderacion@c8l.agency

🔒 PROTECCIÓN DE DATOS:
C8L Agency garantiza la protección de sus datos conforme a la normativa vigente.
Responsable del Tratamiento: C8L Agency (Corazones Locos Family)
Email de contacto: legal@c8l.agency

🤖 C8L Guardian - Bot Oficial de Moderación`,

  userMessage: (reason: string, endDate: string) =>
    `🚨 Has sido bloqueado por 3 días debido a: ${reason}\n\n⚖️ Base Legal: Artículo 6.1.f) RGPD - Interés legítimo\n📋 Tipo: Sanción Leve\n📅 Fecha de desbloqueo: ${endDate}\n🔄 Apelación: moderacion@c8l.agency\n📧 Protección de Datos: legal@c8l.agency\n\n🤖 C8L Guardian - Bot Oficial`
};

export const BLOCK_7_DAYS_LEGAL = {
  id: 'block_7_days',
  legalText: (reason: string, startDate: string, endDate: string) => `
⚖️ SANCIÓN MEDIA - SUSPENSIÓN TEMPORAL DE 7 DÍAS

Conforme al Artículo 6.1.f) del RGPD y al Artículo 173.1 del Código Penal,
y en aplicación de la Ley Orgánica 3/2018, se procede a la suspensión
temporal de su cuenta por 7 días.

📋 Motivo: ${reason}
📅 Inicio: ${startDate}
📅 Fin: ${endDate}

🛡️ DERECHOS DEL USUARIO (RGPD):
• Derecho de acceso (Art. 15 RGPD)
• Derecho de rectificación (Art. 16 RGPD)
• Derecho de supresión (Art. 17 RGPD)
• Derecho de oposición (Art. 21 RGPD)
• Derecho a presentar una apelación (48h): moderacion@c8l.agency
• Derecho a reclamación ante AEPD: www.aepd.es

🔒 PROTECCIÓN DE DATOS:
C8L Agency garantiza la protección de sus datos conforme a la normativa vigente.
Responsable del Tratamiento: C8L Agency (Corazones Locos Family)
Email: legal@c8l.agency

⚠️ Esta sanción será revisada por un moderador humano en 48h.

🤖 C8L Guardian - Bot Oficial de Moderación`,

  userMessage: (reason: string, endDate: string) =>
    `🚨 Has sido bloqueado por 7 días debido a: ${reason}\n\n⚖️ Base Legal: Artículo 6.1.f) RGPD + Artículo 173.1 CP\n📋 Tipo: Sanción Media\n📅 Fecha de desbloqueo: ${endDate}\n🔄 Apelación: moderacion@c8l.agency (48h)\n📧 Protección de Datos: legal@c8l.agency\n\n🤖 C8L Guardian - Bot Oficial`
};


export const BLOCK_30_DAYS_LEGAL = {
  id: 'block_30_days',
  legalText: (reason: string, startDate: string, endDate: string) => `
⚖️ SANCIÓN GRAVE - SUSPENSIÓN TEMPORAL DE 30 DÍAS

Conforme al Artículo 6.1.f) del RGPD, a los Artículos 169, 173.1, 184 y 510
del Código Penal, y a la Ley Orgánica 3/2018, se procede a la suspensión
temporal de su cuenta por 30 días.

📋 Motivo: ${reason}
📅 Inicio: ${startDate}
📅 Fin: ${endDate}

🛡️ DERECHOS DEL USUARIO (RGPD):
• Derecho de acceso (Art. 15 RGPD)
• Derecho de rectificación (Art. 16 RGPD)
• Derecho de supresión (Art. 17 RGPD)
• Derecho de oposición (Art. 21 RGPD)
• Derecho a intervención humana (Art. 22 RGPD)
• Derecho a presentar una apelación (48h): moderacion@c8l.agency
• Derecho a reclamación ante AEPD: www.aepd.es

🔒 PROTECCIÓN DE DATOS:
C8L Agency garantiza la protección de sus datos conforme a la normativa vigente.
Responsable del Tratamiento: C8L Agency (Corazones Locos Family)
Email: legal@c8l.agency

⚠️ Esta sanción será revisada por un moderador humano en 48h.
⚠️ Dos infracciones graves consecutivas pueden derivar en bloqueo permanente.

🤖 C8L Guardian - Bot Oficial de Moderación`,

  userMessage: (reason: string, endDate: string) =>
    `🚨 Has sido bloqueado por 30 días debido a: ${reason}\n\n⚖️ Base Legal: Art. 6.1.f) RGPD + Art. 169, 173, 184, 510 CP\n📋 Tipo: Sanción Grave\n📅 Fecha de desbloqueo: ${endDate}\n🔄 Apelación: moderacion@c8l.agency (48h)\n📧 Protección de Datos: legal@c8l.agency\n⚠️ La reincidencia puede derivar en bloqueo permanente.\n\n🤖 C8L Guardian - Bot Oficial`
};

export const BLOCK_PERMANENT_LEGAL = {
  id: 'block_permanent',
  legalText: (reason: string, startDate: string) => `
⚖️ SANCIÓN CRÍTICA - SUSPENSIÓN DEFINITIVA DE CUENTA

Conforme al Artículo 6.1.f) del RGPD, a los Artículos 169.1, 173.1, 197,
248, 401 y 510.1 del Código Penal, a la Ley Orgánica 3/2018, a la Ley de
Seguridad Ciudadana (Art. 36.6) y al Artículo 18 de la Constitución,
se procede a la suspensión DEFINITIVA de su cuenta.

📋 Motivo: ${reason}
📅 Fecha de bloqueo: ${startDate}
🔒 Duración: PERMANENTE

🛡️ DERECHOS DEL USUARIO (RGPD):
• Derecho de acceso (Art. 15 RGPD)
• Derecho de rectificación (Art. 16 RGPD)
• Derecho de supresión (Art. 17 RGPD - cuando proceda)
• Derecho de oposición (Art. 21 RGPD)
• Derecho a intervención humana (Art. 22 RGPD)
• Derecho a reclamación ante AEPD: www.aepd.es
• Derecho a la tutela judicial efectiva (Art. 24 CE)

⚠️ NO PROCEDE APELACIÓN (Cláusula 4.5.3)

🔒 MEDIDAS ADICIONALES:
• Bloqueo de IPs asociadas
• Bloqueo de dispositivos
• Notificación a autoridades (si aplica)
• Registro permanente en lista negra
• Impedimento de nuevas cuentas

🔒 PROTECCIÓN DE DATOS:
C8L Agency garantiza la protección de sus datos conforme a la normativa vigente.
Responsable del Tratamiento: C8L Agency (Corazones Locos Family)
Email: legal@c8l.agency

🤖 C8L Guardian - Bot Oficial de Moderación`,

  userMessage: (reason: string) =>
    `⛔ Has sido bloqueado PERMANENTEMENTE debido a: ${reason}\n\n⚖️ Base Legal: Art. 6.1.f) RGPD + Arts. 169, 173, 197, 248, 401, 510 CP\n📋 Tipo: Sanción Crítica\n🔒 Duración: PERMANENTE\n📧 Protección de Datos: legal@c8l.agency\n⚠️ NO PROCEDE APELACIÓN\n\n🔒 Medidas adicionales:\n• Bloqueo de IPs y dispositivos\n• Registro en lista negra\n• Comunicación a autoridades (si aplica)\n\n🤖 C8L Guardian - Bot Oficial`
};

// Obtener texto legal por severidad
export function getLegalText(severity: string) {
  switch (severity) {
    case 'leve': return BLOCK_3_DAYS_LEGAL;
    case 'media': return BLOCK_7_DAYS_LEGAL;
    case 'grave': return BLOCK_30_DAYS_LEGAL;
    case 'critica': return BLOCK_PERMANENT_LEGAL;
    default: return BLOCK_3_DAYS_LEGAL;
  }
}
