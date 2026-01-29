-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Tenant members can read their own website config" ON school_website_config;

-- Create a corrected policy using profiles table instead
CREATE POLICY "Tenant members can read their own website config" ON school_website_config
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT p.tenant_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'platform_admin'
    )
  );