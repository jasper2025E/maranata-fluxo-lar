
# Plano: Correções no Sistema de Boleto/Carnê e Reorganização do Botão de Impressão

## Resumo dos Problemas Identificados
1. **QR Code PIX e linha digitável não funcionando** no boleto gerado
2. **Botão "Imprimir Carnê" no lugar errado** (no topo, deveria estar nas ações em lote)
3. **Layout de 1 por folha A4** - precisa ser **3 por folha A4** em todos os casos

---

## Mudanças Propostas

### 1. Corrigir Geração de QR Code PIX e Linha Digitável

**Arquivos afetados:**
- `src/lib/boletoGenerator.ts`
- `src/lib/carneCompactoGenerator.ts`
- `src/lib/carneGenerator.ts`

**Problema:**
- O campo `asaas_pix_qrcode` contém uma imagem base64 (encodedImage da API Asaas)
- O campo `asaas_boleto_barcode` contém a linha digitável (identificationField)
- Esses campos estão sendo usados corretamente, mas a verificação de dados está falhando ou os dados não estão sincronizados

**Solução:**
- Garantir que o gerador de boleto leia corretamente os campos `asaas_pix_qrcode` e `asaas_boleto_barcode` da fatura
- Adicionar validação antes de gerar: se faltar PIX ou boleto, forçar sincronização com o gateway
- Atualizar a lógica de renderização do QR Code para tratar o formato base64 corretamente

---

### 2. Mover "Imprimir Carnê" para Ações em Lote

**Arquivo afetado:**
- `src/pages/Faturas.tsx`
- `src/components/faturas/BulkActionsBar.tsx`

**Mudanças:**
- **Remover** o dropdown "Imprimir Carnê" do header da página Faturas (linhas 414-453)
- **Manter** a funcionalidade "Gerar Carnê" que já existe no `BulkActionsBar` (linha 737)
- O botão só aparecerá quando houver faturas selecionadas (comportamento padrão das ações em lote)

---

### 3. Alterar Layout para 3 Carnês por Folha A4

**Arquivo afetado:**
- `src/lib/boletoGenerator.ts` (criar nova função para boleto compacto)
- `src/lib/carneCompactoGenerator.ts` (já está com 3 por página - apenas validar)
- `src/pages/Faturas.tsx` (usar gerador compacto para "Baixar Boleto")
- `src/components/faturas/BulkActionsBar.tsx` (garantir uso do compacto)
- `src/components/faturas/FaturaTable.tsx` (atualizar ação "Baixar Boleto")

**Mudanças:**
- Criar nova função `generateBoletoCompacto` que usa o mesmo layout do carnê (3 por A4)
- Atualizar `handleDownloadBoleto` em `Faturas.tsx` para usar o layout compacto
- Manter consistência visual: todos os documentos de cobrança terão 3 por página A4

---

### 4. Sincronizar Dados Antes de Gerar

**Arquivos afetados:**
- `src/pages/Faturas.tsx`
- `src/components/faturas/BulkActionsBar.tsx`

**Mudanças:**
- Antes de gerar qualquer boleto/carnê, verificar se `asaas_pix_qrcode` e `asaas_boleto_barcode` existem
- Se não existirem, chamar `syncFaturaAsaasData()` ou o novo `useGatewaySync().syncFatura()` antes de prosseguir
- Mostrar feedback ao usuário: "Sincronizando dados de pagamento..."

---

## Arquivos a Serem Modificados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Faturas.tsx` | Modificar | Remover dropdown "Imprimir Carnê" do header; atualizar `handleDownloadBoleto` para usar layout compacto e sincronizar dados antes |
| `src/lib/boletoGenerator.ts` | Modificar | Criar função `generateBoletoCompacto` para layout 3 por A4; corrigir renderização do QR Code PIX |
| `src/lib/carneCompactoGenerator.ts` | Modificar | Garantir que PIX e linha digitável sejam renderizados corretamente |
| `src/components/faturas/BulkActionsBar.tsx` | Modificar | Adicionar sincronização de dados antes de gerar carnê; garantir uso do gerador compacto |
| `src/components/faturas/FaturaTable.tsx` | Verificar | Garantir que "Baixar Boleto" chame a função correta |

---

## Detalhes Técnicos

### Estrutura do Boleto Compacto (3 por A4)

```text
┌─────────────────────────────────────────────────────────┐
│  BOLETO 1 (altura: ~99mm)                               │
│  ┌──────────────┬────────────────────────┬─────────────┐ │
│  │ Recibo       │ Dados principais       │ Canhoto     │ │
│  │ do Pagador   │ + QR Code PIX          │             │ │
│  │              │ + Linha Digitável      │             │ │
│  └──────────────┴────────────────────────┴─────────────┘ │
├─────────────────────────────────────────────────────────┤
│  BOLETO 2 (altura: ~99mm)                               │
│  ... mesmo layout ...                                   │
├─────────────────────────────────────────────────────────┤
│  BOLETO 3 (altura: ~99mm)                               │
│  ... mesmo layout ...                                   │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Sincronização Atualizado

```text
Usuário clica "Gerar Carnê" ou "Baixar Boleto"
              │
              ▼
┌─────────────────────────────────┐
│ Verificar dados completos:      │
│ - asaas_pix_qrcode              │
│ - asaas_boleto_barcode          │
└───────────────┬─────────────────┘
                │
        ┌───────┴───────┐
        │ Dados faltando?│
        └───────┬───────┘
                │
         Sim ──►│◄── Não
                │        │
                ▼        │
     ┌──────────────────┐│
     │ Sincronizar com  ││
     │ gateway-sync     ││
     │ (com retry)      ││
     └────────┬─────────┘│
              │          │
              ▼          ▼
        ┌─────────────────────┐
        │ Gerar PDF com dados │
        │ completos           │
        └─────────────────────┘
```

---

## Validações de Segurança

- **Nenhuma chave API será alterada** - apenas lógica de apresentação
- **Dados existentes preservados** - apenas melhoria na renderização
- **Retrocompatibilidade** - faturas sem dados Asaas continuam funcionando (mostram placeholder)

---

## Resultado Esperado

1. **QR Code PIX funcional** - escaneável em apps bancários
2. **Linha digitável correta** - copiável para pagamento
3. **Layout otimizado** - 3 boletos/carnês por folha A4 (economia de papel)
4. **UX simplificada** - "Imprimir Carnê" disponível apenas em ações em lote
5. **Sincronização automática** - dados sempre atualizados antes de gerar documentos
