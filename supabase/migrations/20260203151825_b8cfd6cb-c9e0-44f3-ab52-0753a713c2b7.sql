
-- =====================================================
-- REMOVE PUBLIC ACCESS to school_website_config base table
-- All public access must go through school_website_public_safe view
-- =====================================================

-- Remove the permissive public SELECT policy
DROP POLICY IF EXISTS "Public websites are readable by everyone" ON public.school_website_config;

-- Ensure only authenticated tenant members can access the base table
-- Public users MUST use the safe view or RPC function instead

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Admins can view their school website" ON public.school_website_config;
DROP POLICY IF EXISTS "Tenant users can view website config" ON public.school_website_config;
DROP POLICY IF EXISTS "Tenant members can read their own website config" ON public.school_website_config;

-- Keep only the clean policies:
-- 1. Tenant users can read their own config (uses get_user_tenant_id())
-- 2. Tenant admins can manage (ALL) their config
-- 3. Admin-specific policies for insert/update/delete

-- Verify the remaining SELECT policies properly restrict access
-- The "Tenant users can read their own website config" policy using get_user_tenant_id()
-- should be the only SELECT policy remaining for authenticated users
