// =====================================================
// C8L AGENT v20.0 — SISTEMA DE BLOQUEOS
// Acciones ejecutables por el bot
// =====================================================

import { supabase } from '@/lib/supabase/client';

const RESTRICTIONS = {
  light: ['chat_public', 'games_multiplayer', 'singing_room', 'lives', 'challenges', 'casino', 'factions', 'events'],
  medium: ['chat_public', 'games_multiplayer', 'singing_room', 'lives', 'challenges', 'casino', 'factions', 'events', 'profile_edits'],
  severe: ['chat_public', 'games_multiplayer', 'singing_room', 'lives', 'challenges', 'casino', 'factions', 'events', 'profile_edits', 'content_upload', 'private_messages'],
  permanent: ['chat_public', 'games_multiplayer', 'singing_room', 'lives', 'challenges', 'casino', 'factions', 'events', 'profile_edits', 'content_upload', 'private_messages', 'account_creation', 'ip_access', 'device_access'],
};

async function getUserInfractions(userId: string) {
  const { data } = await supabase.from('user_infractions').select('*').eq('user_id', userId).eq('status', 'active');
  return data || [];
}

async function saveBlock(block: any) {
  await supabase.from('active_sanctions').insert(block);
}

async function notifyUser(userId: string, notification: any) {
  await supabase.from('bot_moderation_logs').insert({
    action_type: 'user_notification', target_user_id: userId,
    details: notification, is_auto_executed: true
  });
}

async function notifyModerators(data: any) {
  await supabase.from('bot_moderation_logs').insert({
    action_type: 'moderator_alert', target_user_id: data.userId,
    details: data, requires_review: true
  });
}

async function logAction(action: string, userId: string, details: any) {
  await supabase.from('bot_moderation_logs').insert({
    action_type: action, target_user_id: userId, details, is_auto_executed: true
  });
}

// =====================================================
// OPCIÓN 1: BLOQUEO LEVE — 3 DÍAS
// =====================================================
export async function applyBlock3Days(userId: string, reason: string) {
  const prev = await getUserInfractions(userId);
  if (prev.length > 2) return applyBlock7Days(userId, reason);

  const block = {
    user_id: userId, sanction_type: 'temporary_ban', days: 3,
    start_date: new Date(), end_date: new Date(Date.now() + 3*24*60*60*1000),
    reason, restrictions: RESTRICTIONS.light, is_permanent: false
  };
  await saveBlock(block);
  await notifyUser(userId, { title: '🚨 Bloqueo de 3 días', message: `Bloqueado por: ${reason}`, endDate: block.end_date });
  await logAction('block_3_days', userId, { reason });
  return { status: 'blocked', days: 3 };
}

// =====================================================
// OPCIÓN 2: BLOQUEO MEDIO — 7 DÍAS
// =====================================================
export async function applyBlock7Days(userId: string, reason: string) {
  const prev = await getUserInfractions(userId);
  if (prev.filter(i => (i as any).severity === 'media').length > 1) return applyBlock30Days(userId, reason);

  const block = {
    user_id: userId, sanction_type: 'temporary_ban', days: 7,
    start_date: new Date(), end_date: new Date(Date.now() + 7*24*60*60*1000),
    reason, restrictions: RESTRICTIONS.medium, is_permanent: false
  };
  await saveBlock(block);
  await notifyUser(userId, { title: '🚨 Bloqueo de 7 días', message: `Bloqueado por: ${reason}`, endDate: block.end_date });
  await notifyModerators({ type: 'block_7_days', userId, reason });
  await logAction('block_7_days', userId, { reason });
  return { status: 'blocked', days: 7 };
}

// =====================================================
// OPCIÓN 3: BLOQUEO GRAVE — 30 DÍAS
// =====================================================
export async function applyBlock30Days(userId: string, reason: string) {
  const prev = await getUserInfractions(userId);
  const hasGrave = prev.some(i => (i as any).severity === 'grave');
  if (hasGrave) {
    const shouldPerm = prev.filter(i => (i as any).severity === 'grave').length > 1;
    if (shouldPerm) return applyPermanentBlock(userId, reason);
  }

  const block = {
    user_id: userId, sanction_type: 'temporary_ban', days: 30,
    start_date: new Date(), end_date: new Date(Date.now() + 30*24*60*60*1000),
    reason, restrictions: RESTRICTIONS.severe, is_permanent: false
  };
  await saveBlock(block);
  await notifyUser(userId, { title: '🚨 Bloqueo de 30 días', message: `Bloqueado por: ${reason}`, endDate: block.end_date, severity: 'high' });
  await notifyModerators({ type: 'block_30_days', userId, reason, previousInfractions: prev });
  await logAction('block_30_days', userId, { reason });
  return { status: 'blocked', days: 30 };
}

// =====================================================
// OPCIÓN 4: BLOQUEO PERMANENTE
// =====================================================
export async function applyPermanentBlock(userId: string, reason: string) {
  const block = {
    user_id: userId, sanction_type: 'permanent_ban', days: 0,
    start_date: new Date(), end_date: null,
    reason, restrictions: RESTRICTIONS.permanent, is_permanent: true
  };
  await saveBlock(block);
  await notifyUser(userId, { title: '⛔ Bloqueo Permanente', message: `Bloqueado permanentemente: ${reason}`, severity: 'critical' });
  await notifyModerators({ type: 'permanent_block', userId, reason });
  await logAction('permanent_block', userId, { reason });
  return { status: 'permanent', days: 0 };
}

// =====================================================
// VERIFICAR SI USUARIO ESTÁ BLOQUEADO
// =====================================================
export async function isBlocked(userId: string): Promise<{ blocked: boolean; type?: string; reason?: string; endDate?: Date }> {
  const { data } = await supabase.from('active_sanctions').select('*').eq('user_id', userId).limit(1);
  if (!data || data.length === 0) return { blocked: false };
  const sanction = data[0];
  if (!sanction.is_permanent && sanction.end_date && new Date(sanction.end_date) < new Date()) {
    await supabase.from('active_sanctions').delete().eq('id', sanction.id);
    return { blocked: false };
  }
  return { blocked: true, type: sanction.sanction_type, reason: sanction.reason, endDate: sanction.end_date };
}

// =====================================================
// LEVANTAR SANCIÓN
// =====================================================
export async function liftSanction(userId: string, reason: string) {
  await supabase.from('active_sanctions').delete().eq('user_id', userId);
  await logAction('lift_sanction', userId, { reason });
  return { status: 'unblocked' };
}
