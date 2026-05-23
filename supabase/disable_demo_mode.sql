-- Re-disable temporary public demo mode after normal auth is ready.

DROP POLICY IF EXISTS "demo_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "demo_transactions" ON public.transactions;
DROP POLICY IF EXISTS "demo_categories" ON public.transaction_categories;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.vehicles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.transactions FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.transaction_categories FROM anon;
