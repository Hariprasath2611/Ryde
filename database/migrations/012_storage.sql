-- 012_storage.sql
-- Configures private storage buckets and secure folder-level RLS policies for uploads

-- Create private buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('identity-docs', 'identity-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('driver-docs', 'driver-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('vehicle-docs', 'vehicle-docs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('handover-photos', 'handover-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS Policies on storage.objects

-- 1. SELECT: Users can only read files under their own {auth.uid()} path; admins can read all
DROP POLICY IF EXISTS "storage_objects_select_policy" ON storage.objects;
CREATE POLICY "storage_objects_select_policy" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND (
      public.is_admin()
      OR name LIKE (auth.uid()::text || '/%')
    )
  );

-- 2. INSERT: Users can only upload files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_insert_policy" ON storage.objects;
CREATE POLICY "storage_objects_insert_policy" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );

-- 3. UPDATE: Users can only modify files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_update_policy" ON storage.objects;
CREATE POLICY "storage_objects_update_policy" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );

-- 4. DELETE: Users can only delete files under their own {auth.uid()} path
DROP POLICY IF EXISTS "storage_objects_delete_policy" ON storage.objects;
CREATE POLICY "storage_objects_delete_policy" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('identity-docs', 'driver-docs', 'vehicle-docs', 'handover-photos')
    AND name LIKE (auth.uid()::text || '/%')
  );
