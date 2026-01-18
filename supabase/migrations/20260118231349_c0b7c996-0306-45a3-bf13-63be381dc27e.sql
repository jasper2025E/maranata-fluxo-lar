-- Fix: Require authentication for ALL notification access
-- The issue is that policies with (user_id IS NULL) allow unauthenticated access

-- Drop all existing SELECT policies on notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view own notifications only" ON public.notifications;
DROP POLICY IF EXISTS "Staff view system notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins view all notifications" ON public.notifications;

-- Create new policies that REQUIRE authentication first

-- Users can view their own notifications (requires auth)
CREATE POLICY "Authenticated users view own notifications" 
ON public.notifications 
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- Staff can view system-wide notifications (user_id IS NULL) - requires auth + role
CREATE POLICY "Authenticated staff view system notifications" 
ON public.notifications 
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  user_id IS NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'staff'::app_role) OR 
    has_role(auth.uid(), 'secretaria'::app_role) OR 
    has_role(auth.uid(), 'financeiro'::app_role)
  )
);

-- Admins can view ALL notifications
CREATE POLICY "Admin view all notifications" 
ON public.notifications 
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix UPDATE policy to require authentication
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Authenticated users update own notifications" 
ON public.notifications 
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR (
      user_id IS NULL AND (
        has_role(auth.uid(), 'admin'::app_role) OR 
        has_role(auth.uid(), 'staff'::app_role)
      )
    )
  )
);