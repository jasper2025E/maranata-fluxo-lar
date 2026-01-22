-- Create table for API request logs
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for webhook logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'asaas', 'stripe', etc.
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received', -- 'received', 'processed', 'failed'
  error_message TEXT,
  processing_time_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_endpoint ON public.api_request_logs(endpoint);
CREATE INDEX idx_api_request_logs_status_code ON public.api_request_logs(status_code);

CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_source ON public.webhook_logs(source);
CREATE INDEX idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);

-- Enable RLS
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can view logs
CREATE POLICY "Admins can view API request logs"
ON public.api_request_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view webhook logs"
ON public.webhook_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs (for edge functions)
CREATE POLICY "Service role can insert API logs"
ON public.api_request_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can insert webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (true);