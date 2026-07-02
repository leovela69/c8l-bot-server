-- ============================================================
-- C8L AGENCY — SISTEMA DE BANDOS (FACTIONS)
-- Migration: 20260614_factions_system.sql
-- ============================================================

-- ─── 1. TABLA PRINCIPAL DE BANDOS ───────────────────────────
CREATE TABLE IF NOT EXISTS factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    emblem TEXT DEFAULT '⚔️',
    emblem_url TEXT,
    banner_url TEXT,
    color VARCHAR(10) DEFAULT '#D4AF37',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    member_count INT DEFAULT 1,
    required_level INT DEFAULT 1,
    is_open BOOLEAN DEFAULT true,
    max_members INT DEFAULT 20,
    total_pk_wins INT DEFAULT 0,
    total_coins_earned INT DEFAULT 0
);

-- ─── 2. MIEMBROS Y JERARQUÍA ─────────────────────────────────
CREATE TABLE IF NOT EXISTS faction_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- captain, vice_captain, admin, member
    nickname VARCHAR(30),
    status VARCHAR(20) DEFAULT 'active', -- active, pending, banned
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    xp_contributed INT DEFAULT 0,
    coins_contributed INT DEFAULT 0,
    UNIQUE(faction_id, user_id)
);

-- ─── 3. TABLA DE NIVELES Y BENEFICIOS ────────────────────────
CREATE TABLE IF NOT EXISTS faction_levels (
    level INT PRIMARY KEY,
    xp_required INT NOT NULL,
    max_members INT NOT NULL,
    perks JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed inicial de niveles
INSERT INTO faction_levels (level, xp_required, max_members, perks) VALUES
  (1,  0,      20,  '{"badge": "Novatos", "coin_bonus": 0}'),
  (2,  500,    25,  '{"badge": "Guerreros", "coin_bonus": 5}'),
  (3,  1500,   30,  '{"badge": "Soldados", "coin_bonus": 10}'),
  (4,  3500,   40,  '{"badge": "Élite", "coin_bonus": 15}'),
  (5,  7000,   50,  '{"badge": "Leyendas", "coin_bonus": 20}'),
  (6,  12000,  60,  '{"badge": "Titanes", "coin_bonus": 30}'),
  (7,  20000,  75,  '{"badge": "Inmortales", "coin_bonus": 40}'),
  (8,  35000,  100, '{"badge": "Dioses C8L", "coin_bonus": 50}')
ON CONFLICT (level) DO NOTHING;

-- ─── 4. CANALES DE CHAT ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS faction_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL, -- 'general', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. MENSAJES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faction_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES faction_channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    reply_to UUID REFERENCES faction_messages(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. TAREAS (MISIONES INTERNAS) ───────────────────────────
CREATE TABLE IF NOT EXISTS faction_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    xp_reward INT NOT NULL DEFAULT 0,
    coin_reward INT NOT NULL DEFAULT 0,
    required_type VARCHAR(30), -- 'sing', 'duet', 'invite', 'pk_win', 'gift_send'
    required_amount INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    is_global BOOLEAN DEFAULT FALSE, -- tareas globales de la plataforma
    created_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 7. PROGRESO DE TAREAS POR MIEMBRO ───────────────────────
CREATE TABLE IF NOT EXISTS faction_task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES faction_tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    reward_claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMPTZ,
    UNIQUE(task_id, user_id)
);

-- ─── 8. HISTORIAL DE JUEGOS POR BANDO ────────────────────────
CREATE TABLE IF NOT EXISTS faction_game_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    game_name VARCHAR(30), -- 'zb_poker', 'cookie_mines', 'entre_bingo'
    cookies_won INT DEFAULT 0,
    arepitas_won INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    coins_earned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. HISTORIAL DE PK BATTLES POR BANDO ────────────────────
CREATE TABLE IF NOT EXISTS faction_pk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
    rival_faction_id UUID REFERENCES factions(id),
    result VARCHAR(10) NOT NULL, -- 'win', 'loss', 'draw'
    diamonds_earned INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    duration_seconds INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- ─── Crear canales automáticamente al crear un Bando ─────────
CREATE OR REPLACE FUNCTION create_faction_channels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO faction_channels (faction_id, channel_type) VALUES (NEW.id, 'general');
    INSERT INTO faction_channels (faction_id, channel_type) VALUES (NEW.id, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_faction_created ON factions;
CREATE TRIGGER after_faction_created
AFTER INSERT ON factions
FOR EACH ROW EXECUTE FUNCTION create_faction_channels();

-- ─── Actualizar contador de miembros ─────────────────────────
CREATE OR REPLACE FUNCTION update_faction_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE factions SET member_count = member_count + 1 WHERE id = NEW.faction_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE factions SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.faction_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_member_change ON faction_members;
CREATE TRIGGER after_member_change
AFTER INSERT OR DELETE ON faction_members
FOR EACH ROW EXECUTE FUNCTION update_faction_member_count();

-- ─── Transferir XP al Bando tras ganar un juego ──────────────
CREATE OR REPLACE FUNCTION add_game_xp_to_faction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE factions 
    SET xp = xp + NEW.xp_earned,
        updated_at = NOW()
    WHERE id = NEW.faction_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_game_reward ON faction_game_rewards;
CREATE TRIGGER after_game_reward
AFTER INSERT ON faction_game_rewards
FOR EACH ROW EXECUTE FUNCTION add_game_xp_to_faction();

-- ─── Auto-subir nivel del Bando al ganar XP ──────────────────
CREATE OR REPLACE FUNCTION check_faction_level_up()
RETURNS TRIGGER AS $$
DECLARE
    next_level_xp INT;
    current_level INT;
    new_max_members INT;
BEGIN
    current_level := NEW.level;
    
    SELECT xp_required, max_members
    INTO next_level_xp, new_max_members
    FROM faction_levels
    WHERE level = current_level + 1;
    
    IF next_level_xp IS NOT NULL AND NEW.xp >= next_level_xp THEN
        UPDATE factions
        SET level = current_level + 1,
            max_members = new_max_members
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_faction_xp_update ON factions;
CREATE TRIGGER on_faction_xp_update
AFTER UPDATE OF xp ON factions
FOR EACH ROW EXECUTE FUNCTION check_faction_level_up();

-- ─── Actualizar XP contribuido del miembro ───────────────────
CREATE OR REPLACE FUNCTION update_member_xp_contribution()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE faction_members
    SET xp_contributed = xp_contributed + NEW.xp_earned
    WHERE faction_id = NEW.faction_id AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_game_reward_member ON faction_game_rewards;
CREATE TRIGGER after_game_reward_member
AFTER INSERT ON faction_game_rewards
FOR EACH ROW EXECUTE FUNCTION update_member_xp_contribution();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE faction_game_rewards ENABLE ROW LEVEL SECURITY;

-- Factions: todos pueden leer bandos activos
CREATE POLICY "factions_public_read" ON factions
    FOR SELECT USING (is_active = true);

-- Faction members: solo miembros pueden ver su bando
CREATE POLICY "faction_members_read" ON faction_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        faction_id IN (
            SELECT faction_id FROM faction_members WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Mensajes: solo miembros del canal
CREATE POLICY "faction_messages_read" ON faction_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT fc.id FROM faction_channels fc
            JOIN faction_members fm ON fc.faction_id = fm.faction_id
            WHERE fm.user_id = auth.uid() AND fm.status = 'active'
        )
    );

CREATE POLICY "faction_messages_insert" ON faction_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        channel_id IN (
            SELECT fc.id FROM faction_channels fc
            JOIN faction_members fm ON fc.faction_id = fm.faction_id
            WHERE fm.user_id = auth.uid() AND fm.status = 'active'
        )
    );

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_faction_members_user ON faction_members(user_id);
CREATE INDEX IF NOT EXISTS idx_faction_members_faction ON faction_members(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_messages_channel ON faction_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_faction_messages_created ON faction_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faction_task_progress_task ON faction_task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_faction_task_progress_user ON faction_task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_faction_game_rewards_faction ON faction_game_rewards(faction_id);
