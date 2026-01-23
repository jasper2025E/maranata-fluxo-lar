
-- Trigger para registrar automaticamente histórico quando status da assinatura muda
CREATE OR REPLACE FUNCTION public.log_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o status mudou
  IF OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
    INSERT INTO public.subscription_history (
      tenant_id,
      event_type,
      old_status,
      new_status,
      amount,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.subscription_status = 'active' AND OLD.subscription_status = 'trial' THEN 'activated'
        WHEN NEW.subscription_status = 'active' AND OLD.subscription_status = 'suspended' THEN 'reactivated'
        WHEN NEW.subscription_status = 'active' THEN 'subscription_updated'
        WHEN NEW.subscription_status = 'suspended' THEN 'suspended'
        WHEN NEW.subscription_status = 'cancelled' THEN 'subscription_cancelled'
        WHEN NEW.subscription_status = 'past_due' THEN 'payment_failed'
        WHEN NEW.subscription_status = 'trial' THEN 'trial_started'
        ELSE 'subscription_updated'
      END,
      OLD.subscription_status,
      NEW.subscription_status,
      NEW.monthly_price,
      jsonb_build_object(
        'plano', NEW.plano,
        'changed_at', NOW()
      )
    );
  END IF;
  
  -- Se preço mudou, registra também
  IF OLD.monthly_price IS DISTINCT FROM NEW.monthly_price AND OLD.monthly_price IS NOT NULL THEN
    INSERT INTO public.subscription_history (
      tenant_id,
      event_type,
      old_status,
      new_status,
      amount,
      metadata
    ) VALUES (
      NEW.id,
      'subscription_updated',
      NEW.subscription_status,
      NEW.subscription_status,
      NEW.monthly_price,
      jsonb_build_object(
        'old_price', OLD.monthly_price,
        'new_price', NEW.monthly_price,
        'message', 'Valor da mensalidade alterado'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para capturar alterações de status
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON public.tenants;
CREATE TRIGGER trigger_log_subscription_change
  AFTER UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_status_change();

-- Trigger para registrar criação de tenant
CREATE OR REPLACE FUNCTION public.log_tenant_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscription_history (
    tenant_id,
    event_type,
    old_status,
    new_status,
    amount,
    metadata
  ) VALUES (
    NEW.id,
    'created',
    NULL,
    NEW.subscription_status,
    NEW.monthly_price,
    jsonb_build_object(
      'nome', NEW.nome,
      'plano', NEW.plano,
      'message', 'Escola cadastrada no sistema'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_log_tenant_creation ON public.tenants;
CREATE TRIGGER trigger_log_tenant_creation
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tenant_creation();
