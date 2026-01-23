-- Função para sincronizar escola → tenants
CREATE OR REPLACE FUNCTION public.sync_escola_to_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a escola tem um tenant_id, atualiza o tenant correspondente
  IF NEW.tenant_id IS NOT NULL THEN
    UPDATE public.tenants
    SET 
      nome = COALESCE(NEW.nome, nome),
      cnpj = COALESCE(NEW.cnpj, cnpj),
      email = COALESCE(NEW.email, email),
      telefone = COALESCE(NEW.telefone, telefone),
      endereco = COALESCE(NEW.endereco, endereco),
      logo_url = COALESCE(NEW.logo_url, logo_url),
      updated_at = now()
    WHERE id = NEW.tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para sincronizar tenants → escola
CREATE OR REPLACE FUNCTION public.sync_tenant_to_escola()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza todas as escolas vinculadas a este tenant
  UPDATE public.escola
  SET 
    nome = COALESCE(NEW.nome, nome),
    cnpj = COALESCE(NEW.cnpj, cnpj),
    email = COALESCE(NEW.email, email),
    telefone = COALESCE(NEW.telefone, telefone),
    endereco = COALESCE(NEW.endereco, endereco),
    logo_url = COALESCE(NEW.logo_url, logo_url),
    updated_at = now()
  WHERE tenant_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para criar escola automaticamente quando tenant é criado
CREATE OR REPLACE FUNCTION public.auto_create_escola_for_tenant()
RETURNS TRIGGER AS $$
DECLARE
  escola_exists boolean;
BEGIN
  -- Verifica se já existe uma escola para este tenant
  SELECT EXISTS(SELECT 1 FROM public.escola WHERE tenant_id = NEW.id) INTO escola_exists;
  
  -- Se não existe, cria uma nova escola
  IF NOT escola_exists THEN
    INSERT INTO public.escola (
      nome,
      cnpj,
      email,
      telefone,
      endereco,
      logo_url,
      tenant_id
    ) VALUES (
      NEW.nome,
      NEW.cnpj,
      NEW.email,
      NEW.telefone,
      NEW.endereco,
      NEW.logo_url,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para criar tenant automaticamente quando escola é criada sem tenant_id
CREATE OR REPLACE FUNCTION public.auto_create_tenant_for_escola()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Se a escola não tem tenant_id, cria um novo tenant
  IF NEW.tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      nome,
      cnpj,
      email,
      telefone,
      endereco,
      logo_url,
      status,
      plano,
      subscription_status
    ) VALUES (
      NEW.nome,
      NEW.cnpj,
      NEW.email,
      NEW.telefone,
      NEW.endereco,
      NEW.logo_url,
      'ativo',
      'basic',
      'trial'
    )
    RETURNING id INTO new_tenant_id;
    
    -- Atualiza a escola com o novo tenant_id
    NEW.tenant_id := new_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers na tabela escola
DROP TRIGGER IF EXISTS trigger_sync_escola_to_tenant ON public.escola;
CREATE TRIGGER trigger_sync_escola_to_tenant
  AFTER UPDATE ON public.escola
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.sync_escola_to_tenant();

DROP TRIGGER IF EXISTS trigger_auto_create_tenant_for_escola ON public.escola;
CREATE TRIGGER trigger_auto_create_tenant_for_escola
  BEFORE INSERT ON public.escola
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_tenant_for_escola();

-- Triggers na tabela tenants
DROP TRIGGER IF EXISTS trigger_sync_tenant_to_escola ON public.tenants;
CREATE TRIGGER trigger_sync_tenant_to_escola
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.sync_tenant_to_escola();

DROP TRIGGER IF EXISTS trigger_auto_create_escola_for_tenant ON public.tenants;
CREATE TRIGGER trigger_auto_create_escola_for_tenant
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_escola_for_tenant();