-- Allow unauthenticated users to read basic escola branding info (nome, logo_url)
-- This is needed for the login page to display the school logo
CREATE POLICY "escola_public_branding_read" 
ON public.escola 
FOR SELECT 
USING (true);

-- Note: The existing escola_tenant_isolation policy handles authenticated users
-- This new policy allows anyone to read escola data for branding purposes