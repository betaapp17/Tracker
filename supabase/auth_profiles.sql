-- Persistent application profiles for PIN authentication.
-- Apply this before deploying the database-backed auth routes.
-- This migration never updates or deletes an existing profile.

CREATE TABLE IF NOT EXISTS public.app_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'employee')),
  pin_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_profiles_name_ci_key
  ON public.app_profiles (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS app_profiles_one_owner_key
  ON public.app_profiles (role) WHERE role = 'owner';

ALTER TABLE public.app_profiles ENABLE ROW LEVEL SECURITY;

-- Preserve existing employee IDs, PIN hashes, activation state, and permissions.
-- This is deliberately insert-only: re-running it cannot overwrite any profile.
INSERT INTO public.app_profiles (id, name, role, pin_hash, is_active, permissions, created_at)
SELECT
  e.id,
  e.name,
  'employee',
  e.pin_hash,
  e.is_active,
  COALESCE(e.permissions, '{}'::jsonb),
  e.created_at
FROM public.app_employees e
WHERE NOT EXISTS (
  SELECT 1 FROM public.app_profiles p WHERE lower(p.name) = lower(e.name)
)
ON CONFLICT DO NOTHING;
