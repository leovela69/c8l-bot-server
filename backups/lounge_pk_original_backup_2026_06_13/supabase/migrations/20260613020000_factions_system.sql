-- =====================================================
-- C8L AGENCY - FACTIONS (BANDOS) DATABASE SCHEMA
-- =====================================================

-- Recreate faction tables with cascade
DROP TABLE IF EXISTS faction_task_progress CASCADE;
DROP TABLE IF EXISTS faction_tasks CASCADE;
DROP TABLE IF EXISTS faction_messages CASCADE;
DROP TABLE IF EXISTS faction_channels CASCADE;
DROP TABLE IF EXISTS faction_levels CASCADE;
DROP TABLE IF EXISTS faction_members CASCADE;
DROP TABLE IF EXISTS factions CASCADE;

-- Tabla de Bandos (Factions)
CREATE TABLE factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  emblem_url TEXT DEFAULT '🛡️',
  banner_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  member_count INT DEFAULT 1
);

-- Tabla de miembros y jerarquía
CREATE TABLE faction_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'captain', 'vice-captain', 'admin', 'member'
  nickname VARCHAR(30),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' (requests), 'active'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  xp_contributed INT DEFAULT 0,
  UNIQUE(faction_id, user_id)
);

-- Tabla de niveles y límites
CREATE TABLE faction_levels (
  level INT PRIMARY KEY,
  xp_required INT NOT NULL,
  max_members INT NOT NULL,
  perks JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de canales de chat (público y admin)
CREATE TABLE faction_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
  channel_type VARCHAR(20) NOT NULL, -- 'general', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faction_id, channel_type)
);

-- Tabla de mensajes
CREATE TABLE faction_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES faction_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tareas (logros)
CREATE TABLE faction_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faction_id UUID REFERENCES factions(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  xp_reward INT NOT NULL,
  coin_reward INT NOT NULL,
  required_type VARCHAR(30), -- 'sing', 'duet', 'invite', 'donate'
  required_amount INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ
);

-- Tabla de progreso de tareas por miembro
CREATE TABLE faction_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES faction_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  UNIQUE(task_id, user_id)
);

-- Populate Levels data
INSERT INTO faction_levels (level, xp_required, max_members, perks) VALUES
(1, 1000, 15, '{"exclusive_chat": true}'),
(2, 2500, 20, '{"exclusive_chat": true}'),
(3, 5000, 25, '{"exclusive_chat": true, "custom_emblem": true}'),
(4, 10000, 30, '{"exclusive_chat": true, "custom_emblem": true}'),
(5, 20000, 35, '{"exclusive_chat": true, "custom_emblem": true, "badge": true}'),
(6, 40000, 40, '{"exclusive_chat": true, "custom_emblem": true, "badge": true}'),
(7, 80000, 45, '{"exclusive_chat": true, "custom_emblem": true, "badge": true}'),
(8, 150000, 50, '{"exclusive_chat": true, "custom_emblem": true, "badge": true, "special_effects": true}');
