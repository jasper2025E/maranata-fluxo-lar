
# Proteção do Proprietário do Sistema

## Objetivo
Proteger a conta do proprietário do sistema (`victordbvtey@outlook.com`) contra exclusão ou alterações de permissão por qualquer outro usuário, incluindo outros administradores.

---

## Dados do Proprietário

| Campo | Valor |
|-------|-------|
| Email | victordbvtey@outlook.com |
| User ID | 464496d1-ed66-4f03-8f86-38b3f148bf5a |
| Nome | Victor Mendys |

---

## Implementação

### 1. Proteção no Backend (Edge Function)

Atualizar `supabase/functions/admin-manage-users/index.ts` para bloquear operações contra o proprietário:

```typescript
// Definir constante do proprietário do sistema
const SYSTEM_OWNER_EMAIL = "victordbvtey@outlook.com";

// Na ação "delete" - bloquear exclusão do proprietário
if (action === "delete") {
  // Buscar email do usuário alvo
  const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (targetUser?.user?.email === SYSTEM_OWNER_EMAIL) {
    return new Response(
      JSON.stringify({ error: "O proprietário do sistema não pode ser excluído" }),
      { status: 403 }
    );
  }
}

// Na ação "update" - bloquear mudança de role do proprietário
if (action === "update" && role) {
  const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (targetUser?.user?.email === SYSTEM_OWNER_EMAIL) {
    return new Response(
      JSON.stringify({ error: "As permissões do proprietário do sistema não podem ser alteradas" }),
      { status: 403 }
    );
  }
}
```

### 2. Proteção no Frontend

Atualizar `src/components/config/UserManagementTab.tsx` para:

1. Ocultar botão "Excluir" para o proprietário
2. Desabilitar edição de role para o proprietário
3. Mostrar badge especial "Proprietário" 

```typescript
// Constante do proprietário
const SYSTEM_OWNER_EMAIL = "victordbvtey@outlook.com";

// Verificar se é o proprietário
const isSystemOwner = (email: string) => email === SYSTEM_OWNER_EMAIL;

// No render do usuário:
{!isSystemOwner(user.email) && user.id !== currentUser?.id && (
  <AlertDialog>... botão excluir ...</AlertDialog>
)}

// Badge especial para o proprietário
{isSystemOwner(user.email) && (
  <Badge className="bg-amber-500 text-white">
    <Shield className="h-3 w-3 mr-1" />
    Proprietário
  </Badge>
)}
```

---

## Diagrama de Proteção

```text
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN-MANAGE-USERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Ação: DELETE                                               │
│    ├── userId == currentUser? → "Não pode se excluir"       │
│    ├── email == SYSTEM_OWNER? → "Proprietário protegido" ✨ │
│    └── else → Executar exclusão                             │
│                                                             │
│  Ação: UPDATE (com role)                                    │
│    ├── email == SYSTEM_OWNER? → "Não pode alterar role" ✨  │
│    └── else → Executar atualização                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/admin-manage-users/index.ts` | Adicionar verificações de proteção do proprietário |
| `src/components/config/UserManagementTab.tsx` | Ocultar ações de exclusão/edição de role para o proprietário |

---

## Comportamento Final

| Usuário | Pode Excluir Victor? | Pode Alterar Role de Victor? | Pode Editar Nome/Senha de Victor? |
|---------|---------------------|------------------------------|-----------------------------------|
| Outro Admin | Não | Não | Não (protegido) |
| Victor (ele mesmo) | Não | Não | Sim (próprio perfil) |

---

## Segurança

A proteção é implementada em **duas camadas**:

1. **Backend (Edge Function)**: Proteção obrigatória - mesmo que alguém tente burlar o frontend, o backend bloqueará
2. **Frontend (UI)**: Experiência do usuário - oculta botões para evitar confusão

Isso garante que mesmo se alguém manipular requisições diretamente, a conta do proprietário estará protegida.
