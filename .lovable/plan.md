
# Transformação: SaaS Multi-Tenant → Single-Tenant Escola Maranata

## Visão Geral

Converter o sistema de uma plataforma SaaS que gerencia múltiplas escolas para um sistema dedicado exclusivamente à **Escola Maranata**, mantendo toda a estrutura visual, funcionalidades de gestão escolar e o fluxo atual de navegação.

---

## O Que Será Removido

### 1. Módulo GESTOR (Platform Admin)
**24 páginas e componentes a serem removidos:**

| Pasta/Arquivo | Descrição |
|---------------|-----------|
| `src/pages/platform/` (todos os 24 arquivos) | PlatformDashboard, TenantsList, PlatformAnalytics, etc. |
| `src/components/platform/` (toda a pasta) | PlatformLayout, analytics, dashboard, security, settings |
| `src/hooks/usePlatformAnalytics.ts` | Analytics multi-tenant |
| `src/hooks/usePlatformBranding.ts` | Branding dinâmico SaaS |
| `src/hooks/usePlatformManagers.ts` | Gestores do sistema |
| `src/hooks/usePlatformSettings.ts` | Configurações da plataforma |
| `src/hooks/useTenant.ts` | Hook de tenant (será simplificado) |
| `src/hooks/useSubscriptionPlans.ts` | Planos de assinatura |
| `src/hooks/usePremiumFeatures.ts` | Gating de funcionalidades |
| `src/components/premium/` | PremiumGate e restrições |

### 2. Funcionalidades Multi-Tenant
- Sistema de `tenant_id` (mantido no banco, mas sem lógica de separação)
- Lógica de isolamento de dados
- Seleção de escola/tenant
- Assinaturas e planos (a escola será "ativa" por padrão)

### 3. Páginas Públicas SaaS
| Página | Ação |
|--------|------|
| `/cadastro` (Onboarding) | Remover - não haverá cadastro de novas escolas |
| `/inscricao` (LandingPage) | Remover |
| `/escola/:slug` (EscolaPublica) | Remover (site público de cada tenant) |

### 4. Edge Functions Multi-Tenant
| Função | Ação |
|--------|------|
| `create-tenant-onboarding` | Remover |
| `delete-tenant` | Remover |
| `impersonate-user` | Remover |
| `sync-tenant-subscription` | Remover |
| `test-tenant-isolation` | Remover |
| `create-subscription-checkout` | Remover |
| `create-tenant-stripe-subscription` | Remover |
| `process-expired-subscriptions` | Remover |
| `check-expiring-subscriptions` | Remover |
| `stripe-charge-subscription` | Remover |
| `get-stripe-subscriptions` | Remover |

---

## O Que Será Mantido

### 1. Fluxo de Navegação
```text
/ (Página Inicial) → /auth (Login) → /dashboard (Painel da Escola)
```

### 2. Módulos da Escola (100% preservados)
- Dashboard Financeiro
- Alunos e Responsáveis
- Cursos e Turmas
- Faturas, Pagamentos, Despesas
- Relatórios
- RH e Ponto Eletrônico
- Contabilidade e Saúde Financeira
- Site Escolar
- Configurações

### 3. Layout e Design
- Paleta de cores Luz Mina
- Sidebar da escola (AppSidebar)
- Cards, gráficos e KPIs
- Versículo bíblico no dashboard
- Design glassmorphism no login

### 4. Edge Functions Essenciais
- `asaas-*` (pagamentos)
- `gateway-config` (configuração de gateways)
- `send-receipt-email` (recibos)
- `register-prematricula` (pré-matrícula)
- `admin-manage-users` (usuários da escola)

---

## Transformações Necessárias

### 1. Página Inicial (/)

**Antes:** Página institucional SaaS com preços, multi-tenant, cadastro
**Depois:** Página de apresentação da Escola Maranata

**Alterações:**
- `Institucional.tsx`: Adaptar para apresentar a Escola Maranata
- `InstitucionalHero.tsx`: "Escola Maranata - Sistema de Gestão"
- `InstitucionalNavbar.tsx`: Links simplificados (Sobre, Contato, Entrar)
- Remover: `InstitucionalMultitenant.tsx`, `InstitucionalPrecos.tsx`
- Adaptar: `InstitucionalBeneficios.tsx`, `InstitucionalModulos.tsx`

### 2. AuthContext Simplificado

**Antes:** Verificação de `platform_admin` e redirecionamento por role
**Depois:** Apenas roles de escola (admin, financeiro, secretaria, staff)

```typescript
// Remover
isPlatformAdmin(): boolean

// Simplificar hasRole
hasRole(role): boolean {
  return role === currentRole || currentRole === 'admin';
}
```

### 3. ProtectedRoute Simplificado

**Antes:** Lógica complexa de tenant, subscription status, platform admin
**Depois:** Apenas verificação de autenticação e role básico

### 4. Sidebar (AppSidebar)

**Antes:** Verificações de `isPlatformAdmin()` e features premium
**Depois:** Mostrar todos os módulos sem restrições

- Remover ícones de Crown (premium)
- Remover verificações de plano
- Simplificar estrutura

### 5. Hooks de Dados

**useEscola.ts:**
- Remover lógica de tenant_id
- Buscar dados da escola única (primeiro registro)

**useAlunos, useFaturas, etc.:**
- Manter funcionando (RLS continuará funcionando)

---

## Estrutura de Arquivos Final

