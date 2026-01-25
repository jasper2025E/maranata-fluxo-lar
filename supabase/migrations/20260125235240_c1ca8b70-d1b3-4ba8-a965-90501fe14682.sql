-- Create table for pre-enrollment leads (captured from public website forms)
CREATE TABLE public.prematricula_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Lead data
  nome_aluno VARCHAR(200) NOT NULL,
  data_nascimento DATE,
  nome_responsavel VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  curso_interesse VARCHAR(200),
  mensagem TEXT,
  
  -- Tracking
  origem VARCHAR(100) DEFAULT 'website',
  status VARCHAR(50) DEFAULT 'novo',
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prematricula_leads ENABLE ROW LEVEL SECURITY;

-- Public INSERT policy (anyone can submit a lead)
CREATE POLICY "Anyone can submit pre-enrollment lead"
ON public.prematricula_leads
FOR INSERT
WITH CHECK (true);

-- Admins can view their tenant's leads
CREATE POLICY "Admins can view their leads"
ON public.prematricula_leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = prematricula_leads.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- Admins can update their tenant's leads
CREATE POLICY "Admins can update their leads"
ON public.prematricula_leads
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = prematricula_leads.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- Admins can delete their tenant's leads
CREATE POLICY "Admins can delete their leads"
ON public.prematricula_leads
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    INNER JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND p.tenant_id = prematricula_leads.tenant_id
    AND ur.role = 'admin'::app_role
  )
);

-- Create index for tenant lookups
CREATE INDEX idx_prematricula_leads_tenant ON public.prematricula_leads(tenant_id);
CREATE INDEX idx_prematricula_leads_status ON public.prematricula_leads(status);
CREATE INDEX idx_prematricula_leads_created ON public.prematricula_leads(created_at DESC);