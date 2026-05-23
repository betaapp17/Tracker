-- Temporary demo mode for the public app while email signup is rate-limited.
-- This lets unauthenticated visitors read and write only the shared demo user rows.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75') THEN
    RAISE EXCEPTION 'Demo auth user does not exist. Create it before enabling demo mode.';
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_categories TO anon;

DROP POLICY IF EXISTS "demo_vehicles" ON public.vehicles;
CREATE POLICY "demo_vehicles" ON public.vehicles
  FOR ALL TO anon
  USING (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
  WITH CHECK (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75');

DROP POLICY IF EXISTS "demo_transactions" ON public.transactions;
CREATE POLICY "demo_transactions" ON public.transactions
  FOR ALL TO anon
  USING (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
  WITH CHECK (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75');

DROP POLICY IF EXISTS "demo_categories" ON public.transaction_categories;
CREATE POLICY "demo_categories" ON public.transaction_categories
  FOR ALL TO anon
  USING (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
  WITH CHECK (user_id = '193b0ae6-4856-4c9d-a6b5-0b6466428e75');
