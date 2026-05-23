-- ============================================================
-- Taquinho Finance — Database Schema
-- ============================================================

-- Enable UUID extension (already enabled on Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Transaction Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT 'tag',
  color       TEXT DEFAULT '#8E8E93',
  type        TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  make            TEXT NOT NULL,
  model           TEXT NOT NULL,
  year            INTEGER NOT NULL,
  plate           TEXT,
  purchase_price  DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'in_stock'
                    CHECK (status IN ('in_stock', 'sold', 'archived')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL
                    CHECK (type IN ('expense', 'sale', 'vehicle_purchase', 'adjustment')),
  amount          DECIMAL(12,2) NOT NULL,
  description     TEXT,
  category_id     UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  vehicle_id      UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT CHECK (payment_method IN ('cash', 'pix', 'card', 'transfer', 'financing')),
  notes           TEXT,
  receipt_url     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_id   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_vehicle_id ON transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id        ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status         ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_categories_user_id      ON transaction_categories(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE vehicles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_vehicles" ON vehicles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_categories" ON transaction_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Default categories (inserted on first login via trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.insert_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.transaction_categories (user_id, name, icon, color, type, is_default) VALUES
    (NEW.id, 'Combustível',    'fuel',         '#FF9F0A', 'expense', true),
    (NEW.id, 'Manutenção',     'wrench',       '#FF453A', 'expense', true),
    (NEW.id, 'Documentação',   'file-text',    '#5E5CE6', 'expense', true),
    (NEW.id, 'Marketing',      'megaphone',    '#FF375F', 'expense', true),
    (NEW.id, 'Salários',       'users',        '#1C1C1E', 'expense', true),
    (NEW.id, 'Aluguel',        'home',         '#636366', 'expense', true),
    (NEW.id, 'Comissões',      'percent',      '#FF9F0A', 'expense', true),
    (NEW.id, 'Outros',         'more-horizontal','#8E8E93','expense', true),
    (NEW.id, 'Venda de Carro', 'car',          '#30D158', 'income',  true);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not insert default categories for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.insert_default_categories();
