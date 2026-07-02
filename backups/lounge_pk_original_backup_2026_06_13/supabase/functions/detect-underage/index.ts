// supabase/functions/detect-underage/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Obtener usuarios con edad no verificada pero actividad reciente
  const { data: suspiciousUsers } = await supabase
    .from('users')
    .select('id, email, last_ip, created_at, last_active')
    .eq('age_verified', false)
    .eq('underage_blocked', false)
    .gt('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  for (const user of suspiciousUsers || []) {
    // 2. Verificar si la IP pertenece a algún rango de colegio o biblioteca pública (simulado)
    const isEducationalIP = await checkEducationalIP(user.last_ip);
    
    // 3. Analizar horarios de conexión (si se conecta en horario escolar)
    const hour = new Date(user.last_active).getHours();
    const isSchoolHour = (hour >= 8 && hour <= 15);
    
    // 4. Revisar si ha usado lenguaje infantil o referencias a edad en mensajes (simulado)
    const { data: messages } = await supabase
      .from('clan_messages')
      .select('message')
      .eq('user_id', user.id)
      .limit(10);
    
    const childKeywords = ['tarea', 'colegio', 'escuela', 'profe', 'mis padres', 'soy menor', 'tengo 15', 'tengo 16', 'tengo 17'];
    let hasChildLanguage = false;
    if (messages) {
      hasChildLanguage = messages.some(m => 
        childKeywords.some(kw => m.message.toLowerCase().includes(kw))
      );
    }
    
    let confidence = 0;
    if (isEducationalIP) confidence += 40;
    if (isSchoolHour) confidence += 20;
    if (hasChildLanguage) confidence += 30;
    
    if (confidence >= 60) {
      // Bloquear usuario y crear alerta
      await supabase
        .from('users')
        .update({
          underage_blocked: true,
          block_reason: `Detectado por comportamiento: IP educacional=${isEducationalIP}, horario escolar=${isSchoolHour}, lenguaje infantil=${hasChildLanguage}. Confianza: ${confidence}%`,
          verification_status: 'failed'
        })
        .eq('id', user.id);
      
      await supabase.from('underage_alerts').insert({
        user_id: user.id,
        detected_by: 'system',
        detection_method: 'behavior',
        confidence_score: confidence,
        evidence: `IP: ${user.last_ip}, Horario: ${new Date(user.last_active).toLocaleString()}, Mensajes sospechosos: ${JSON.stringify(messages?.filter(m => childKeywords.some(kw => m.message.includes(kw))))}`,
        action_taken: 'blocked'
      });
    }
  }

  return new Response(JSON.stringify({ processed: suspiciousUsers?.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

async function checkEducationalIP(ip: string): Promise<boolean> {
  // Integrar con API de geolocalización o base de datos de IPs educativas
  // Por ahora, simulado
  return false;
}