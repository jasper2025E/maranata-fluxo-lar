-- Drop and recreate the function to ensure it uses pgcrypto properly
DROP FUNCTION IF EXISTS public.generate_gateway_webhook_url() CASCADE;

-- Recreate the function with explicit schema reference
CREATE OR REPLACE FUNCTION public.generate_gateway_webhook_url()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate unique webhook token using pgcrypto
  NEW.webhook_token := encode(public.gen_random_bytes(32), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER generate_webhook_on_insert
  BEFORE INSERT ON public.tenant_gateway_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_gateway_webhook_url();