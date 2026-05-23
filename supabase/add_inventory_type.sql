-- Add inventory type and consignment fields to vehicles
-- Run this in the Supabase SQL editor

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS inventory_type TEXT NOT NULL DEFAULT 'owned',
  ADD COLUMN IF NOT EXISTS owner_payout_amount DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS dealership_markup DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS estimated_sale_price DECIMAL(12,2);
