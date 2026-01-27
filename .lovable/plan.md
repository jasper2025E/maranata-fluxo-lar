
# Plano: Sistema Completo de Notificações em Tempo Real

## Visão Geral

Implementar um sistema robusto de notificações que alerta o administrador sobre eventos importantes em todos os módulos do sistema, incluindo:

- Pagamentos registrados (manuais e via gateway)
- Novos alunos cadastrados via pré-matrícula no site
- Novos responsáveis cadastrados via site
- Folha de pagamento do RH (criação, pagamento)
- Problemas de integração com gateways de pagamento
- Alertas de erros em qualquer módulo

## Arquitetura da Solução

A implementação será feita em três camadas:

1. **Database Triggers** - Para eventos que ocorrem diretamente no banco (pagamentos manuais, folha de pagamento)
2. **Edge Functions** - Para eventos que passam por funções (pré-matrícula, webhooks)
3. **Frontend Hooks** - Para capturar erros de integração e criar notificações contextuais

## Etapas de Implementação

### Etapa 1: Criar Função Utilitária para Notificações

Criar uma função no banco de dados para facilitar a criação de notificações:

```sql
CREATE OR REPLACE FUNCTION public.criar_notificacao(
  p_tenant_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (tenant_id, title, message, type, link)
  VALUES (p_tenant_id, p_title, p_message, p_type, p_link)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;
```

### Etapa 2: Trigger para Pagamentos Manuais

Criar trigger que dispara quando um pagamento é inserido diretamente no banco (pagamentos manuais):

```sql
CREATE OR REPLACE FUNCTION public.notify_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_aluno_nome TEXT;
  v_valor_formatado TEXT;
BEGIN
  -- Buscar nome do aluno via fatura
  SELECT a.nome_completo INTO v_aluno_nome
  FROM faturas f
  JOIN alunos a ON a.id = f.aluno_id
  WHERE f.id = NEW.fatura_id;
  
  v_valor_formatado := 'R$ ' || TO_CHAR(NEW.valor, 'FM999G999D00');
  
  -- Criar notificação apenas para pagamentos não-estorno
  IF NEW.tipo IS DISTINCT FROM 'estorno' THEN
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Pagamento Registrado',
      v_valor_formatado || ' recebido de ' || COALESCE(v_aluno_nome, 'Aluno') || ' via ' || COALESCE(NEW.metodo, 'Manual'),
      'success',
      '/faturas'
    );
  ELSE
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Estorno Registrado',
      'Estorno de ' || v_valor_formatado || ' para ' || COALESCE(v_aluno_nome, 'Aluno'),
      'warning',
      '/faturas'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_payment
  AFTER INSERT ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_payment();
```

### Etapa 3: Trigger para Folha de Pagamento

Criar triggers para alertar sobre folha de pagamento:

```sql
-- Notificar nova folha criada
CREATE OR REPLACE FUNCTION public.notify_on_folha_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_func_nome TEXT;
  v_mes_nome TEXT;
  v_meses TEXT[] := ARRAY['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
BEGIN
  SELECT nome_completo INTO v_func_nome
  FROM funcionarios WHERE id = NEW.funcionario_id;
  
  v_mes_nome := v_meses[NEW.mes_referencia];
  
  INSERT INTO notifications (tenant_id, title, message, type, link)
  VALUES (
    NEW.tenant_id,
    'Folha de Pagamento Gerada',
    'Folha de ' || COALESCE(v_func_nome, 'Funcionário') || ' - ' || v_mes_nome || '/' || NEW.ano_referencia,
    'info',
    '/rh'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_folha_created
  AFTER INSERT ON folha_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_folha_created();

-- Notificar folha paga
CREATE OR REPLACE FUNCTION public.notify_on_folha_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_func_nome TEXT;
  v_valor_formatado TEXT;
BEGIN
  -- Só notifica se mudou de não-pago para pago
  IF OLD.pago = false AND NEW.pago = true THEN
    SELECT nome_completo INTO v_func_nome
    FROM funcionarios WHERE id = NEW.funcionario_id;
    
    v_valor_formatado := 'R$ ' || TO_CHAR(NEW.total_liquido, 'FM999G999D00');
    
    INSERT INTO notifications (tenant_id, title, message, type, link)
    VALUES (
      NEW.tenant_id,
      'Folha Paga',
      'Pagamento de ' || v_valor_formatado || ' para ' || COALESCE(v_func_nome, 'Funcionário') || ' registrado',
      'success',
      '/rh'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_folha_paid
  AFTER UPDATE ON folha_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_folha_paid();
```

