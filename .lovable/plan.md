

# Plano: Sincronização Imediata e Obrigatória com ASAAS

## Objetivo
Garantir que **toda fatura criada já nasça 100% sincronizada** com o ASAAS, incluindo PIX QR Code e código de barras do boleto. Se a sincronização falhar, a fatura **não será salva** no banco de dados.

---

## Problemas Identificados

### 1. Criação Permite Falha Silenciosa
Atualmente em `src/hooks/useFaturas.ts`:
- Fatura é criada no banco ANTES de chamar ASAAS
- Se ASAAS falhar, fatura existe mas sem dados de pagamento
- Mostra "toast.warning" mas não reverte

### 2. Geração em Lote Não Sincroniza 100%
Nos fluxos de `src/pages/Alunos.tsx` e `src/hooks/useEnturmacao.ts`:
- Usa `supabase.rpc("gerar_faturas_aluno")` que cria diretamente no banco
- Depois tenta sincronizar só as próximas 3 faturas
- Demais faturas ficam sem ASAAS

### 3. Não Há Bloqueio de Download
Em `src/components/faturas/FaturaTable.tsx` e `src/pages/Faturas.tsx`:
- Permite baixar boleto mesmo se `asaas_pix_qrcode` ou `asaas_boleto_barcode` estiverem vazios

---

## Mudanças Propostas

### 1. Tornar Sincronização ASAAS Obrigatória na Criação

**Arquivo:** `src/hooks/useFaturas.ts`

**Mudança:** Inverter a ordem das operações:
1. Verificar se responsável tem dados válidos para ASAAS
2. Criar cobrança no ASAAS primeiro (com retry e validação)
3. Aguardar confirmação de PIX + Boleto completos
4. SÓ DEPOIS inserir fatura no banco local
5. Se qualquer passo falhar → não salva fatura e mostra erro

```text
ANTES:                           DEPOIS:
┌─────────────────┐              ┌─────────────────┐
│ 1. Insert local │              │ 1. Validar resp │
│ 2. Try ASAAS    │              │ 2. ASAAS create │
│ 3. Se falhar... │              │ 3. PIX + Boleto │
│    warning only │              │ 4. Se OK:       │
└─────────────────┘              │    Insert local │
                                 │ 5. Se FALHAR:   │
                                 │    Não salva!   │
                                 └─────────────────┘
```

---

### 2. Eliminar Geração de Faturas via RPC

**Arquivos:**
- `src/pages/Alunos.tsx`
- `src/hooks/useEnturmacao.ts`

**Mudança:** Substituir `supabase.rpc("gerar_faturas_aluno")` por loop que usa `useCreateFatura` (ou equivalente) para cada mês, garantindo que cada fatura passe pelo fluxo ASAAS.

**Comportamento:**
- Gerar 12 faturas = 12 chamadas ao ASAAS (sequenciais com feedback)
- Se ASAAS falhar em uma, parar e informar quantas foram criadas
- Mostrar progresso: "Criando fatura 5/12... Sincronizando com ASAAS..."

---

### 3. Bloquear Download de Boleto Incompleto

**Arquivos:**
- `src/components/faturas/FaturaTable.tsx`
- `src/pages/Faturas.tsx`
- `src/components/faturas/CarneDialog.tsx`

**Mudança:** Verificar se `asaas_pix_qrcode` E `asaas_boleto_barcode` existem antes de permitir download.

```typescript
const canDownloadBoleto = (fatura: Fatura) => {
  return !!(
    fatura.asaas_payment_id && 
    fatura.asaas_pix_qrcode && 
    fatura.asaas_boleto_barcode
  );
};
```

Se incompleto:
- Botão desabilitado com tooltip "Sincronizando..."
- Tentar sincronizar automaticamente via `asaas-get-payment`
- Após sincronizar, habilitar botão

---

### 4. Aguardar PIX + Boleto Completos na Criação

**Arquivo:** `src/hooks/useFaturas.ts`

**Mudança:** Após criar cobrança no ASAAS, fazer polling até ter QR Code PIX e código de barras:

