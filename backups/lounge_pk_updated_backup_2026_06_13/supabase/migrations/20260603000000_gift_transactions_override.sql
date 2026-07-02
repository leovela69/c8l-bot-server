-- Migration to recreate gift_transactions according to user request
-- This migration updates the default uuid generator to gen_random_uuid() and removes the room_id column.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS gift_transactions CASCADE;

CREATE TABLE gift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    gift_id TEXT NOT NULL,
    coins_spent INT NOT NULL,
    stars_generated INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_gift_transactions_to_user ON gift_transactions(to_user_id);
