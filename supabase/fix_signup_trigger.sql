-- Run this once in the Supabase SQL Editor for the production project.
-- It repairs the auth.users trigger that seeds default categories during signup.

CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT 'tag',
  color       TEXT DEFAULT '#8E8E93',
  type        TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_categories" ON public.transaction_categories;
CREATE POLICY "own_categories" ON public.transaction_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_categories TO authenticated;

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.insert_default_categories();
