-- Drop the existing ALL policy
DROP POLICY IF EXISTS "Admins can manage their school website" ON public.school_website_config;

-- Create separate policies for each operation
-- SELECT policy (already exists for public)
-- INSERT policy
CREATE POLICY "Admins can insert school website"
ON public.school_website_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_users su
    WHERE su.id = auth.uid()
    AND su.tenant_id = tenant_id
    AND su.role IN ('owner', 'admin')
  )
);

-- UPDATE policy
CREATE POLICY "Admins can update school website"
ON public.school_website_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM school_users su
    WHERE su.id = auth.uid()
    AND su.tenant_id = school_website_config.tenant_id
    AND su.role IN ('owner', 'admin')
  )
);

-- DELETE policy
CREATE POLICY "Admins can delete school website"
ON public.school_website_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM school_users su
    WHERE su.id = auth.uid()
    AND su.tenant_id = school_website_config.tenant_id
    AND su.role IN ('owner', 'admin')
  )
);

-- SELECT policy for admins (to see their own config even if disabled)
CREATE POLICY "Admins can view their school website"
ON public.school_website_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_users su
    WHERE su.id = auth.uid()
    AND su.tenant_id = school_website_config.tenant_id
    AND su.role IN ('owner', 'admin')
  )
);