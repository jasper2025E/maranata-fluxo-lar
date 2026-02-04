
-- Create secure view for system_managers to hide sensitive contact info
CREATE VIEW public.system_managers_safe
WITH (security_invoker = on)
AS
SELECT 
  id,
  nome,
  -- Mask email: show first 2 chars + domain
  CASE 
    WHEN email IS NOT NULL THEN 
      CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2))
    ELSE NULL 
  END as email_masked,
  -- Mask phone: show last 4 digits only
  CASE 
    WHEN phone IS NOT NULL THEN 
      CONCAT('***', RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 4))
    ELSE NULL 
  END as phone_masked,
  platform_role,
  is_active,
  created_at
FROM public.system_managers;

-- Grant access to authenticated users
GRANT SELECT ON public.system_managers_safe TO authenticated;

-- Update system_managers policy to be more restrictive
DROP POLICY IF EXISTS "Gestores podem ver seu próprio perfil" ON public.system_managers;

CREATE POLICY "Managers can only see their own profile"
ON public.system_managers
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Create secure view for pagamentos - hide gateway details and sensitive IDs
CREATE VIEW public.pagamentos_summary
WITH (security_invoker = on)
AS
SELECT 
  p.id,
  p.fatura_id,
  p.valor,
  p.metodo,
  p.data_pagamento,
  p.tipo,
  p.tenant_id,
  p.created_at
FROM public.pagamentos p;

-- Grant access
GRANT SELECT ON public.pagamentos_summary TO authenticated;
