// supabase/functions/health-monitor/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const startTime = Date.now();
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Run simple health check queries on system config and users
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('key')
      .limit(5);

    if (configError) throw configError;

    const { count, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    const latency = Date.now() - startTime;

    return new Response(JSON.stringify({
      status: 'healthy',
      database: 'connected',
      latencyMs: latency,
      usersCount: count || 0,
      configSampleKeys: config?.map(c => c.key) || [],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
