
# Plano: Corrigir Exibição da Logo na Tela de Login

## Resumo
A logo da escola não aparece na tela de login porque a view de branding está configurada para respeitar o RLS da tabela base, que exige autenticação. A solução é usar uma função de banco de dados já existente e auditada que permite acesso público seguro.

## Por que a logo não aparece?
A view `escola_public_branding` foi configurada com `security_invoker=on` por questões de segurança. Isso faz ela herdar as regras de acesso da tabela `escola`, que exige login. Como resultado, visitantes anônimos na tela de login recebem um resultado vazio.

## Solução Proposta
Usar a função `get_escola_public_info()` que já existe no sistema e foi criada especificamente para este caso de uso. Esta função:

- É do tipo SECURITY DEFINER (executa com privilégios elevados de forma controlada)
- Retorna APENAS nome e logo da escola
- Não expõe dados sensíveis como CNPJ, contatos ou configurações financeiras

## Alterações Necessárias

### 1. Atualizar a página de login (Auth.tsx)

Modificar a query de branding para usar a função RPC em vez da view:

**Antes:**
```typescript
const { data } = await supabase
  .from("escola_public_branding")
  .select("nome, logo_url")
  .maybeSingle();
```

**Depois:**
```typescript
const { data } = await supabase
  .rpc("get_escola_public_info")
  .maybeSingle();
```

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Trocar chamada da view pela função RPC |

## Segurança

Esta solução é segura porque:

1. A função `get_escola_public_info` já existe e foi auditada
2. Retorna apenas dados públicos (nome, logo)
3. Não expõe tenant_id, CNPJ, telefones ou informações financeiras
4. É a abordagem recomendada para acesso público controlado

## Resultado Esperado
Após a implementação, a logo e nome da escola aparecerão corretamente na tela de login para todos os visitantes, mantendo a segurança do sistema.
