-- C8L AGENCY — SCHEMA SUPABASE v21.0

-- 1. PERFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    faction_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MONEDERO
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coins INTEGER DEFAULT 1000,
    diamonds INTEGER DEFAULT 0,
    bid INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'coins',
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SANCIONES
CREATE TABLE IF NOT EXISTS active_sanctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    duration TEXT NOT NULL,
    reason TEXT NOT NULL,
    legal_basis TEXT NOT NULL,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    moderator_id UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL,
    moderator_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    target_user_id UUID NOT NULL REFERENCES profiles(id),
    moderator_id UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BANDOS
CREATE TABLE IF NOT EXISTS factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '⚔️',
    leader_id UUID REFERENCES profiles(id),
    level INTEGER DEFAULT 1,
    power INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faction_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'recluta',
    UNIQUE(faction_id, user_id)
);

-- 5. CASINO
CREATE TABLE IF NOT EXISTS casino_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    game_type TEXT NOT NULL,
    bet_amount INTEGER NOT NULL,
    win_amount INTEGER DEFAULT 0,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. C8L TV
CREATE TABLE IF NOT EXISTS tv_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES profiles(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tv_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. KARAOKE
CREATE TABLE IF NOT EXISTS karaoke_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    song_title TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ESTUDIO MUSICAL
CREATE TABLE IF NOT EXISTS studio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    prompt TEXT NOT NULL,
    genre TEXT,
    bpm INTEGER,
    mood TEXT,
    result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MOCHILA/REGALOS
CREATE TABLE IF NOT EXISTS backpack_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    rarity TEXT DEFAULT 'comun',
    price_coins INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_backpack (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    item_id UUID NOT NULL REFERENCES backpack_items(id),
    quantity INTEGER DEFAULT 1,
    UNIQUE(user_id, item_id)
);

-- INDICES
CREATE INDEX idx_sanctions_active ON active_sanctions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_casino_user ON casino_games(user_id);
CREATE INDEX idx_tv_author ON tv_content(author_id);
CREATE INDEX idx_studio_user ON studio_history(user_id);
