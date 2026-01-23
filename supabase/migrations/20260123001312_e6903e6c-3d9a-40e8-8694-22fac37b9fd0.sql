-- Add tenant_id to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Add tenant_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Add tenant_id to escola
ALTER TABLE public.escola ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy for platform_settings
CREATE POLICY "Platform admins can manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Update audit_logs RLS policies
DROP POLICY IF EXISTS "Platform admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Platform admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);