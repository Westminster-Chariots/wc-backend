-- Add user_id to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS drivers_user_id_idx ON drivers(user_id);
