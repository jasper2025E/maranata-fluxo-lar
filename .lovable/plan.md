
# Plano: Corrigir Discrepância de Usuários + Dashboard de Capacidade

## Problema Identificado
O sistema mostra apenas **3 usuários** nas Configurações, mas existem **9 contas** no auth.users. Isso acontece porque o `UserManagementTab` lista apenas usuários com registro na tabela `profiles`.

## Solução

### 1. Limpar Usuários de Teste Órfãos
Remover as 6 contas de teste que não possuem perfil completo:
- `victor@gmail.com`
- `teste@gmail.com`
- `teste34@gmail.com`
- `teste45@gamil.com` (typo no email)
- `testeqr@gmail.com`
- `teste45@gmail.com`

**SQL de limpeza:**
```sql
-- Deletar roles dos usuários órfãos
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('victor@gmail.com', 'teste@gmail.com', 'teste34@gmail.com', 
                  'teste45@gamil.com', 'testeqr@gmail.com', 'teste45@gmail.com')
);
```

**Usar Edge Function existente** `cleanup-orphan-users` para remover as contas de auth.users.

### 2. (Opcional) Criar Dashboard de Capacidade
Adicionar uma seção nas Configurações → Sistema mostrando:
- Uso atual do banco de dados
- Uso atual do armazenamento
- Contagem de registros principais
- Saúde geral do sistema

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Limpar user_roles dos órfãos |
| Edge Function | Chamar cleanup-orphan-users |
| (Opcional) `SystemTab.tsx` | Adicionar card de capacidade |

## Resultado Esperado
- ✅ Apenas 3 usuários reais no sistema
- ✅ Nenhum dado de teste poluindo o banco
- ✅ Contagem consistente entre auth.users e profiles
