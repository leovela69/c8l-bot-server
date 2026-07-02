-- =====================================================
-- C8L AGENCY - BASE DE DATOS COMPLETA (MASTER)
-- =====================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLA DE USUARIOS (extiende auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🎤',
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  coins INT DEFAULT 500,
  diamonds INT DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  banned_until TIMESTAMPTZ,
  gender TEXT DEFAULT 'unisex',
  audio_effects_settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- WALLETS (saldos separados)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  coin_balance BIGINT DEFAULT 0,
  star_balance BIGINT DEFAULT 0,
  bid_balance BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AMIGOS
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  friendship_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- NIVELES DE AMISTAD
CREATE TABLE friendship_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id),
  user2_id UUID REFERENCES users(id),
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  total_interactions INT DEFAULT 0,
  last_interaction TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- BANDOS (FACTIONS)
CREATE TABLE factions (
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

-- MIEMBROS DE BANDO
CREATE TABLE faction_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  total_contributions INT DEFAULT 0,
  UNIQUE(faction_id, user_id)
);

-- ACTIVIDADES DE BANDO
CREATE TABLE faction_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID REFERENCES factions(id),
  user_id UUID REFERENCES users(id),
  action_type TEXT,
  target_id TEXT,
  xp_earned INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CLANES (competitivos)
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  tag TEXT NOT NULL,
  emblem TEXT DEFAULT '🏆',
  level INT DEFAULT 1,
  total_points INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  motto TEXT DEFAULT '¡La música nos une!',
  required_level INT DEFAULT 1,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MIEMBROS DE CLAN
CREATE TABLE clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES clans(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member',
  total_points INT DEFAULT 0,
  weekly_points INT DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- ITEMS DE MOCHILA
CREATE TABLE backpack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  category TEXT,
  xp_value INT DEFAULT 10,
  friendship_xp INT DEFAULT 5,
  cover_boost INT DEFAULT 0,
  is_limited BOOLEAN DEFAULT false,
  obtainable_from TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- INVENTARIO DE USUARIO (MOCHILA)
CREATE TABLE user_backpack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES backpack_items(id),
  quantity INT DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- USO DE ITEMS
CREATE TABLE backpack_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  item_id UUID REFERENCES backpack_items(id),
  target_type TEXT,
  target_id TEXT,
  xp_generated INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- NIVELES DE SALA
CREATE TABLE room_levels (
  room_id TEXT PRIMARY KEY,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  total_xp_earned INT DEFAULT 0,
  unlocked_effects TEXT[] DEFAULT '{}',
  last_level_up TIMESTAMP
);

-- VIDEOS / COVERS
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  duration INT,
  type TEXT,
  tags TEXT[],
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  is_private BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false
);

-- COMENTARIOS
CREATE TABLE video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  user_id UUID REFERENCES users(id),
  comment TEXT,
  moderated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- LIKES
CREATE TABLE video_likes (
  user_id UUID REFERENCES users(id),
  video_id UUID REFERENCES videos(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- TRANSMISIONES EN VIVO
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  stream_key TEXT UNIQUE,
  status TEXT DEFAULT 'offline',
  viewer_count INT DEFAULT 0,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  battle_mode BOOLEAN DEFAULT false,
  battle_started_at TIMESTAMP,
  battle_ends_at TIMESTAMP,
  battle_participant1 UUID,
  battle_participant2 UUID,
  battle_score1 INT DEFAULT 0,
  battle_score2 INT DEFAULT 0,
  battle_winner UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- REGALOS REALES
CREATE TABLE gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  gift_id TEXT NOT NULL,
  coins_spent INT NOT NULL,
  stars_generated INT NOT NULL,
  room_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SALDO DE ESTRELLAS DEL CREADOR
CREATE TABLE creator_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  stars_balance INT DEFAULT 0,
  lifetime_stars_earned INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- REPORTES
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_name TEXT,
  reporter_id UUID REFERENCES users(id),
  reporter_name TEXT,
  reason TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  severity TEXT DEFAULT 'medium',
  evidence TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by UUID,
  resolution TEXT
);

-- MISIONES
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  required_value INT NOT NULL,
  reward_coins INT NOT NULL,
  reward_xp INT NOT NULL,
  reward_item_id UUID REFERENCES backpack_items(id),
  is_active BOOLEAN DEFAULT true,
  is_dynamic BOOLEAN DEFAULT false,
  engagement_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- PROGRESO DE MISIONES
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mission_id UUID REFERENCES missions(id),
  current_value INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

-- AVATARES (tienda)
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT,
  category TEXT,
  price_coins INT,
  price_diamonds INT,
  rarity INT,
  is_limited BOOLEAN,
  unlock_condition JSONB,
  description TEXT
);