### Etapa 4: Atualizar Edge Function de Pré-Matrícula

Modificar `register-prematricula` para criar notificações quando novos alunos/responsáveis são cadastrados via site:

```typescript
// Após criar alunos com sucesso, adicionar:

// Notificar sobre novo responsável (se foi criado novo)
if (!existingResp) {
  await supabase.from("notifications").insert({
    tenant_id: tenant_id,
    title: "Novo Responsável Cadastrado",
    message: `${responsavel.nome} se cadastrou via site da escola`,
    type: "info",
    link: "/responsaveis"
  });
}

// Notificar sobre novos alunos
for (const alunoId of createdAlunos) {
  const alunoInfo = alunos.find(a => true); // buscar nome
  await supabase.from("notifications").insert({
    tenant_id: tenant_id,
    title: "Nova Pré-Matrícula",
    message: `Aluno cadastrado via site - aguardando aprovação`,
    type: "info",
    link: "/alunos"
  });
}
```

### Etapa 5: Notificações de Erros de Integração

Atualizar os webhooks do Asaas e Stripe para notificar sobre erros:

```typescript
// Em asaas-webhook/index.ts - no catch de erro:
await supabase.from("notifications").insert({
  tenant_id: fatura?.tenant_id,
  title: "Erro na Integração Asaas",
  message: `Falha ao processar webhook: ${errorMessage}`,
  type: "error",
  link: "/configuracoes"
});

// Também para eventos específicos de falha:
if (["REFUNDED", "CHARGEBACK_REQUESTED"].includes(payment.status)) {
  await supabase.from("notifications").insert({
    tenant_id: fatura.tenant_id,
    title: "Alerta de Pagamento",
    message: `Cobrança ${payment.status === 'REFUNDED' ? 'estornada' : 'contestada'} - verificar`,
    type: "warning",
    link: "/faturas"
  });
}
```

### Etapa 6: Hook de Notificação para Erros no Frontend

Criar utilitário para capturar erros de integração no frontend:

```typescript
// src/lib/notifyError.ts
export async function notifySystemError(
  title: string,
  message: string,
  link?: string
) {
  try {
    await supabase.from("notifications").insert({
      title,
      message,
      type: "error",
      link: link || "/configuracoes"
    });
  } catch (e) {
    console.error("Failed to create error notification:", e);
  }
}
```

Integrar nos hooks existentes (useFaturas, useRH, useAsaas) para capturar erros de integração.

### Etapa 7: Habilitar Realtime na Tabela de Notificações

Garantir que a tabela notifications está habilitada para realtime:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

## Resumo das Mudanças

| Componente | Arquivo | Mudança |
|------------|---------|---------|
| Função SQL | Migration | `criar_notificacao()` |
| Trigger | Migration | `notify_on_payment()` |
| Trigger | Migration | `notify_on_folha_created()` |
| Trigger | Migration | `notify_on_folha_paid()` |
| Edge Function | `register-prematricula/index.ts` | Notificar novo aluno/responsável |
| Edge Function | `asaas-webhook/index.ts` | Notificar erros e estornos |
| Edge Function | `stripe-webhook/index.ts` | Notificar falhas de assinatura |
| Utilitário | `src/lib/notifyError.ts` | Novo arquivo |
| Hooks | `useFaturas.ts`, `useRH.ts` | Integrar notifyError em onError |

## Tipos de Notificação

| Evento | Tipo | Ícone | Link |
|--------|------|-------|------|
| Pagamento recebido | success | CheckCircle | /faturas |
| Estorno | warning | AlertTriangle | /faturas |
| Nova pré-matrícula | info | Info | /alunos |
| Novo responsável | info | Info | /responsaveis |
| Folha gerada | info | Info | /rh |
| Folha paga | success | CheckCircle | /rh |
| Erro de integração | error | AlertCircle | /configuracoes |
| Chargeback/Contestação | warning | AlertTriangle | /faturas |

## Detalhes Técnicos

### Segurança
- Triggers usam `SECURITY DEFINER` para garantir permissões adequadas
- Notificações são isoladas por `tenant_id`
- RLS existente já filtra notificações por tenant

### Performance
- Realtime já está configurado no hook `useNotifications`
- Notificações são inseridas de forma assíncrona
- Limite de 20 notificações no frontend para evitar sobrecarga

### Experiência do Usuário
- Notificações aparecem em tempo real no sino
- Badge animado indica novas notificações
- Clique na notificação marca como lida e navega para o módulo relevante
