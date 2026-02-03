-- Habilitar realtime para tabelas adicionais (despesas e alunos)
-- Verifica se já não estão habilitadas antes de adicionar
DO $$
BEGIN
  -- Adicionar despesas ao realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'despesas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.despesas;
  END IF;
  
  -- Adicionar alunos ao realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'alunos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;
  END IF;
  
  -- Adicionar responsaveis ao realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'responsaveis'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.responsaveis;
  END IF;
  
  -- Adicionar cursos ao realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'cursos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cursos;
  END IF;
  
  -- Adicionar turmas ao realtime se não estiver
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'turmas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.turmas;
  END IF;
END $$;