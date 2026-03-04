-- Fix missing tenant_id for user DHAYRLA MENDES
UPDATE profiles 
SET tenant_id = 'a1692822-1e09-4e24-84e1-53bbc22253f0' 
WHERE id = '488fe7fd-a313-4a44-9721-d11884ea2d39' AND tenant_id IS NULL;

-- Clean up duplicate roles for system owner (keep only platform_admin)
DELETE FROM user_roles 
WHERE user_id = '464496d1-ed66-4f03-8f86-38b3f148bf5a' 
AND role IN ('staff', 'admin');