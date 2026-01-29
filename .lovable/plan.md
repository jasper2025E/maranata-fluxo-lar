
# Plano: Bloquear Pagamentos em Faturas Parciais e Redirecionar para Derivada

## Objetivo
Quando uma fatura tem status "Parcial" (já recebeu pagamento e gerou uma fatura derivada), bloquear novos pagamentos nela e mostrar claramente:
- Quanto foi pago
- Link direto para a fatura derivada (onde está o saldo restante)

## Problema Atual
Atualmente, faturas com status "Parcial" ainda exibem o botão "Registrar Pagamento" na aba Pagamentos, mesmo que o saldo já tenha sido transferido para uma fatura derivada. Isso pode confundir o usuário e causar duplicidade.

## Solução

### 1. Modificar `PagamentosTab` em `FaturaDetails.tsx`

Adicionar verificação para faturas com status "Parcial":
- Se a fatura tem status "Parcial" E possui fatura derivada com saldo aberto
- Esconder formulário de pagamento
- Mostrar card informativo com:
  - Resumo do que foi pago na fatura original
  - Mensagem clara: "O saldo restante foi transferido para a fatura derivada"
  - Link/botão para abrir a fatura derivada diretamente

### 2. Ajustar a lógica de `isEditable` no FaturaDetails

- Faturas com status "Parcial" devem ser tratadas como "fechadas para novos pagamentos"
- Manter histórico de pagamentos visível (apenas leitura)

### 3. Melhorar Card de Resumo

No card de resumo do `PagamentosTab`:
- Mostrar claramente: "Pago nesta fatura" vs "Transferido para derivada"

## Detalhes Técnicos

### Arquivo: `src/components/faturas/FaturaDetails.tsx`

**Mudanças no `PagamentosTab`:**

```typescript
// Adicionar prop para receber relacionadas
function PagamentosTab({ 
  faturaId, 
  valorTotal, 
  faturaStatus,        // NOVO
  relacionadas,        // NOVO - { origem, derivadas }
  onDownloadRecibo 
}: { ... }) {
  
  // Verificar se é fatura parcial com derivada
  const isParcialComDerivada = faturaStatus?.toLowerCase() === 'parcial' && 
    relacionadas?.derivadas && relacionadas.derivadas.length > 0;
  
  // Se é parcial com derivada, mostrar card informativo ao invés de form
  if (isParcialComDerivada) {
    return (
      <div className="space-y-4">
        {/* Card de resumo existente */}
        
        {/* NOVO: Card informativo */}
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-warning mb-2" />
            <p className="font-medium">Pagamento parcial registrado</p>
            <p className="text-sm text-muted-foreground">
              O saldo restante foi transferido para uma nova fatura.
            </p>
            
            {/* Link para derivada */}
            <Button variant="outline" className="mt-3 gap-2">
              <ArrowRight className="h-4 w-4" />
              Ver fatura {derivada.codigo_sequencial}
            </Button>
          </CardContent>
        </Card>
        
        {/* Lista de pagamentos (somente leitura) */}
      </div>
    );
  }
}
```

**Mudanças na chamada do `PagamentosTab`:**

```typescript
<TabsContent value="pagamentos" className="mt-4">
  <PagamentosTab 
    faturaId={fatura.id} 
    valorTotal={valorFinal} 
    faturaStatus={fatura.status}      // NOVO
    relacionadas={relacionadas}        // NOVO
    onDownloadRecibo={handleDownloadRecibo} 
  />
</TabsContent>
```

## Fluxo do Usuário

1. Usuário abre fatura com status "Parcial"
2. Na aba "Pagamentos":
   - Vê o histórico de pagamentos feitos
   - Vê card informativo: "Saldo transferido para FAT-2026-000013"
   - Clica no botão para ir direto à fatura derivada
3. Na fatura derivada:
   - Pode registrar o pagamento do saldo restante normalmente

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/components/faturas/FaturaDetails.tsx` | Modificar `PagamentosTab` para detectar status "Parcial" e bloquear novos pagamentos, mostrando link para derivada |

## Resultado Esperado

- Fatura original (status "Parcial"): mostra histórico + link para derivada
- Fatura derivada (status "Aberta"): permite registrar pagamento do saldo
- Zero confusão para o usuário sobre onde pagar
