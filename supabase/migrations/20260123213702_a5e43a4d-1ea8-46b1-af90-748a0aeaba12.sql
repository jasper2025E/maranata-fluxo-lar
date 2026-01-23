-- Fix: pgcrypto is installed in schema extensions, so use extensions.gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_gateway_webhook_url()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  NEW.webhook_token := encode(extensions.gen_random_bytes(32), 'hex');
  RETURN NEW;
END;
$$;
