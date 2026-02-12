# Correcao: Juros, Display e Data de Vencimento nas Faturas

## Problemas Identificados

### 1. Data de vencimento exibida errada (causa da fatura "Emitida" que deveria ser "Vencida")

A fatura **FAT-2026-000199** tem vencimento **12/02/2026** no banco de dados, mas aparece como **11/02/26** na tela. Isso acontece porque o JavaScript interpreta datas no formato "YYYY-MM-DD" como meia-noite UTC, e no fuso horario do Brasil (UTC-3) isso vira o dia anterior (11/02 as 21h).

Por isso a fatura parece vencer dia 11 mas o sistema considera dia 12 (hoje) -- logo nao esta vencida ainda.

**Correcao**: Usar `parseISO` do date-fns em vez de `new Date()` para interpretar datas corretamente.

### 2. Juros com valor "riscado" (confuso)

O sistema mostra o valor COM juros como valor principal e o valor SEM juros riscado abaixo. Isso gera confusao porque parece um desconto (valor menor riscado). Alem disso, a query da listagem nao busca os campos `valor_juros_aplicado` e `valor_multa_aplicado`, impedindo que a tabela mostre o detalhamento dos encargos.

**Correcao**:

- Adicionar campos de juros/multa na query da listagem
- Quando houver juros/multa, mostrar o valor original riscado e o valor FINAL (com encargos) em destaque, com indicacao clara de "+ juros"
- Nao usar estilo riscado para o valor com encargos

### 3. Detalhes da fatura nao mostram juros

Ao abrir o detalhe da fatura, aparece apenas "Valor Total" sem discriminar valor base, juros e multa. O usuario nao consegue entender a composicao do valor.

**Correcao**: Adicionar linhas de detalhamento no resumo da fatura mostrando: Valor Base, Juros (se houver), Multa (se houver), e Total Final.

## Alteracoes Tecnicas

### Arquivo 1: `src/hooks/useFaturas.ts`

- Adicionar campos `valor_juros_aplicado`, `valor_multa_aplicado`, `juros`, `multa`, `dias_atraso`, `valor_original`, `juros_percentual_diario`, `juros_percentual_mensal` na string `selectFields` da query `useFaturas()`

### Arquivo 2: `src/components/faturas/FaturaTable.tsx`

- Importar `parseISO` do date-fns para corrigir exibicao de datas
- Alterar exibicao do valor na coluna: quando houver juros/multa, mostrar valor original riscado e valor final em destaque com indicador "+ juros"
- Corrigir `format(new Date(fatura.data_vencimento))` para `format(parseISO(fatura.data_vencimento))`
- Corrigir `getStatusConfig` para usar `parseISO` tambem

### Arquivo 3: `src/components/faturas/FaturaDetails.tsx`

- Importar `parseISO` do date-fns
- Adicionar bloco de detalhamento financeiro no resumo: Valor Base, Desconto, Juros, Multa, Dias Atraso, Total Final
- Corrigir exibicao de datas para usar `parseISO`

## Impacto

- **Risco**: Zero. Nenhum dado sera alterado. Apenas correcoes de exibicao
- **Dados existentes**: Os juros ja estao calculados corretamente no banco (ex: R$0,05 para 1 dia de atraso a 0,033%/dia). A correcao e apenas visual
- **Nota sobre taxas**: A taxa atual configurada e 0,033% ao dia (1% ao mes). Se desejar juros maiores ou adicionar multa, isso pode ser ajustado nas configuracoes de cobranca

## Resumo


| Mudanca                                                                                                        | Arquivo                                    | Tipo                        |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------- |
| Adicionar campos de juros na query                                                                             | `src/hooks/useFaturas.ts`                  | Query                       |
| Corrigir timezone nas datas e display de juros                                                                 | `src/components/faturas/FaturaTable.tsx`   | Visual                      |
| Adicionar detalhamento de juros/multanão esqueça de verificar se existe mais faturas com o mesmo erro &nbsp; | `src/components/faturas/FaturaDetails.tsx` | Visual&nbsp;&nbsp;&nbsp; |