```typescript
async function waitForPaymentData(faturaId: string, maxAttempts = 5): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await supabase.functions.invoke("asaas-get-payment", {
      body: { faturaId }
    });
    
    if (result.data?.pixQrCode && result.data?.boletoBarcode) {
      return true; // Dados completos!
    }
    
    await new Promise(r => setTimeout(r, 1500 * attempt)); // Backoff
  }
  
  return false; // Timeout
}
```

---

### 5. Feedback Visual Durante Criação

**Arquivo:** `src/components/faturas/CreateFaturaDialog.tsx`

**Mudança:** Adicionar estados de progresso:
- "Validando dados..."
- "Criando cobrança no ASAAS..." (1/12)
- "Aguardando confirmação PIX..."
- "Aguardando código de barras..."
- "Salvando fatura..."
- ✅ "Fatura criada e sincronizada!"

Para faturas recorrentes (12 meses):
- Barra de progresso: "Criando fatura 5 de 12..."
- Se falhar: "Erro na fatura 5. 4 faturas criadas com sucesso."

---

## Fluxo Visual Completo

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CRIAR FATURA (NOVA LÓGICA)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Usuário clica "Criar Fatura"]                                 │
│          │                                                       │
│          ▼                                                       │
│  ┌───────────────────┐                                          │
│  │ 1. Validar Resp.  │ ── Sem responsável? → ❌ Erro            │
│  └─────────┬─────────┘                                          │
│            │                                                     │
│            ▼                                                     │
│  ┌───────────────────┐                                          │
│  │ 2. ASAAS: Criar   │                                          │
│  │    Cobrança       │ ── Timeout/Erro? → ❌ Cancelar           │
│  └─────────┬─────────┘                                          │
│            │                                                     │
│            ▼                                                     │
│  ┌───────────────────┐                                          │
│  │ 3. ASAAS: Buscar  │                                          │
│  │    PIX + Boleto   │ ── Incompleto após 5x? → ❌ Cancelar     │
│  └─────────┬─────────┘                                          │
│            │                                                     │
│            ▼ (PIX ✓ + Boleto ✓)                                 │
│  ┌───────────────────┐                                          │
│  │ 4. INSERT fatura  │                                          │
│  │    no banco local │                                          │
│  └─────────┬─────────┘                                          │
│            │                                                     │
│            ▼                                                     │
│  ┌───────────────────┐                                          │
│  │ ✅ Fatura criada  │                                          │
│  │ e sincronizada!   │                                          │
│  └───────────────────┘                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useFaturas.ts` | Reordenar: ASAAS primeiro, banco depois. Validar PIX+Boleto obrigatórios. |
| `src/components/faturas/CreateFaturaDialog.tsx` | Adicionar feedback de progresso e estados de loading. |
| `src/pages/Alunos.tsx` | Remover RPC direto, usar loop com sync ASAAS para cada fatura. |
| `src/hooks/useEnturmacao.ts` | Remover RPC direto, usar loop controlado. |
| `src/components/faturas/FaturaTable.tsx` | Bloquear botão "Baixar Boleto" se dados incompletos. |
| `src/pages/Faturas.tsx` | Validar antes de gerar PDF/boleto. |
| `src/components/faturas/CarneDialog.tsx` | Bloquear geração de carnê se faturas não têm dados completos. |

---

## Garantias de Segurança

- **Dados nunca serão criados incompletos** - ASAAS precisa confirmar ANTES de salvar
- **Nenhuma configuração será alterada** - API Key, webhooks, tudo permanece igual
- **Nenhum dado existente será apagado** - Apenas novos registros seguem a nova lógica
- **Faturas antigas continuam funcionando** - Lógica de bloqueio só aplica a downloads

---

## Benefícios

| Antes | Depois |
|-------|--------|
| Fatura criada, boleto às vezes não | Fatura só existe se boleto existe |
| Dados incompletos no banco | Dados 100% consistentes |
| Usuário baixa boleto inválido | Boleto só aparece quando pronto |
| Sincronização atrasada/falha | Sincronização imediata e obrigatória |
| Mensagem de "warning" ignorada | Erro claro que impede criação |

