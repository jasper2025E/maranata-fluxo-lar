
# Plano: Suporte a Pagamento Parcial com Sincronização Asaas

## Problema Identificado

Quando você registra um **pagamento parcial** no sistema:

1. O saldo restante é calculado corretamente no banco local
2. **Mas** o sistema marca a fatura como "Paga" no Asaas
3. **E** não cria uma nova cobrança para o valor restante
4. Resultado: O cliente fica devendo, mas não há boleto/PIX para cobrar o resto

## Causa Raiz

O Asaas não suporta "pagamentos parciais" nativos em uma mesma cobrança. Uma cobrança no Asaas é de valor fixo - ou está paga por inteiro ou não está.

```text
┌─────────────────────────────────────────────────────────────┐
│  Fluxo Atual (quebrado)                                     │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário seleciona "Pagamento Parcial" no sistema        │
│  2. Informa R$ 100 (de uma fatura de R$ 200)                │
│  3. Sistema salva pagamento + atualiza saldo_restante       │
│  4. Chama asaas-receive-in-cash                             │
│  5. Asaas marca cobrança como PAGA (valor total: R$ 200)    │
│  6. Não existe cobrança para os R$ 100 restantes            │
│  ❌ Cliente não recebe boleto/PIX do saldo                   │
└─────────────────────────────────────────────────────────────┘
```

## Solução Proposta

Implementar fluxo de "Fatura Derivada" (ou fatura filha):

```text
┌─────────────────────────────────────────────────────────────┐
│  Fluxo Corrigido                                            │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário seleciona "Pagamento Parcial"                   │
│  2. Informa R$ 100 (de uma fatura de R$ 200)                │
│  3. Sistema:                                                │
│     a) Registra pagamento de R$ 100                         │
│     b) Marca fatura original como "Paga"                    │
│     c) CANCELA cobrança original no Asaas                   │
│     d) Cria NOVA fatura de R$ 100 (valor restante)          │
│     e) Vincula nova fatura à original (fatura_origem_id)    │
│     f) Cria NOVA cobrança no Asaas para R$ 100              │
│  4. Cliente recebe novo boleto/PIX pelo saldo               │
│  ✅ Saldo fica rastreável e cobrável                         │
└─────────────────────────────────────────────────────────────┘
```

## Alterações Necessárias

### 1. Migração de Banco de Dados
Adicionar coluna para rastrear faturas derivadas de pagamentos parciais:

```sql
-- Coluna para vincular fatura derivada à original
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS fatura_origem_id UUID REFERENCES faturas(id);
ALTER TABLE faturas ADD COLUMN IF NOT EXISTS tipo_origem TEXT DEFAULT NULL;
-- Valores possíveis: 'pagamento_parcial', 'renegociacao', etc.
```

### 2. Nova Edge Function: `asaas-create-remainder-payment`
Função específica para criar cobrança do valor restante:
- Recebe: `faturaOrigemId`, `valorRestante`, `dataVencimento`
- Cria nova fatura no banco com `fatura_origem_id` preenchido
- Cria cobrança no Asaas
- Retorna dados da nova fatura

### 3. Atualizar Hook `useRegistrarPagamento`
Quando `tipo === 'parcial'`:
- Após salvar pagamento, calcular saldo restante
- Chamar nova função para criar fatura derivada
- Cancelar cobrança original no Asaas (ou deixar como está se preferir manter histórico)
- Atualizar UI para mostrar que nova cobrança foi criada

### 4. Atualizar UI `FaturaDetails.tsx`
- Mostrar indicador visual quando fatura tem `fatura_origem_id`
- Exibir link para fatura original
- Adicionar seção "Faturas Derivadas" quando houver

### 5. Atualizar Edge Function `asaas-receive-in-cash`
- Aceitar parâmetro `isPartial: boolean`
- Se parcial: NÃO marcar como "Paga" - deixar a lógica no hook
- Registrar apenas o valor informado no Asaas (se suportado)

### 6. Atualizar Webhook `asaas-webhook`
- Verificar se valor pago corresponde ao valor total da fatura
- Se menor: manter status "Aberta" ou criar fatura derivada automaticamente

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| Nova migração SQL | Criar | Adicionar `fatura_origem_id` e `tipo_origem` |
| `supabase/functions/asaas-create-remainder-payment/index.ts` | Criar | Função para criar fatura + cobrança do saldo |
| `src/hooks/useFaturas.ts` | Modificar | Atualizar `useRegistrarPagamento` para criar fatura derivada |
| `src/components/faturas/FaturaDetails.tsx` | Modificar | Mostrar vínculo com fatura origem/derivadas |
| `supabase/functions/asaas-receive-in-cash/index.ts` | Modificar | Suportar flag `isPartial` |
| `supabase/functions/asaas-webhook/index.ts` | Modificar | Detectar pagamento parcial automático |
| `supabase/config.toml` | Modificar | Adicionar configuração da nova função |

## Fluxo Técnico Detalhado

```text
┌──────────────────────────────────────────────────────────────┐
│  useRegistrarPagamento({ tipo: 'parcial', valor: 100 })     │
├──────────────────────────────────────────────────────────────┤
│  1. INSERT pagamentos (R$ 100)                               │
│  2. SELECT fatura (valor_total = R$ 200)                     │
│  3. saldoRestante = 200 - 100 = R$ 100                       │
│  4. UPDATE faturas SET status = 'Paga' WHERE id = original   │
│  5. IF saldoRestante > 0:                                    │
│     a) invoke('asaas-cancel-payment', { faturaId })          │
│     b) INSERT faturas (nova, R$ 100, fatura_origem_id)       │
│     c) invoke('asaas-create-payment', { faturaId: nova })    │
│  6. Notificar usuário: "Pagamento registrado. Nova cobrança  │
│     de R$ 100 criada para o saldo restante."                 │
└──────────────────────────────────────────────────────────────┘
```

## Considerações de UX

1. **Feedback claro**: Quando pagamento parcial é registrado, exibir toast explicando que nova cobrança foi criada
2. **Visualização**: Na lista de faturas, mostrar badge "Derivada" ou ícone indicando origem
3. **Histórico**: Manter rastreabilidade completa (qual pagamento gerou qual fatura)
4. **Impressão de Carnê**: Permitir incluir faturas derivadas nos carnês

## Resultado Esperado

Após implementação:
- ✅ Pagamento parcial registrado corretamente
- ✅ Fatura original marcada como paga (pelo valor recebido)
- ✅ Nova fatura criada para o saldo restante
- ✅ Nova cobrança no Asaas com boleto/PIX
- ✅ Cliente recebe automaticamente link para pagar o saldo
- ✅ Dashboard atualizado em tempo real
- ✅ Histórico completo e rastreável
