-- REVIEW BEFORE RUNNING IN PRODUCTION. This is intentionally not run by deploys.
-- First apply auth_profiles.sql. Then supply Eustaquio's *existing bcrypt hash*
-- as a psql variable; do not provide or store a plaintext PIN in this file.
-- Example (the hash is read from a secure secret manager):
--   psql "$DATABASE_URL" -v eustaquio_pin_hash='...bcrypt hash...' -f supabase/auth_profiles_recovery.sql
--
-- This is insert-only. It cannot replace a profile ID, PIN hash, permissions,
-- activation state, or any other profile field that already exists.
INSERT INTO public.app_profiles (name, role, pin_hash, is_active, permissions)
SELECT 'Eustaquio', 'owner', :'eustaquio_pin_hash', TRUE, '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_profiles WHERE lower(name) = lower('Eustaquio')
)
ON CONFLICT DO NOTHING;
