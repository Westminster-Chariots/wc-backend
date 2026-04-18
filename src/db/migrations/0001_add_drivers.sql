-- Create driver_status enum
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'off_duty');

-- Create drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  status driver_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add driver_id to bookings table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='driver_id') THEN
    ALTER TABLE bookings ADD COLUMN driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;
END $$;
