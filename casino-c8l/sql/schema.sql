-- =====================================================
-- C8L AGENCY - SISTEMA DE BANDOS, MOCHILA Y ECONOMÍA
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLAS DE BANDOS (FAMILIAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    emblem TEXT DEFAULT '⚔️',
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    total_members INT DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faction_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    total_contributions INT DEFAULT 0,
    weekly_contributions INT DEFAULT 0,
    UNIQUE(faction_id, user_id)
);

CREATE TABLE IF NOT EXISTS faction_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    required_action TEXT,
    required_amount INT,
    xp_reward INT,
    coin_reward INT,
    diamond_reward INT DEFAULT 0,
    type TEXT DEFAULT 'weekly',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faction_task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES faction_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    UNIQUE(task_id, user_id)
);


CREATE TABLE IF NOT EXISTS faction_battles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction1_id UUID REFERENCES factions(id),
    faction2_id UUID REFERENCES factions(id),
    winner_id UUID REFERENCES factions(id),
    score1 INT DEFAULT 0,
    score2 INT DEFAULT 0,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    prize_pool INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. TABLAS DE MOCHILA Y REGALOS SOCIALES
-- =====================================================

CREATE TABLE IF NOT EXISTS backpack_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    rarity TEXT DEFAULT 'common',
    value INT DEFAULT 0,
    faction_xp INT DEFAULT 0,
    friend_xp INT DEFAULT 0,
    obtainable_from TEXT[],
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_backpack (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES backpack_items(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    acquired_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS backpack_gifts_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES backpack_items(id),
    quantity INT DEFAULT 1,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backpack_gifts_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    from_user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES backpack_items(id),
    quantity INT DEFAULT 1,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backpack_faction_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id),
    user_id UUID REFERENCES users(id),
    item_id UUID REFERENCES backpack_items(id),
    quantity INT DEFAULT 1,
    xp_generated INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =====================================================
-- 3. TABLAS DE MONEDERO Y ECONOMÍA
-- =====================================================

CREATE TABLE IF NOT EXISTS user_wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    coins INT DEFAULT 0,
    diamonds INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    currency_type TEXT NOT NULL,
    amount INT NOT NULL,
    description TEXT,
    related_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount INT NOT NULL,
    currency_type TEXT NOT NULL,
    method TEXT NOT NULL,
    account_details JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- =====================================================
-- 4. DATOS INICIALES (Regalos disponibles)
-- =====================================================

INSERT INTO backpack_items (name, description, emoji, rarity, value, faction_xp, friend_xp, obtainable_from) VALUES
('Galleta Mágica', 'Una galleta crujiente con chispas de energía', '🍪', 'common', 5, 2, 1, ARRAY['faction_task', 'game']),
('Café C8L', 'El café oficial del estudio', '☕', 'common', 10, 3, 2, ARRAY['faction_task', 'game']),
('Chicle de Menta', 'Refrescante y divertido', '🌿', 'common', 5, 1, 2, ARRAY['game']),
('Chocolate C8L', 'Dulce para compartir', '🍫', 'common', 8, 2, 3, ARRAY['faction_task']),
('Pizza Musical', 'Comparte una pizza con amigos', '🍕', 'rare', 20, 8, 5, ARRAY['faction_task', 'faction_battle']),
('Globo de Colores', 'Un globo para alegrar la sala', '🎈', 'rare', 15, 5, 5, ARRAY['game', 'event']),
('Osito C8L', 'Un abrazo suave y cálido', '🧸', 'rare', 25, 10, 8, ARRAY['faction_battle']),
('Pelota de Fútbol', 'Para jugar en equipo', '⚽', 'rare', 18, 6, 4, ARRAY['game']),
('Confeti de Fiesta', '¡Explosión de alegría!', '🎊', 'epic', 50, 20, 15, ARRAY['faction_battle', 'event']),
('Abrazo Virtual', 'Un abrazo para cuando más lo necesitas', '🤗', 'epic', 40, 15, 20, ARRAY['faction_task']),
('Corazón C8L', 'Un gesto de cariño especial', '💖', 'epic', 60, 25, 25, ARRAY['faction_battle', 'event']),
('Estrella Fugaz', 'Un deseo para compartir', '🌠', 'epic', 45, 18, 12, ARRAY['event']),
('Estrella de Apoyo', 'Eres una estrella', '⭐', 'legendary', 100, 50, 50, ARRAY['event']),
('Arcoíris C8L', 'Un arcoíris llena la sala de magia', '🌈', 'legendary', 200, 100, 80, ARRAY['event']),
('Unicornio Legendario', 'El regalo más especial', '🦄', 'legendary', 500, 200, 150, ARRAY['event']),
('Corona C8L', 'La corona del rey del estudio', '👑', 'legendary', 1000, 500, 300, ARRAY['event']);


-- =====================================================
-- 5. FUNCIONES RPC
-- =====================================================

CREATE OR REPLACE FUNCTION decrease_backpack_item(p_user_id UUID, p_item_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_backpack SET quantity = quantity - p_quantity
    WHERE user_id = p_user_id AND item_id = p_item_id;
    DELETE FROM user_backpack WHERE user_id = p_user_id AND item_id = p_item_id AND quantity <= 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_faction_xp_from_gift(p_user_id UUID, p_friend_id UUID, p_xp INT)
RETURNS VOID AS $$
DECLARE v_faction_id UUID;
BEGIN
    SELECT faction_id INTO v_faction_id FROM faction_members WHERE user_id = p_user_id;
    IF EXISTS (SELECT 1 FROM faction_members WHERE user_id = p_friend_id AND faction_id = v_faction_id) THEN
        UPDATE factions SET xp = xp + p_xp WHERE id = v_faction_id;
        PERFORM check_faction_level_up(v_faction_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_faction_level_up(p_faction_id UUID)
RETURNS VOID AS $$
DECLARE v_current_level INT; v_current_xp INT; v_xp_to_next INT;
BEGIN
    SELECT level, xp INTO v_current_level, v_current_xp FROM factions WHERE id = p_faction_id;
    v_xp_to_next := 100 + ((v_current_level - 1) * 20);
    IF v_current_xp >= v_xp_to_next THEN
        UPDATE factions SET level = v_current_level + 1, xp = v_current_xp - v_xp_to_next WHERE id = p_faction_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_coins(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_wallets SET coins = coins + p_amount, last_updated = NOW() WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_diamonds(p_user_id UUID, p_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_wallets SET diamonds = diamonds + p_amount, last_updated = NOW() WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION convert_coins_to_diamonds(p_user_id UUID, p_coins_amount INT, p_diamonds_amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_wallets SET coins = coins - p_coins_amount, diamonds = diamonds + p_diamonds_amount, last_updated = NOW()
    WHERE user_id = p_user_id;
    INSERT INTO wallet_transactions (user_id, type, currency_type, amount, description)
    VALUES (p_user_id, 'spend', 'coin', p_coins_amount, 'Conversión a diamantes');
    INSERT INTO wallet_transactions (user_id, type, currency_type, amount, description)
    VALUES (p_user_id, 'earn', 'diamond', p_diamonds_amount, 'Conversión desde coins');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION distribute_battle_rewards(p_battle_id UUID)
RETURNS VOID AS $$
DECLARE v_winner_id UUID; v_prize_pool INT;
BEGIN
    SELECT winner_id, prize_pool INTO v_winner_id, v_prize_pool FROM faction_battles WHERE id = p_battle_id;
    IF v_winner_id IS NOT NULL AND v_prize_pool > 0 THEN
        UPDATE faction_members SET total_contributions = total_contributions + (v_prize_pool / 2 / (SELECT COUNT(*) FROM faction_members WHERE faction_id = v_winner_id))
        WHERE faction_id = v_winner_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_faction_members_user ON faction_members(user_id);
CREATE INDEX IF NOT EXISTS idx_faction_members_faction ON faction_members(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_tasks_faction ON faction_tasks(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_battles_status ON faction_battles(status);
CREATE INDEX IF NOT EXISTS idx_user_backpack_user ON user_backpack(user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_sent_from ON backpack_gifts_sent(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gifts_received_user ON backpack_gifts_received(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
