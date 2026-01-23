-- Add RLS policies for platform admin to view all data globally

-- Policy for alunos table
CREATE POLICY "Platform admins can view all alunos"
ON public.alunos
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy for faturas table  
CREATE POLICY "Platform admins can view all faturas"
ON public.faturas
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy for cursos table
CREATE POLICY "Platform admins can view all cursos"
ON public.cursos
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy for responsaveis table
CREATE POLICY "Platform admins can view all responsaveis"
ON public.responsaveis
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy for profiles table (already might exist but adding for completeness)
CREATE POLICY "Platform admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy for user_roles table
CREATE POLICY "Platform admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (is_platform_admin(auth.uid()));