-- Remove redundant policy since we now have public read access for escola
DROP POLICY IF EXISTS "Authenticated users can view escola" ON public.escola;