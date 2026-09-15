-- Granular employee permissions + trade-in/exchange deals

ALTER TABLE app_employees
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{
    "view_dashboard": true,
    "view_financials": false,
    "view_vehicles": true,
    "add_vehicles": true,
    "edit_vehicles": true,
    "delete_vehicles": false,
    "view_vehicle_profit": false,
    "view_transactions": true,
    "add_expenses": true,
    "record_sales": true,
    "edit_transactions": true,
    "delete_transactions": false,
    "view_reports": false,
    "manage_documents": true
  }'::jsonb;

CREATE TABLE IF NOT EXISTS vehicle_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outgoing_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL NOT NULL,
  incoming_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('cash_sale', 'trade_in', 'exchange')),
  sale_price DECIMAL(12,2) NOT NULL CHECK (sale_price >= 0),
  trade_in_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (trade_in_value >= 0),
  cash_received DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cash_received >= 0),
  cash_paid DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (cash_paid >= 0),
  payment_method TEXT CHECK (payment_method IN ('cash', 'pix', 'card', 'transfer', 'financing')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vehicle_deals_cash_direction CHECK (NOT (cash_received > 0 AND cash_paid > 0)),
  CONSTRAINT vehicle_deals_balance CHECK (ROUND((trade_in_value + cash_received - cash_paid)::numeric, 2) = ROUND(sale_price::numeric, 2))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_deals_outgoing_vehicle
  ON vehicle_deals(outgoing_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_deals_incoming_vehicle
  ON vehicle_deals(incoming_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_deals_user_date
  ON vehicle_deals(user_id, date DESC);

ALTER TABLE vehicle_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_vehicle_deals" ON vehicle_deals;
CREATE POLICY "own_vehicle_deals" ON vehicle_deals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
