-- C8L AGENCY — Base de Datos PostgreSQL
-- Esquema inicial para persistencia del bot y la web

-- Usuarios (vincula Telegram + Web)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    display_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    diamonds INTEGER DEFAULT 0,
    bando_id INTEGER,
    role VARCHAR(20) DEFAULT 'member',
    warnings INTEGER DEFAULT 0,
    banned_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP DEFAULT NOW()
);

-- Historial de conversaciones
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    chat_id BIGINT,
    role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    agent VARCHAR(30),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Contenido generado (feed)
CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content_type VARCHAR(30) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    prompt TEXT,
    result_url TEXT,
    result_data BYTEA,
    agent VARCHAR(30),
    style VARCHAR(50),
    likes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bandos (familias/equipos)
CREATE TABLE IF NOT EXISTS bandos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    leader_id INTEGER REFERENCES users(id),
    emblem_url TEXT,
    color VARCHAR(7) DEFAULT '#8B5CF6',
    members_count INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    xp_total INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transacciones de coins
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Memoria del bot (aprendizaje evolutivo)
CREATE TABLE IF NOT EXISTS bot_memory (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.5,
    uses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sanciones (warns/bans)
CREATE TABLE IF NOT EXISTS sanctions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    admin_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL,
    reason TEXT,
    duration VARCHAR(20),
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback (auto-evolucion)
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content_id INTEGER REFERENCES content(id),
    rating VARCHAR(10) NOT NULL,
    agent VARCHAR(30),
    prompt TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mensajes programados
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX idx_users_telegram ON users(telegram_id);
CREATE INDEX idx_content_public ON content(is_public, created_at DESC);
CREATE INDEX idx_content_type ON content(content_type, created_at DESC);
CREATE INDEX idx_chat_history_user ON chat_history(user_id, created_at DESC);
CREATE INDEX idx_feedback_agent ON feedback(agent, created_at DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);

-- Datos iniciales
INSERT INTO users (telegram_id, telegram_username, display_name, role, coins, level)
VALUES (1970956749, 'leovela69', 'Leo Vela', 'admin', 99999, 99)
ON CONFLICT (telegram_id) DO NOTHING;
