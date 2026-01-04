-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, success, warning, error
  read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications (or notifications for all users if user_id is null)
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL);

-- Staff can create notifications
CREATE POLICY "Staff can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;