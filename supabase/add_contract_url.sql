-- Add contract_url column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_url TEXT;
