-- Adds receipt image support for vehicles and transactions.
-- Transactions already have receipt_url in the base schema; vehicles need it too.

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "receipts_read" ON storage.objects;
CREATE POLICY "receipts_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "receipts_insert_own_or_demo" ON storage.objects;
CREATE POLICY "receipts_insert_own_or_demo" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL AND (storage.foldername(name))[1] = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
    )
  );

DROP POLICY IF EXISTS "receipts_update_own_or_demo" ON storage.objects;
CREATE POLICY "receipts_update_own_or_demo" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL AND (storage.foldername(name))[1] = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
    )
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL AND (storage.foldername(name))[1] = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
    )
  );

DROP POLICY IF EXISTS "receipts_delete_own_or_demo" ON storage.objects;
CREATE POLICY "receipts_delete_own_or_demo" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (
    bucket_id = 'receipts'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL AND (storage.foldername(name))[1] = '193b0ae6-4856-4c9d-a6b5-0b6466428e75')
    )
  );
