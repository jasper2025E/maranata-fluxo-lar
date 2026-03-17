

## Plano: Fluxo Completo de Aceite LGPD + DPA + Termos Contratuais

### Visão Geral

Criar um sistema nativo de aceite de termos legais que bloqueia o acesso ao sistema até que o usuário aceite todos os documentos obrigatórios. Cada aceite é registrado com dados completos de auditoria (nome, email, CPF/CNPJ, IP, versão do documento, hash SHA-256 do texto).

---

### 1. Banco de Dados (Migration)

**Tabela `legal_documents`** — armazena os documentos e suas versões:
- `id`, `slug` (ex: `lgpd`, `dpa`, `politica-privacidade`, `termos-uso`), `title`, `content` (texto completo em Markdown), `version` (ex: `v1.2`), `effective_date`, `is_active`, `content_hash` (SHA-256 do texto para auditoria), `tenant_id`, `created_at`

**Tabela `user_legal_acceptances`** — registro de cada aceite:
- `id`, `user_id` (ref auth.users), `document_id` (ref legal_documents), `document_version`, `document_hash`, `user_name`, `user_email`, `user_cpf_cnpj`, `ip_address`, `user_agent`, `accepted_at`, `tenant_id`
- Constraint UNIQUE em `(user_id, document_id, document_version)` para evitar duplicatas

**RLS**: Ambas as tabelas isoladas por `tenant_id` via `get_user_tenant_id()`. Leitura para authenticated, insert para authenticated (user_id = auth.uid()).

**Seed**: Inserir os 4 documentos iniciais (LGPD, Política de Privacidade, Termos de Uso, DPA) com textos fixos e versão `v1.0`.

---

### 2. Função RPC para Capturar IP

Criar função `accept_legal_document` (SECURITY DEFINER) que:
- Recebe `document_id`, `document_version`, `document_hash`, `user_name`, `user_cpf_cnpj`
- Captura IP e user_agent dos headers da request
- Insere em `user_legal_acceptances`
- Retorna sucesso/erro

---

### 3. Frontend — Página `/termos`

**Novo arquivo**: `src/pages/TermosAceite.tsx`

Layout profissional com:
- Cards expansíveis para cada documento (LGPD, Política de Privacidade, Termos de Uso, DPA)
- ScrollArea com o texto completo de cada documento
- Checkbox individual obrigatório para cada documento: "Li e concordo com [nome do documento] (versão X)"
- Campo de CPF/CNPJ (input com máscara) — obrigatório para registro de auditoria
- Botão "Aceitar Todos" — habilitado apenas quando todos os checkboxes estão marcados e CPF/CNPJ preenchido
- Botão "Baixar Cópia (PDF)" — gera PDF com dados do aceite usando jspdf (já disponível no projeto)

**Textos incluídos nos documentos:**
- **LGPD**: Direitos do titular, finalidade, base legal, retenção, compartilhamento, controlador/operador
- **DPA**: Responsabilidades como operador, sub-processadores, medidas de segurança, notificação de vazamento em 72h, transferência internacional
- **Política de Privacidade**: Coleta de dados, cookies, armazenamento, direitos ARCO
- **Termos de Uso**: Condições de uso do sistema, responsabilidades, limitação de responsabilidade

---

### 4. Bloqueio de Acesso — ProtectedRoute

Modificar `src/components/ProtectedRoute.tsx` para:
1. Após confirmar user autenticado, verificar se existem documentos ativos sem aceite
2. Query: comparar `legal_documents` ativos vs `user_legal_acceptances` do user
3. Se houver documentos pendentes → `<Navigate to="/termos" />`
4. Se todos aceitos → renderizar children normalmente

Adicionar estado `termsLoading` para evitar flicker.

---

### 5. Rota no App.tsx

- Adicionar rota `/termos` com `TermosAceite` (protegida por auth mas SEM a verificação de termos, para evitar loop)
- Criar variante do ProtectedRoute que não verifica termos (ex: prop `skipTermsCheck`)

---

### 6. Geração de PDF

Usar `jspdf` (já no projeto) para gerar PDF com:
- Cabeçalho com logo da escola
- Dados do aceite: nome completo, email, CPF/CNPJ, data/hora
- Lista de documentos aceitos com versão e hash
- Texto completo de cada documento

---

### Arquivos a criar/modificar

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/TermosAceite.tsx` |
| Criar | `src/hooks/useLegalDocuments.ts` |
| Modificar | `src/components/ProtectedRoute.tsx` (adicionar verificação de termos) |
| Modificar | `src/App.tsx` (adicionar rota `/termos`) |
| Migration | Tabelas `legal_documents` + `user_legal_acceptances` + RPC + seed data |

