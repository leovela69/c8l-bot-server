import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json();

    if (!code || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros (code, userId)' }, { status: 400 });
    }

    // 1. Buscar código de invitación
    const { data: invite, error: inviteError } = await supabase
      .from('invitation_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Código de invitación no válido o inexistente.' }, { status: 404 });
    }

    if (invite.is_used) {
      return NextResponse.json({ error: 'El código de invitación ya ha sido utilizado.' }, { status: 400 });
    }

    // 2. Actualizar código de invitación
    const { error: updateInviteError } = await supabase
      .from('invitation_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('code', code.trim().toUpperCase());

    if (updateInviteError) {
      return NextResponse.json({ error: 'Error al procesar el código de invitación.' }, { status: 500 });
    }

    // 3. Promocionar usuario a Premium en Supabase
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        plan: 'premium'
      })
      .eq('id', userId);

    if (updateUserError) {
      return NextResponse.json({ error: 'Código canjeado, pero no se pudo actualizar el rango del usuario en la base de datos.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Código de invitación canjeado con éxito. ¡Ahora eres Premium!',
      plan: 'premium'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
