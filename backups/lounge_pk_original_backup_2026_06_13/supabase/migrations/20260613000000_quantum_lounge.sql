-- =====================================================
-- C8L AGENCY - QUANTUM LOUNGE DATABASE SCHEMA
-- =====================================================

-- Tabla de salas (rooms)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  max_seats INT DEFAULT 15,
  current_seats INT DEFAULT 0,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de asientos (sillones)
CREATE TABLE IF NOT EXISTS room_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seat_number INT NOT NULL,
  is_singing BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, seat_number),
  UNIQUE(room_id, user_id)
);

-- Cola de canciones (song queue)
CREATE TABLE IF NOT EXISTS room_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  song_url TEXT,
  position INT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, playing, done
  created_at TIMESTAMP DEFAULT NOW()
);

-- Regalos dentro de sala
CREATE TABLE IF NOT EXISTS room_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  coins_cost INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_seats_room_id ON room_seats(room_id);
CREATE INDEX IF NOT EXISTS idx_room_queue_room_id ON room_queue(room_id);
CREATE INDEX IF NOT EXISTS idx_room_gifts_room_id ON room_gifts(room_id);
