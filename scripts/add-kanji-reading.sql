-- Add kanji and reading columns to users table (run once)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kanji VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reading VARCHAR(255) DEFAULT NULL;
