-- Allow public read access to escola table for login page
CREATE POLICY "Allow public read escola"
ON public.escola
FOR SELECT
TO anon, authenticated
USING (true);