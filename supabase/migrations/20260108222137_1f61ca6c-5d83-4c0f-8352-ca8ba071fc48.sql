-- Drop tables in correct order (respecting foreign key dependencies)

-- First drop tables that reference other marketing tables
DROP TABLE IF EXISTS marketing_page_pixels CASCADE;
DROP TABLE IF EXISTS marketing_page_history CASCADE;
DROP TABLE IF EXISTS marketing_page_views CASCADE;
DROP TABLE IF EXISTS marketing_conversions CASCADE;
DROP TABLE IF EXISTS marketing_pixel_events CASCADE;

-- Then drop the main tables
DROP TABLE IF EXISTS marketing_landing_pages CASCADE;
DROP TABLE IF EXISTS marketing_pixels CASCADE;
DROP TABLE IF EXISTS marketing_domains CASCADE;
DROP TABLE IF EXISTS marketing_config CASCADE;
DROP TABLE IF EXISTS marketing_audit_logs CASCADE;

-- Drop the enums related to marketing
DROP TYPE IF EXISTS pixel_type CASCADE;
DROP TYPE IF EXISTS domain_status CASCADE;
DROP TYPE IF EXISTS landing_page_status CASCADE;