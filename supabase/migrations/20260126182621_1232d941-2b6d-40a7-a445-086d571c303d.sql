-- Policy to allow platform admins to upload system assets
CREATE POLICY "Platform admins can upload system assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'system'
  AND public.is_platform_admin(auth.uid())
);

-- Policy to allow platform admins to update system assets
CREATE POLICY "Platform admins can update system assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'system'
  AND public.is_platform_admin(auth.uid())
);

-- Policy to allow platform admins to delete system assets
CREATE POLICY "Platform admins can delete system assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'system'
  AND public.is_platform_admin(auth.uid())
);