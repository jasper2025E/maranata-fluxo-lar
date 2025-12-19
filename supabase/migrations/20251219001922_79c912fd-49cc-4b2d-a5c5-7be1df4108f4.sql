-- Drop existing restrictive policies and create new inclusive ones
-- Allow all authenticated users with any role to manage data

-- TURMAS: Allow all staff roles
DROP POLICY IF EXISTS "Admins can manage turmas" ON public.turmas;

CREATE POLICY "Staff can view turmas"
ON public.turmas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage turmas"
ON public.turmas
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role)
);

-- CURSOS: Allow all staff roles
DROP POLICY IF EXISTS "Admins can manage courses" ON public.cursos;

CREATE POLICY "Staff can view cursos"
ON public.cursos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage cursos"
ON public.cursos
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role)
);

-- ALUNOS: Allow secretaria and staff
DROP POLICY IF EXISTS "Admins can manage students" ON public.alunos;

CREATE POLICY "Staff can view alunos"
ON public.alunos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage alunos"
ON public.alunos
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'secretaria'::app_role)
);

-- FATURAS: Allow financeiro and staff
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.faturas;

CREATE POLICY "Staff can view faturas"
ON public.faturas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage faturas"
ON public.faturas
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- PAGAMENTOS: Allow financeiro and staff
DROP POLICY IF EXISTS "Admins can manage payments" ON public.pagamentos;

CREATE POLICY "Staff can view pagamentos"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage pagamentos"
ON public.pagamentos
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- DESPESAS: Allow financeiro and staff
DROP POLICY IF EXISTS "Admins can manage expenses" ON public.despesas;

CREATE POLICY "Staff can view despesas"
ON public.despesas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage despesas"
ON public.despesas
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'staff'::app_role) OR 
  has_role(auth.uid(), 'financeiro'::app_role)
);

-- ESCOLA: Allow all authenticated to view, admin to manage
DROP POLICY IF EXISTS "Admins can manage escola" ON public.escola;

CREATE POLICY "All staff can view escola"
ON public.escola
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage escola"
ON public.escola
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to auto-assign admin role to first user
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user (no roles exist yet)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Assign staff role by default for subsequent users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'staff');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table (which is created after user signup)
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();