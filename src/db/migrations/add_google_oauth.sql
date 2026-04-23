-- Migration: Add Google OAuth support to users table
-- Run this migration before deploying the Google OAuth feature

-- Create auth provider enum
CREATE TYPE auth_provider AS ENUM ('local', 'google');

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN google_id TEXT UNIQUE,
  ADD COLUMN provider auth_provider NOT NULL DEFAULT 'local',
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN refresh_token TEXT,
  ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Create index on provider for filtering
CREATE INDEX idx_users_provider ON users(provider);

-- Update existing users to have 'local' provider
UPDATE users SET provider = 'local' WHERE provider IS NULL;
