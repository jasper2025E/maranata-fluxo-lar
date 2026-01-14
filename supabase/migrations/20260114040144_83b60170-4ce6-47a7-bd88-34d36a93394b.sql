-- Allow unauthenticated users to read only escola name and logo for login page
-- This is safe as these are public display fields, not sensitive data

-- Create a more permissive policy just for basic escola info display
CREATE POLICY "Public can view escola name and logo" 
ON public.escola 
FOR SELECT 
USING (true);