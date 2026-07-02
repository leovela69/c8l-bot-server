export const dynamic = 'force-static';
// app/api/security/underage-attempt/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  const { birthDate, userAgent, ip } = await req.json();
  
  // Registrar intento de acceso de menor
  const { error } = await supabase
    .from('security_logs')
    .insert({
      type: 'underage_attempt',
      birth_date: birthDate,
      user_agent: userAgent,
      ip_address: ip || req.headers.get('x-forwarded-for'),
      created_at: new Date()
    });
  
  // Opcional: enviar alerta a moderadores por webhook
  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 **INTENTO DE ACCESO DE MENOR**\nFecha nacimiento: ${birthDate}\nIP: ${ip || 'desconocida'}\nUser Agent: ${userAgent}`,
      username: 'Security Bot'
    })
  });
  
  return NextResponse.json({ success: true });
}