-- AVATARES DEL USUARIO
CREATE TABLE user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  avatar_id UUID REFERENCES avatars(id),
  acquired_at TIMESTAMP,
  is_equipped BOOLEAN DEFAULT false,
  UNIQUE(user_id, avatar_id)
);

-- EVENTOS ESPECIALES
CREATE TABLE special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  multiplier FLOAT DEFAULT 1,
  rewards JSONB,
  is_active BOOLEAN DEFAULT true
);

-- CONFIGURACIÓN GLOBAL
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS DE ADMIN
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_faction_members_faction_id ON faction_members(faction_id);
CREATE INDEX idx_faction_activities_faction_id ON faction_activities(faction_id);
CREATE INDEX idx_user_backpack_user_id ON user_backpack(user_id);
CREATE INDEX idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_live_streams_status ON live_streams(status);

-- FUNCIÓN: agregar actividad a bando y subir nivel
CREATE OR REPLACE FUNCTION add_faction_activity(
  p_faction_id UUID,
  p_user_id UUID,
  p_action_type TEXT,
  p_target_id TEXT,
  p_xp INT
) RETURNS JSON AS $$
DECLARE
  v_current_level INT;
  v_current_xp INT;
  v_new_level INT;
  v_xp_to_next INT;
BEGIN
  INSERT INTO faction_activities (faction_id, user_id, action_type, target_id, xp_earned)
  VALUES (p_faction_id, p_user_id, p_action_type, p_target_id, p_xp);
  
  UPDATE factions SET xp = xp + p_xp WHERE id = p_faction_id
  RETURNING level, xp INTO v_current_level, v_current_xp;
  
  v_xp_to_next := 100 + ((v_current_level - 1) * 20);
  v_new_level := v_current_level;
  
  WHILE v_current_xp >= v_xp_to_next LOOP
    v_new_level := v_new_level + 1;
    v_current_xp := v_current_xp - v_xp_to_next;
    v_xp_to_next := 100 + ((v_new_level - 1) * 20);
  END LOOP;
  
  IF v_new_level > v_current_level THEN
    UPDATE factions SET level = v_new_level, xp = v_current_xp WHERE id = p_faction_id;
  END IF;
  
  RETURN json_build_object('success', true, 'xp_added', p_xp, 'new_level', v_new_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN: usar item de mochila en sala
CREATE OR REPLACE FUNCTION use_backpack_item_on_room(
  p_user_id UUID,
  p_item_id UUID,
  p_room_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_item_qty INT;
  v_item_xp INT;
  v_current_level INT;
  v_current_xp INT;
  v_xp_to_next INT;
  v_new_level INT;
BEGIN
  SELECT quantity INTO v_item_qty FROM user_backpack WHERE user_id = p_user_id AND item_id = p_item_id;
  IF v_item_qty IS NULL OR v_item_qty < 1 THEN
    RETURN json_build_object('success', false, 'error', 'No tienes este item');
  END IF;
  
  SELECT xp_value INTO v_item_xp FROM backpack_items WHERE id = p_item_id;
  
  UPDATE user_backpack SET quantity = quantity - 1 WHERE user_id = p_user_id AND item_id = p_item_id;
  
  INSERT INTO room_levels (room_id, level, xp, total_xp_earned)
  VALUES (p_room_id, 1, v_item_xp, v_item_xp)
  ON CONFLICT (room_id) DO UPDATE
  SET xp = room_levels.xp + v_item_xp,
      total_xp_earned = room_levels.total_xp_earned + v_item_xp;
  
  SELECT level, xp INTO v_current_level, v_current_xp FROM room_levels WHERE room_id = p_room_id;
  v_xp_to_next := 100 + ((v_current_level - 1) * 15);
  v_new_level := v_current_level;
  WHILE v_current_xp >= v_xp_to_next LOOP
    v_new_level := v_new_level + 1;
    v_current_xp := v_current_xp - v_xp_to_next;
    v_xp_to_next := 100 + ((v_new_level - 1) * 15);
  END LOOP;
  
  IF v_new_level > v_current_level THEN
    UPDATE room_levels SET level = v_new_level, xp = v_current_xp WHERE room_id = p_room_id;
  END IF;
  
  INSERT INTO backpack_usage (user_id, item_id, target_type, target_id, xp_generated)
  VALUES (p_user_id, p_item_id, 'room', p_room_id, v_item_xp);
  
  RETURN json_build_object('success', true, 'xp_given', v_item_xp, 'new_level', v_new_level, 'level_up', v_new_level > v_current_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN: procesar regalo real (Coins → Estrellas)
CREATE OR REPLACE FUNCTION process_gift(
  p_from_user UUID,
  p_to_user UUID,
  p_gift_id TEXT,
  p_coin_cost INT
) RETURNS JSON AS $$
DECLARE
  v_stars_given INT;
  v_from_coins INT;
BEGIN
  v_stars_given := p_coin_cost / 2;
  
  SELECT coins INTO v_from_coins FROM users WHERE id = p_from_user;
  IF v_from_coins < p_coin_cost THEN
    RETURN json_build_object('success', false, 'error', 'Coins insuficientes');
  END IF;
  
  UPDATE users SET coins = coins - p_coin_cost WHERE id = p_from_user;
  INSERT INTO creator_balances (user_id, stars_balance, lifetime_stars_earned)
  VALUES (p_to_user, v_stars_given, v_stars_given)
  ON CONFLICT (user_id) DO UPDATE
  SET stars_balance = creator_balances.stars_balance + v_stars_given,
      lifetime_stars_earned = creator_balances.lifetime_stars_earned + v_stars_given;
  
  INSERT INTO gift_transactions (from_user_id, to_user_id, gift_id, coins_spent, stars_generated)
  VALUES (p_from_user, p_to_user, p_gift_id, p_coin_cost, v_stars_given);
  
  RETURN json_build_object('success', true, 'stars_given', v_stars_given);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DATOS INICIALES (items de mochila, avatares, configuración)
INSERT INTO backpack_items (name, description, emoji, category, xp_value, friendship_xp, cover_boost, obtainable_from) VALUES
('Galleta Mágica', 'Una galleta crujiente con chispas de energía', '🍪', 'food', 5, 3, 1, ARRAY['missions', 'daily_reward']),
('Café C8L', 'El café oficial del estudio. Da energía extra', '☕', 'food', 10, 5, 2, ARRAY['missions', 'events']),
('Pizza Musical', 'Comparte una pizza con amigos', '🍕', 'food', 20, 10, 3, ARRAY['missions', 'games']),
('Tarta de Cumpleaños', '¡Celebra los logros!', '🎂', 'food', 50, 25, 5, ARRAY['events', 'special']),
('Globo de Colores', 'Un globo para alegrar la sala', '🎈', 'toy', 8, 4, 1, ARRAY['daily_reward']),
('Osito C8L', 'Un abrazo suave y cálido', '🧸', 'toy', 15, 8, 2, ARRAY['missions']),
('Confeti de Fiesta', '¡Explosión de alegría!', '🎊', 'toy', 30, 15, 4, ARRAY['events']),
('Abrazo Virtual', 'Un abrazo para cuando más lo necesitas', '🤗', 'emotion', 12, 12, 2, ARRAY['friendship']),
('Corazón C8L', 'Un gesto de cariño especial', '💖', 'emotion', 25, 25, 5, ARRAY['special']),
('Estrella de Apoyo', 'Eres una estrella', '⭐', 'emotion', 40, 20, 8, ARRAY['tournaments']),
('Arcoíris C8L', 'Un arcoíris llena la sala de magia', '🌈', 'special', 100, 50, 15, ARRAY['legendary']),
('Unicornio Legendario', 'El regalo más especial', '🦄', 'special', 200, 100, 30, ARRAY['legendary']);

INSERT INTO avatars (name, emoji, category, price_coins, price_diamonds, rarity, description) VALUES
('Micrófono Clásico', '🎤', 'free', 0, 0, 0, 'El micrófono de toda la vida'),
('Audífonos DJ', '🎧', 'free', 0, 0, 0, 'Para los amantes del sonido'),
('Nota Musical', '🎵', 'free', 0, 0, 0, 'La esencia de la música'),
('León Cantante', '🦁', 'common', 100, 0, 1, 'Ruge como un león en el escenario'),
('Micrófono Dorado', '🎤✨', 'rare', 500, 0, 2, 'El lujo de cantar'),
('Rey Cantante', '👑', 'rare', 800, 0, 2, 'Canta como un rey'),
('León Legendario', '🦁👑', 'epic', 2000, 0, 3, 'El rey indiscutible del escenario'),
('Leyenda C8L', '🏆', 'legendary', 0, 10000, 4, 'Solo para los más grandes');

INSERT INTO system_config (key, value, description) VALUES
('coin_to_bid_rate', '0.1', 'Tasa de conversión de Coins a BID (1 Coin = X BID)'),
('daily_mission_reward_base', '50', 'Coins base para misiones diarias'),
('faction_maintenance_cost', '100', 'Coste semanal en BID para mantener un Bando activo'),
('video_generation_daily_limit', '5', 'Límite de generaciones de vídeo por usuario/día'),
('ai_music_monthly_limit', '50', 'Límite de generaciones de música IA por usuario/mes'),
('referral_bonus', '100', 'Coins otorgados al invitar un amigo'),
('max_gift_value', '10000', 'Valor máximo de un regalo individual en Coins');
