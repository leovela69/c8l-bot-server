-- C8L AGENCY — SCHEMA v2 (Sistema de Bandos Ajedrez)
-- Tablas especificas para el sistema de bandos con piezas=jugadores

-- USUARIOS (extendido para ajedrez)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1200;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elo_peak INTEGER DEFAULT 1200;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_games INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country_code CHAR(2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

-- BANDOS (extendido para guerras)
ALTER TABLE factions ADD COLUMN IF NOT EXISTS tag VARCHAR(10);
ALTER TABLE factions ADD COLUMN IF NOT EXISTS shield_url TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#D4AF37';
ALTER TABLE factions ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#FFFFFF';
ALTER TABLE factions ADD COLUMN IF NOT EXISTS theme_music_url TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS victory_animation TEXT;
ALTER TABLE factions ADD COLUMN IF NOT EXISTS total_wars_won INTEGER DEFAULT 0;

-- MIEMBROS DE BANDO (piezas de ajedrez)
ALTER TABLE faction_members ADD COLUMN IF NOT EXISTS piece_type VARCHAR(20) DEFAULT 'pawn';
ALTER TABLE faction_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE faction_members ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();
-- piece_type: king, queen, bishop, knight, rook, pawn
-- role: lider=king, mano_derecha=queen, estratega=bishop, capitan=knight, guardian=rook, soldado=pawn

-- GUERRAS DE BANDOS
CREATE TABLE IF NOT EXISTS faction_wars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_a_id UUID NOT NULL REFERENCES factions(id),
    faction_b_id UUID NOT NULL REFERENCES factions(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    faction_a_score INTEGER DEFAULT 0,
    faction_b_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES factions(id),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','ongoing','finished')),
    mvp_user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PARTIDAS DE AJEDREZ/JUEGOS
CREATE TABLE IF NOT EXISTS chess_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES profiles(id),
    black_player_id UUID REFERENCES profiles(id),
    white_faction_id UUID REFERENCES factions(id),
    black_faction_id UUID REFERENCES factions(id),
    war_id UUID REFERENCES faction_wars(id),
    game_type TEXT NOT NULL DEFAULT 'chess' CHECK (game_type IN ('chess','chess960','damas')),
    mode TEXT NOT NULL DEFAULT 'vs_human' CHECK (mode IN ('vs_ai','vs_human','tournament','faction_war')),
    ai_level INTEGER,
    time_control TEXT DEFAULT '15+10',
    status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing','finished','abandoned')),
    result TEXT CHECK (result IN ('white_win','black_win','draw')),
    pgn TEXT,
    moves_count INTEGER DEFAULT 0,
    white_elo_before INTEGER,
    white_elo_after INTEGER,
    black_elo_before INTEGER,
    black_elo_after INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    is_ranked BOOLEAN DEFAULT TRUE
);

-- SKINS Y PERSONALIZACION
CREATE TABLE IF NOT EXISTS skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('board','piece','effect','theme','faction')),
    category TEXT CHECK (category IN ('free','premium','legendary','streamer','faction','seasonal')),
    price_coins INTEGER DEFAULT 0,
    price_real DECIMAL(10,2),
    asset_url TEXT,
    preview_url TEXT,
    is_limited BOOLEAN DEFAULT FALSE,
    available_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skin_id UUID NOT NULL REFERENCES skins(id),
    is_active BOOLEAN DEFAULT FALSE,
    acquired_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skin_id)
);

-- LOGROS
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER,
    reward_coins INTEGER DEFAULT 0,
    reward_skin_id UUID REFERENCES skins(id),
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- TEMPORADAS
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    rewards JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_chess_white ON chess_games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_chess_black ON chess_games(black_player_id);
CREATE INDEX IF NOT EXISTS idx_chess_war ON chess_games(war_id);
CREATE INDEX IF NOT EXISTS idx_wars_a ON faction_wars(faction_a_id);
CREATE INDEX IF NOT EXISTS idx_wars_b ON faction_wars(faction_b_id);
CREATE INDEX IF NOT EXISTS idx_wars_status ON faction_wars(status);
CREATE INDEX IF NOT EXISTS idx_skins_type ON skins(type);
CREATE INDEX IF NOT EXISTS idx_user_skins_user ON user_skins(user_id);

-- DATOS INICIALES: Logros de Bandos
INSERT INTO achievements (name, description, requirement_type, requirement_value, reward_coins) VALUES
('Bando Naciente', 'Crear un bando', 'create_faction', 1, 100),
('Reclutador Elite', 'Tener 30 miembros', 'faction_members', 30, 500),
('Invencibles', 'Ganar 5 guerras seguidas', 'war_streak', 5, 2000),
('Leyenda del Bando', 'Top 10 global', 'faction_rank', 10, 5000),
('Hermandad', 'Todos con 50+ partidas', 'all_members_games', 50, 1000),
('La Venganza', 'Vencer al bando que te derroto', 'revenge_win', 1, 500),
('Primera Sangre', 'Ganar tu primera partida', 'wins', 1, 50),
('Racha de Fuego', 'Ganar 10 partidas seguidas', 'streak', 10, 300),
('Gran Maestro', 'Alcanzar ELO 2500', 'elo', 2500, 1000),
('Dios del Ajedrez', 'Vencer a IA nivel 6', 'beat_ai_6', 1, 2000);

-- DATOS INICIALES: Skins basicas
INSERT INTO skins (name, type, category, price_coins) VALUES
('Tablero Clasico', 'board', 'free', 0),
('Tablero Neon', 'board', 'premium', 500),
('Tablero C8L Gold', 'board', 'legendary', 2000),
('Piezas Clasicas', 'piece', 'free', 0),
('Piezas Cristal', 'piece', 'premium', 800),
('Piezas Fuego', 'piece', 'legendary', 1500),
('Efecto Chispas', 'effect', 'premium', 300),
('Efecto Neon Trail', 'effect', 'premium', 500),
('Efecto Explosion', 'effect', 'legendary', 1000),
('Tema Cyberpunk', 'theme', 'premium', 700),
('Tema Bolero-House', 'theme', 'legendary', 1200);
