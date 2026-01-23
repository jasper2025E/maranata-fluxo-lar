-- First migration: Just add the enum value
-- The function using it will be created in a separate migration
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';