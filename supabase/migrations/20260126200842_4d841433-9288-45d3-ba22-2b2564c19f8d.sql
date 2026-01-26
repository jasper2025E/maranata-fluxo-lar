-- Remove old constraint and add new one with all announcement types
ALTER TABLE public.platform_announcements 
DROP CONSTRAINT platform_announcements_type_check;

ALTER TABLE public.platform_announcements 
ADD CONSTRAINT platform_announcements_type_check 
CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text, 'promo'::text, 'urgent'::text, 'maintenance'::text]));