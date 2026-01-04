
-- Update rh-documentos bucket to be public for photos
UPDATE storage.buckets SET public = true WHERE id = 'rh-documentos';
