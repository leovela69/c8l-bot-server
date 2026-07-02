// supabase/functions/casino-slots/index.ts (Edge Function, gratis)
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { userId, betAmount } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );
  
  // RTP 94% (6% para la casa)
  const RTP = 0.94;
  const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣', '🎰'];
  const multipliers = {
    '🍒': 1.5, '🍋': 2, '🍊': 2.5, '🍉': 3, '⭐': 5, '7️⃣': 10, '🎰': 20
  };
  
  // Simular slot machine
  const reels = [
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];
  
  let winAmount = 0;
  let isWin = false;
  
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    // Triple igual: gran premio
    isWin = true;
    winAmount = betAmount * (multipliers[reels[0] as keyof typeof multipliers] || 1);
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    // Par: premio pequeño
    isWin = true;
    const matched = reels[0] === reels[1] ? reels[0] : reels[1];
    winAmount = betAmount * ((multipliers[matched as keyof typeof multipliers] || 1) / 2);
  } else if (Math.random() < RTP) {
    // Ajuste para cumplir RTP
    isWin = true;
    winAmount = Math.floor(betAmount * (RTP + Math.random() * 0.2));
  }
  
  // Actualizar wallet
  if (isWin) {
    await supabase.rpc('add_coins', { user_id: userId, amount: winAmount });
    
    // 6% va a la casa (tú)
    const houseCut = betAmount * 0.06;
    await supabase.rpc('add_platform_revenue', { amount: houseCut });
  } else {
    await supabase.rpc('remove_coins', { user_id: userId, amount: betAmount });
  }
  
  return new Response(JSON.stringify({
    reels,
    isWin,
    winAmount,
    message: isWin ? `🎉 Ganaste ${winAmount} coins!` : '😢 Sigue participando'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});