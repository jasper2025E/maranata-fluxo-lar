-- Add storage tracking columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 524288000; -- 500MB default

-- Add custom domain verification columns to school_website_config
ALTER TABLE public.school_website_config 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_ssl_status TEXT DEFAULT 'pending';

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_school_website_custom_domain 
ON public.school_website_config(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.tenants.storage_used_bytes IS 'Current storage usage in bytes for this tenant';
COMMENT ON COLUMN public.tenants.storage_limit_bytes IS 'Maximum storage allowed for this tenant based on plan';