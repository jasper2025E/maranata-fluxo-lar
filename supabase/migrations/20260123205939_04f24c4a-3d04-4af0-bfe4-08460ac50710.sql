-- Create table for saved payment methods
CREATE TABLE public.tenant_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT NOT NULL, -- visa, mastercard, amex, etc.
  card_last_four TEXT NOT NULL, -- Last 4 digits
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, stripe_payment_method_id)
);

-- Enable RLS
ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

-- Tenant admins can view their own payment methods
CREATE POLICY "Tenant admins can view own payment methods"
  ON public.tenant_payment_methods
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin')
  );

-- Tenant admins can manage their own payment methods
CREATE POLICY "Tenant admins can manage own payment methods"
  ON public.tenant_payment_methods
  FOR ALL
  USING (
    tenant_id = get_user_tenant_id() AND has_role(auth.uid(), 'admin')
  );

-- Platform admins can view all payment methods
CREATE POLICY "Platform admins can view all payment methods"
  ON public.tenant_payment_methods
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_tenant_payment_methods_tenant ON public.tenant_payment_methods(tenant_id);
CREATE INDEX idx_tenant_payment_methods_default ON public.tenant_payment_methods(tenant_id, is_default) WHERE is_default = true;

-- Add automatic billing columns to tenants table
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS auto_billing_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_billing_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1;

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_payment_methods_updated_at
  BEFORE UPDATE ON public.tenant_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();