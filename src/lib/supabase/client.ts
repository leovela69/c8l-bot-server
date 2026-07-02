import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate that the URL looks like a real Supabase URL before calling createClient.
// If the env vars are placeholders or missing, we expose a no-op mock client so the
// app renders without crashing during local development without credentials.
const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('tu_url') &&
  !supabaseUrl.includes('your-');

let supabase: SupabaseClient;

if (isConfigured) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
} else {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[C8L] Supabase no está configurado. Edita .env.local con tu NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY reales. Usando cliente mock.'
    );
  }
  const createQueryBuilder = () => {
    const handler: ProxyHandler<any> = {
      get(target, prop) {
        if (prop === 'then') {
          return (resolve: any) => resolve({ data: [], error: null, count: 0 });
        }
        if (prop === 'single' || prop === 'maybeSingle') {
          return () => Promise.resolve({ data: null, error: null });
        }
        return () => new Proxy({}, handler);
      }
    };
    return new Proxy({}, handler);
  };

  // Minimal no-op mock so imports don't crash at module evaluation time
  supabase = {
    from: () => createQueryBuilder(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase no configurado' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
    removeChannel: () => {},
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient;
}

export { supabase };
