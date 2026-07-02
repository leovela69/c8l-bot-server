-- Migration to add secure RPC functions for casino bets and wins
-- This ensures all operations are atomic and secure.

CREATE OR REPLACE FUNCTION place_bet(
  p_user_id UUID,
  p_amount INT
) RETURNS JSON AS $$
DECLARE
  v_current_coins INT;
BEGIN
  -- Get current coins
  SELECT coins INTO v_current_coins FROM users WHERE id = p_user_id;
  
  -- Check if user has enough coins
  IF v_current_coins IS NULL OR v_current_coins < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Coins insuficientes', 'coins', COALESCE(v_current_coins, 0));
  END IF;
  
  -- Deduct coins
  UPDATE users SET coins = coins - p_amount WHERE id = p_user_id
  RETURNING coins INTO v_current_coins;
  
  -- Keep wallets table in sync if it exists for the user
  UPDATE wallets SET coin_balance = v_current_coins WHERE user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'coins', v_current_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION award_win(
  p_user_id UUID,
  p_amount INT
) RETURNS JSON AS $$
DECLARE
  v_current_coins INT;
BEGIN
  -- Add coins
  UPDATE users SET coins = COALESCE(coins, 0) + p_amount WHERE id = p_user_id
  RETURNING coins INTO v_current_coins;
  
  -- Keep wallets table in sync if it exists for the user
  UPDATE wallets SET coin_balance = v_current_coins WHERE user_id = p_user_id;
  
  RETURN json_build_object('success', true, 'coins', v_current_coins);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
