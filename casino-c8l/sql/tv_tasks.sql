-- =====================================================
-- SISTEMA DE TAREAS DE C8L TV
-- =====================================================

-- Tareas principales (plantillas)
CREATE TABLE IF NOT EXISTS tv_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- 'daily', 'weekly', 'special', 'onboarding'
    category TEXT NOT NULL, -- 'cover', 'video', 'live', 'interaction'
    required_action TEXT NOT NULL,
    required_count INT DEFAULT 1,
    reward_coins INT DEFAULT 0,
    reward_diamonds INT DEFAULT 0,
    reward_xp INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Progreso de tareas del usuario
CREATE TABLE IF NOT EXISTS tv_user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    task_id UUID REFERENCES tv_tasks(id),
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    is_claimed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- Contenido subido (covers, videos, lives)
CREATE TABLE IF NOT EXISTS tv_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL, -- 'cover', 'video', 'live'
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INT,
    tags TEXT[],
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Interacciones (likes, comentarios)
CREATE TABLE IF NOT EXISTS tv_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    content_id UUID REFERENCES tv_content(id),
    type TEXT NOT NULL, -- 'like', 'comment', 'share'
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, content_id, type)
);


-- Retos y duelos
CREATE TABLE IF NOT EXISTS tv_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'cover', 'video', 'live'
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    prize_pool INT DEFAULT 0,
    winner_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tv_challenge_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES tv_challenges(id),
    user_id UUID REFERENCES users(id),
    content_id UUID REFERENCES tv_content(id),
    score INT DEFAULT 0,
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- =====================================================
-- DATOS INICIALES: Tareas
-- =====================================================

INSERT INTO tv_tasks (title, description, type, category, required_action, required_count, reward_coins, reward_diamonds, reward_xp) VALUES
-- Diarias
('🎤 Sube un cover hoy', 'Graba y sube un cover de karaoke', 'daily', 'cover', 'upload_cover', 1, 50, 10, 100),
('🎬 Sube un video hoy', 'Sube un video a C8L TV', 'daily', 'video', 'upload_video', 1, 75, 15, 120),
('❤️ Apoya a un creador', 'Da like a 5 videos de otros creadores', 'daily', 'interaction', 'like', 5, 25, 5, 50),
('💬 Comenta en un video', 'Deja 3 comentarios en videos', 'daily', 'interaction', 'comment', 3, 30, 5, 60),
('🎵 Dueto con un amigo', 'Realiza un dueto en un cover', 'daily', 'cover', 'duet', 1, 100, 20, 150),
-- Semanales
('🎤 Rey de Covers', 'Sube 5 covers esta semana', 'weekly', 'cover', 'upload_cover', 5, 300, 50, 500),
('🎬 Creador de Contenido', 'Sube 3 videos esta semana', 'weekly', 'video', 'upload_video', 3, 250, 40, 400),
('📺 Streamer Estrella', 'Haz 2 lives esta semana', 'weekly', 'live', 'go_live', 2, 400, 60, 600),
('👑 Contenido Viral', 'Consigue 1000 vistas en tus videos', 'weekly', 'video', 'views', 1000, 500, 100, 800),
('🤝 Colaborador', 'Haz 3 duetos o colaboraciones', 'weekly', 'cover', 'duet', 3, 200, 30, 350),
-- Especiales/Onboarding
('🎯 Bautismo de Fuego', 'Sube tu primer cover', 'onboarding', 'cover', 'upload_cover', 1, 100, 20, 200),
('📹 Primer Video', 'Sube tu primer video a C8L TV', 'onboarding', 'video', 'upload_video', 1, 100, 20, 200),
('🔴 Primera Transmisión', 'Haz tu primer live', 'onboarding', 'live', 'go_live', 1, 150, 30, 250);

-- =====================================================
-- FUNCIÓN: Procesar recompensas al subir contenido
-- =====================================================

CREATE OR REPLACE FUNCTION process_content_upload(
    p_user_id UUID, p_content_type TEXT, p_content_id UUID
) RETURNS VOID AS $$
DECLARE v_task_id UUID; v_required INT;
BEGIN
    FOR v_task_id, v_required IN
        SELECT id, required_count FROM tv_tasks
        WHERE required_action = 'upload_' || p_content_type AND is_active = true
    LOOP
        INSERT INTO tv_user_tasks (user_id, task_id, progress)
        VALUES (p_user_id, v_task_id, 1)
        ON CONFLICT (user_id, task_id) DO UPDATE
        SET progress = tv_user_tasks.progress + 1;

        UPDATE tv_user_tasks
        SET is_completed = true, completed_at = NOW()
        WHERE user_id = p_user_id AND task_id = v_task_id
          AND progress >= v_required AND is_completed = false;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices
CREATE INDEX IF NOT EXISTS idx_tv_tasks_type ON tv_tasks(type);
CREATE INDEX IF NOT EXISTS idx_tv_user_tasks_user ON tv_user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_content_user ON tv_content(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_content_type ON tv_content(type);
CREATE INDEX IF NOT EXISTS idx_tv_interactions_content ON tv_interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_tv_challenges_status ON tv_challenges(status);
