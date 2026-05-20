-- Migration: Create vehicle_pricing table
-- Description: Adds vehicle-specific pricing overrides table
-- Date: 2024

-- Create vehicle_pricing table
CREATE TABLE IF NOT EXISTS vehicle_pricing (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES fleet(id) ON DELETE CASCADE,
    base_rate DECIMAL(10, 2) NOT NULL,
    rate_per_mile DECIMAL(10, 2) NOT NULL,
    rate_per_minute DECIMAL(10, 2) NOT NULL,
    tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_pricing_vehicle_id ON vehicle_pricing(vehicle_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vehicle_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vehicle_pricing_updated_at
    BEFORE UPDATE ON vehicle_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_pricing_updated_at();
