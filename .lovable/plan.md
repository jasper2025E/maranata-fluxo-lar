
# Plano: Corrigir Geração de Boletos com QR Code e Desvinculação da Matrícula

## Problema Identificado

1. **QR Code/Código de Barras sumindo**: Ao gerar uma cobrança Asaas, o sistema chama a API corretamente, mas há cenários onde os dados de PIX/Boleto não são salvos ou exibidos no carnê gerado.

2. **Faturamento automático na matrícula**: Atualmente, ao cadastrar ou enturmar um aluno, o sistema gera faturas automaticamente usando a mensalidade do curso. Você quer poder criar faturas manualmente depois, com valores personalizados.

3. **Famílias com múltiplos alunos**: Quer gerar faturas separadas por aluno com possibilidade de aplicar descontos (ex: segundo filho com 50% off).

---

## Mudanças Propostas

### 1. Desabilitar Geração Automática de Faturas na Matrícula

**Arquivos afetados:**
- `src/pages/Alunos.tsx` - Remover a lógica de `gerar_faturas_aluno` no `createMutation.onSuccess`
- `src/hooks/useEnturmacao.ts` - Alterar o padrão `gerarFaturas = false`

**O que será feito:**
- Remover a chamada automática para gerar faturas quando um aluno é criado
- Alterar o hook `useEnturmar` para NÃO gerar faturas por padrão
- Manter os campos de configuração (dia_vencimento, quantidade_parcelas) no cadastro do aluno para uso futuro quando você decidir gerar faturas manualmente

**Resultado:** Ao cadastrar/enturmar aluno, apenas os dados são salvos. Você vai em Faturas → Nova Fatura e cria manualmente com o valor desejado.

---

### 2. Garantir QR Code PIX + Código de Barras do Boleto

**Arquivos afetados:**
- `supabase/functions/asaas-create-payment/index.ts` - Ajustar para sempre buscar ambos (PIX + Boleto)
- `src/lib/carneCompactoGenerator.ts` - Verificar se exibe corretamente quando há dados
- `src/components/faturas/CarneDialog.tsx` - Forçar atualização dos dados antes de gerar o PDF

**O que será feito:**

a) **Edge Function `asaas-create-payment`:**
   - Forçar `billingType: "UNDEFINED"` para que o Asaas gere tanto PIX quanto Boleto
   - Adicionar logs para debug se a API não retornar QR Code
   - Garantir que os campos `asaas_pix_qrcode`, `asaas_pix_payload`, `asaas_boleto_barcode`, `asaas_boleto_url` sejam salvos

b) **Geração do Carnê:**
   - Antes de gerar o PDF, chamar `asaas-get-payment` para garantir dados atualizados
   - Se não houver QR Code/barcode, exibir aviso ao usuário

c) **Fallback de segurança:**
   - Se a fatura não tiver dados Asaas, tentar buscar novamente via API antes de imprimir

---

### 3. Fluxo de Trabalho Simplificado Proposto

```
1. Cadastrar Aluno → Apenas salva dados, NÃO gera faturas
2. (Opcional) Enturmar Aluno → Apenas vincula à turma, NÃO gera faturas
3. Ir em Faturas → Nova Fatura:
   - Selecionar aluno
   - Definir valor desejado (pode ser R$ 0 para um irmão)
   - Sistema gera automaticamente a cobrança Asaas com PIX + Boleto
4. Imprimir Carnê → Sempre terá QR Code + linha digitável
```

---

## Detalhes Técnicos

### Alterações no `src/pages/Alunos.tsx`:

```typescript
// ANTES (onSuccess do createMutation):
void (async () => {
  await supabase.rpc("gerar_faturas_aluno", { ... });
  // Criar cobranças Asaas...
})();

// DEPOIS:
// Remover todo esse bloco - apenas salvar o aluno, sem gerar faturas
```

### Alterações no `src/hooks/useEnturmacao.ts`:

```typescript
// ANTES:
gerarFaturas = true

// DEPOIS:
gerarFaturas = false
```

### Alterações no `supabase/functions/asaas-create-payment/index.ts`:

```typescript
// Garantir que sempre busca PIX + Boleto
if (pixResponse.ok) {
  const pixData = await pixResponse.json();
  pixQrCode = pixData.encodedImage;
  pixPayload = pixData.payload;
  console.log("PIX QR Code obtido:", !!pixQrCode); // Log para debug
} else {
  console.error("Falha ao obter PIX QR Code:", await pixResponse.text());
}

// Mesmo tratamento para boleto
if (boletoResponse.ok) {
  const boletoData = await boletoResponse.json();
  boletoBarcode = boletoData.identificationField;
  console.log("Boleto barcode obtido:", !!boletoBarcode);
} else {
  console.error("Falha ao obter barcode do boleto:", await boletoResponse.text());
}
```

### Alterações no `src/components/faturas/CarneDialog.tsx`:

```typescript
// Antes de gerar o PDF, garantir dados atualizados
const handleGenerateCarne = async () => {
  // ... código existente ...
  
  // ADICIONAR: Para faturas que têm asaas_payment_id mas não têm QR/barcode,
  // buscar dados atualizados via edge function
  for (const fatura of faturasParaImprimir) {
    if (fatura.asaas_payment_id && (!fatura.asaas_pix_qrcode || !fatura.asaas_boleto_barcode)) {
      await supabase.functions.invoke("asaas-get-payment", {
        body: { faturaId: fatura.id }
      });
    }
  }
  
  // Buscar dados atualizados novamente
  await refetchFaturas();
  // ... continuar com geração do PDF ...
}
```

---

## Benefícios

1. **Controle total sobre valores**: Você define o valor de cada fatura manualmente
2. **Flexibilidade para famílias**: Pode criar fatura de R$ 0 para um aluno e valor cheio para outro
3. **Boletos sempre completos**: PIX + código de barras garantidos
4. **Fluxo simplificado**: Cadastro rápido, faturamento quando você quiser

---

## Ordem de Implementação

1. Desativar geração automática na matrícula/enturmação
2. Melhorar logs e tratamento de erros na Edge Function
3. Adicionar verificação de dados Asaas antes de gerar carnê
4. Testar fluxo completo: cadastrar → criar fatura manual → gerar carnê
