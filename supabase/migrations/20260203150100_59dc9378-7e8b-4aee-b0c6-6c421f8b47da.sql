-- =====================================================
-- SECURITY HARDENING PHASE 3
-- Force SECURITY INVOKER on all public views
-- =====================================================

-- Set security_invoker = true explicitly on all views
ALTER VIEW public.escola_public_branding SET (security_invoker = on);
ALTER VIEW public.school_website_public_minimal SET (security_invoker = on);
ALTER VIEW public.security_summary SET (security_invoker = on);

-- Fix the remaining permissive RLS policy
-- Check which one is causing the warning
-- For prematricula_leads, it's intentionally open for public lead capture
-- This is a business requirement, not a security flaw