
# Plano de Correção: Sincronização Automática de Status de Faturas

## Resumo do Problema
O sistema não está refletindo automaticamente o status de faturas (pagas, vencidas, atrasadas) do gateway de pagamento. As faturas não aparecem corretamente ao buscar/filtrar por status.

## Diagnóstico Técnico

### Problemas Identificados:

1. **Limite de Processamento Insuficiente**
   - O cron job `sync-asaas-payments` processa apenas ~150 faturas por ciclo (100 vencidas + 50 abertas)
   - Existem 511 faturas no sistema, causando atraso na sincronização

2. **Ausência de Trigger Automático Local**
   - Não existe trigger que marca automaticamente faturas como "Vencida" quando `data_vencimento < CURRENT_DATE`
   - A função `atualizar_status_faturas` existe mas requer permissão de role e precisa ser chamada manualmente

3. **Sincronização Dependente Apenas do ASAAS**
   - Faturas sem `asaas_payment_id` não são sincronizadas pelo cron atual
   - Faturas locais com data vencida permanecem como "Aberta" indefinidamente

4. **Pesquisa Global Limitada**
   - O `GlobalSearch` busca faturas apenas por `codigo_sequencial`, não por status

---

## Solução Proposta

### Etapa 1: Trigger Automático de Status Vencida
Criar trigger que atualiza automaticamente o status para "Vencida" quando a data de vencimento passa.

```sql
CREATE OR REPLACE FUNCTION public.auto_update_fatura_vencida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Aberta' 
     AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'Vencida';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_vencida
  BEFORE INSERT OR UPDATE ON public.faturas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_fatura_vencida();
```

### Etapa 2: Cron Job Diário para Marcar Vencidas
Adicionar cron job que executa diariamente para atualizar faturas em lote.

```sql
CREATE OR REPLACE FUNCTION public.mark_overdue_faturas()
RETURNS void AS $$
BEGIN
  UPDATE public.faturas
  SET 
    status = 'Vencida',
    updated_at = NOW()
  WHERE status = 'Aberta'
    AND data_vencimento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar para rodar à meia-noite
SELECT cron.schedule(
  'mark-overdue-faturas-daily',
  '0 0 * * *',
  $$SELECT public.mark_overdue_faturas()$$
);
```

### Etapa 3: Aumentar Limite do Sync ASAAS
Modificar o edge function `sync-asaas-payments` para processar mais faturas:

```typescript
// De 100+50 para 300+200
.limit(300);  // Faturas vencidas
.limit(200);  // Faturas abertas
```

### Etapa 4: Melhorar Pesquisa Global
Atualizar o componente `GlobalSearch.tsx` para buscar faturas por mais campos:

```typescript
// Busca expandida incluindo status e nome do aluno
const { data: faturas } = await supabase
  .from("faturas")
  .select("id, codigo_sequencial, valor, status, alunos(nome_completo)")
  .or(`codigo_sequencial.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`)
  .limit(10);
```

### Etapa 5: Correção Imediata das Faturas Existentes
Executar UPDATE para corrigir todas as faturas que deveriam estar como "Vencida":

```sql
UPDATE faturas
SET status = 'Vencida', updated_at = NOW()
WHERE status = 'Aberta'
  AND data_vencimento < CURRENT_DATE;
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/new_migration.sql` | Criar trigger e função de auto-vencida |
| `supabase/functions/sync-asaas-payments/index.ts` | Aumentar limites de processamento |
| `src/components/GlobalSearch.tsx` | Expandir busca para incluir status |

---

## Resultado Esperado

- Faturas serão marcadas como "Vencida" automaticamente quando a data passar
- Sincronização com ASAAS processará mais faturas por ciclo
- Pesquisa global encontrará faturas por status ("vencida", "paga")
- Sistema atualizado em tempo real via Realtime (já implementado)
- Zero intervenção manual necessária
