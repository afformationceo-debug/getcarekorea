-- Migration: Create storage bucket and policies for interpreter photos
-- Note: Buckets are created via Supabase Dashboard or storage-api, but we set up policies here

-- Create storage bucket for interpreters if it doesn't exist
-- This uses the storage-api extension
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interpreters',
  'interpreters',
  true,  -- public bucket for serving images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access to interpreter photos
CREATE POLICY "Public read access for interpreter photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'interpreters');

-- Allow authenticated users (admin) to upload interpreter photos
CREATE POLICY "Admin upload access for interpreter photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'interpreters');

-- Allow authenticated users (admin) to update interpreter photos
CREATE POLICY "Admin update access for interpreter photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'interpreters');

-- Allow authenticated users (admin) to delete interpreter photos
CREATE POLICY "Admin delete access for interpreter photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'interpreters');

-- Also allow service role (for API routes using admin client)
-- Note: Service role bypasses RLS, so these policies are mainly for authenticated users
