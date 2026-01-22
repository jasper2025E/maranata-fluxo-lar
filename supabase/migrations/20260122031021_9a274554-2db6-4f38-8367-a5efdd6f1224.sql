-- Create table for integration settings
CREATE TABLE public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage settings
CREATE POLICY "Admins can view integration settings"
ON public.integration_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert integration settings"
ON public.integration_settings
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update integration settings"
ON public.integration_settings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.integration_settings (setting_key, setting_value, description) VALUES
('webhook_events', '{"PAYMENT_CREATED": true, "PAYMENT_RECEIVED": true, "PAYMENT_CONFIRMED": true, "PAYMENT_OVERDUE": true, "PAYMENT_REFUNDED": false, "PAYMENT_DELETED": false}', 'Eventos de webhook habilitados'),
('security_settings', '{"validate_webhook_token": true, "rate_limiting": true, "audit_logs": true}', 'Configurações de segurança das integrações'),
('asaas_settings', '{"environment": "production", "enabled": true}', 'Configurações específicas do Asaas'),
('stripe_settings', '{"environment": "test", "enabled": true}', 'Configurações específicas do Stripe');

-- Add trigger to update updated_at
CREATE TRIGGER update_integration_settings_updated_at
BEFORE UPDATE ON public.integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();