```text
src/
├── pages/
│   ├── Index.tsx (ou Institucional.tsx simplificado)
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Alunos.tsx
│   ├── Responsaveis.tsx
│   ├── Cursos.tsx
│   ├── Turmas.tsx
│   ├── Faturas.tsx
│   ├── Pagamentos.tsx
│   ├── Despesas.tsx
│   ├── Relatorios.tsx
│   ├── RH.tsx
│   ├── Contabilidade.tsx
│   ├── SaudeFinanceira.tsx
│   ├── SiteEscolar.tsx
│   ├── Configuracoes.tsx
│   └── Escola.tsx
│
├── components/
│   ├── institucional/ (simplificado para Maranata)
│   ├── dashboard/
│   ├── faturas/
│   ├── rh/
│   ├── website/
│   ├── config/
│   ├── ui/
│   ├── AppSidebar.tsx
│   ├── DashboardLayout.tsx
│   └── ProtectedRoute.tsx (simplificado)
│
├── hooks/
│   ├── useAlunos.ts
│   ├── useFaturas.ts
│   ├── useEscola.ts (simplificado)
│   ├── useRH.ts
│   └── ... (hooks de domínio)
│
└── contexts/
    └── AuthContext.tsx (simplificado)
```

---

## App.tsx Final (Rotas)

```typescript
<Routes>
  {/* Público */}
  <Route path="/" element={<Institucional />} />
  <Route path="/auth" element={<Auth />} />
  
  {/* Protegido - Escola */}
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/responsaveis" element={<ProtectedRoute><Responsaveis /></ProtectedRoute>} />
  <Route path="/alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
  <Route path="/cursos" element={<ProtectedRoute><Cursos /></ProtectedRoute>} />
  <Route path="/turmas" element={<ProtectedRoute><Turmas /></ProtectedRoute>} />
  <Route path="/escola" element={<ProtectedRoute><Escola /></ProtectedRoute>} />
  <Route path="/faturas" element={<ProtectedRoute><Faturas /></ProtectedRoute>} />
  <Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />
  <Route path="/despesas" element={<ProtectedRoute><Despesas /></ProtectedRoute>} />
  <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
  <Route path="/rh" element={<ProtectedRoute><RH /></ProtectedRoute>} />
  <Route path="/contabilidade" element={<ProtectedRoute><Contabilidade /></ProtectedRoute>} />
  <Route path="/saude-financeira" element={<ProtectedRoute><SaudeFinanceira /></ProtectedRoute>} />
  <Route path="/site-escolar" element={<ProtectedRoute><SiteEscolar /></ProtectedRoute>} />
  <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
  
  {/* Público funcional */}
  <Route path="/pagamento/resultado" element={<PaymentResult />} />
  <Route path="/ponto/:token" element={<PontoEletronico />} />
  
  {/* Catch-all */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Banco de Dados

### Tabelas a Manter (sem alteração)
- `alunos`, `responsaveis`, `cursos`, `turmas`
- `faturas`, `pagamentos`, `despesas`
- `funcionarios`, `cargos`, `folha_pagamento`
- `escola`, `profiles`, `user_roles`
- `school_website_*`
- E todas as outras tabelas de domínio

### Tabelas a Remover/Ignorar
- `tenants` → Não será mais usada ativamente
- `platform_*` → Comunicados, roadmap, changelog do Gestor
- `system_managers` → Gestores do sistema
- `subscription_plans` → Planos de assinatura
- `tenant_payment_methods` → Métodos de pagamento do tenant
- `subscription_history` → Histórico de assinaturas

**Nota:** As tabelas não serão deletadas do banco por segurança - apenas o código que as utiliza será removido.

---

## Ordem de Execução

### Fase 1: Limpeza de Rotas e Imports
1. Atualizar `App.tsx` - remover todas as rotas `/platform/*` e imports
2. Remover imports de páginas platform

### Fase 2: Simplificar Auth
3. Atualizar `AuthContext.tsx` - remover `isPlatformAdmin`
4. Simplificar `ProtectedRoute.tsx` - remover lógica de tenant/subscription

### Fase 3: Deletar Arquivos Platform
5. Deletar pasta `src/pages/platform/`
6. Deletar pasta `src/components/platform/`
7. Deletar hooks não utilizados (platform*)

### Fase 4: Atualizar Sidebar
8. Simplificar `AppSidebar.tsx` - remover verificações premium

### Fase 5: Transformar Página Inicial
9. Atualizar componentes `institucional/` para Escola Maranata
10. Remover seções SaaS (preços, multi-tenant)

### Fase 6: Simplificar Hooks
11. Atualizar `useEscola.ts` - busca direta
12. Remover hooks de platform e subscription

### Fase 7: Limpeza de Edge Functions
13. Deletar edge functions de tenant/subscription

### Fase 8: Ajustes Finais
14. Atualizar textos e labels
15. Testar fluxo completo

---

## Resultado Final

Um sistema completo de gestão escolar para a **Escola Maranata** com:

- Página de apresentação moderna (usando o mesmo layout atual)
- Login profissional com glassmorphism
- Dashboard financeiro completo
- Gestão de alunos, turmas e cursos
- Sistema de cobrança (boleto, PIX, cartão)
- RH e folha de pagamento
- Contabilidade e relatórios
- Site escolar personalizado
- Sem restrições de planos ou funcionalidades premium
- Sem conceitos de multi-tenant ou SaaS

