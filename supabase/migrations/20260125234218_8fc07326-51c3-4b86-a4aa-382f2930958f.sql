-- Drop all existing admin policies
DROP POLICY IF EXISTS "Admins can insert school website" ON public.school_website_config;
DROP POLICY IF EXISTS "Admins can update school website" ON public.school_website_config;
DROP POLICY IF EXISTS "Admins can delete school website" ON public.school_website_config;
DROP POLICY IF EXISTS "Admins can view their school website" ON public.school_website_config;

-- Create new INSERT policy using profiles + user_roles
CREATE POLICY "Admins can insert school website"
ON public.school_website_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = school_website_config.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- CREATE UPDATE policy
CREATE POLICY "Admins can update school website"
ON public.school_website_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = school_website_config.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- CREATE DELETE policy
CREATE POLICY "Admins can delete school website"
ON public.school_website_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = school_website_config.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- CREATE SELECT policy for admins
CREATE POLICY "Admins can view their school website"
ON public.school_website_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = school_website_config.tenant_id
    AND ur.role = 'admin'::app_role
  )
);