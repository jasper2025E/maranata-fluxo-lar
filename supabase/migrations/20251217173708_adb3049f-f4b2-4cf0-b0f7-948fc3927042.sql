-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop existing permissive policies and create admin-only policies

-- CURSOS
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.cursos;
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.cursos;

CREATE POLICY "Admins can manage courses"
ON public.cursos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ALUNOS
DROP POLICY IF EXISTS "Authenticated users can manage students" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.alunos;

CREATE POLICY "Admins can manage students"
ON public.alunos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FATURAS
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.faturas;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.faturas;

CREATE POLICY "Admins can manage invoices"
ON public.faturas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PAGAMENTOS
DROP POLICY IF EXISTS "Authenticated users can manage payments" ON public.pagamentos;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.pagamentos;

CREATE POLICY "Admins can manage payments"
ON public.pagamentos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DESPESAS
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.despesas;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.despesas;

CREATE POLICY "Admins can manage expenses"
ON public.despesas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grant first existing user admin role (if any exist)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;