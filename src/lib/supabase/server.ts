import { supabase } from './client';

export async function createClient() {
  return supabase;
}
