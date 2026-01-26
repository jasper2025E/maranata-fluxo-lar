
# Plano: Migração Stripe para Produção

## Resumo Executivo
Vou configurar o sistema para operar em ambiente **Stripe produção**, atualizando as chaves secretas e públicas para as versões "live". Isso afetará todo o fluxo de pagamentos: cadastro de escolas, gerenciamento de assinaturas, cobrança automática e webhooks.

---

## Regras de Negócio Confirmadas

| Situação | Comportamento |
|----------|---------------|
| Cadastro de nova escola | 14 dias grátis, sem cobrança no cadastro |
| Escola em trial (14 dias) | Sem cobrança até fim do período |
| Após trial | Cobrança no dia configurado (billing_day) |
| Cartão já cadastrado | Cobrança automática (off-session) |

---

## Etapa 1: Atualização de Secrets (Stripe Produção)

Preciso que você forneça as **chaves de produção** do Stripe:

1. **STRIPE_SECRET_KEY** (ou STRIPESECRETAPI)
   - Chave secreta de produção (começa com `sk_live_...`)
   - Usada pelos Edge Functions para operações no backend

2. **VITE_STRIPE_PUBLISHABLE_KEY**
   - Chave publicável de produção (começa com `pk_live_...`)
   - Usada no frontend para inicializar Stripe Elements

3. **STRIPE_WEBHOOK_SECRET** (produção)
   - Webhook signing secret para produção
   - Obtido no Stripe Dashboard → Webhooks → Endpoint → Signing secret

### Secrets Atuais (7 configurados)
- ASAAS_API_KEY ✅
- ASAAS_WEBHOOK_TOKEN ✅
- RESEND_API_KEY ✅
- STRIPESECRETAPI (precisa atualizar para `sk_live`)
- STRIPE_SECRET_KEY (precisa atualizar para `sk_live`)
- STRIPE_WEBHOOK_SECRET (precisa atualizar para produção)
- VITE_STRIPE_PUBLISHABLE_KEY (já foi atualizado para `pk_test` — precisa `pk_live`)

---

## Etapa 2: Arquivos que Usam Stripe (Não Requerem Mudança de Código)

Os Edge Functions já estão preparados para produção, pois usam variáveis de ambiente:

### Edge Functions (Backend)
| Função | Propósito |
|--------|-----------|
| `create-tenant-onboarding` | Cadastro de escolas (SetupIntent sem cobrança) |
| `complete-card-setup` | Finalização da verificação do cartão |
| `stripe-setup-intent` | Criar SetupIntent para salvar cartão |
| `stripe-save-payment-method` | Salvar método de pagamento |
| `stripe-charge-subscription` | Cobrança automática mensal |
| `create-subscription-checkout` | Checkout para upgrade de plano |
| `create-tenant-stripe-subscription` | Criar subscription manual |
| `stripe-webhook` | Processar eventos do Stripe |
| `sync-tenant-subscription` | Sincronizar dados com Stripe |
| `get-stripe-subscriptions` | Consultar subscriptions |

### Frontend (React)
| Arquivo | Propósito |
|---------|-----------|
| `OnboardingCardForm.tsx` | Formulário de cartão no cadastro |
| `PaymentMethodCard.tsx` | Gerenciamento de cartão salvo |
| `Onboarding.tsx` | Fluxo de cadastro de escola |
| `MinhaAssinatura.tsx` | Página de assinatura da escola |
| `UpgradePlanDialog.tsx` | Dialog para mudar de plano |

---

## Etapa 3: Configurar Webhook no Stripe Dashboard

Você precisará configurar um novo endpoint de webhook no painel Stripe **produção**:

### Configuração do Webhook
```text
URL: https://sznckclviajjmmvsgrpp.supabase.co/functions/v1/stripe-webhook

Eventos a ativar:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed
```

Após criar o webhook, copie o **Signing Secret** e me forneça para atualizar `STRIPE_WEBHOOK_SECRET`.

---

## Etapa 4: Limpeza de Dados de Teste

Antes de ir para produção, recomendo limpar os dados de teste:

1. **Tenants de teste**: Escolas cadastradas durante testes
2. **Customers Stripe de teste**: Existem apenas no ambiente test, não serão visíveis em produção
3. **Payment Methods salvos**: Cartões de teste não funcionarão em produção

### Ação Necessária
As escolas cadastradas com cartões de teste precisarão:
- Recadastrar o cartão de crédito (produção)
- Ou serem removidas se forem apenas testes

---

## Etapa 5: Validação Pós-Deploy

Após atualizar as chaves, testarei:

1. **Cadastro de nova escola** → Verificar SetupIntent criado em produção
2. **Salvar cartão real** → Verificar cartão aparece no Stripe Dashboard (produção)
3. **Webhook funcionando** → Verificar eventos chegando corretamente
4. **Cobrança automática** → Simular dia de cobrança

---

## Próximos Passos

Para prosseguir, preciso que você:

1. **Forneça a chave secreta de produção** (`sk_live_...`)
2. **Forneça a chave publicável de produção** (`pk_live_...`)
3. **Configure o webhook no Stripe Dashboard** (produção) e forneça o Signing Secret
4. **Confirme se devo limpar dados de teste** do banco de dados

Após receber essas informações, atualizarei os secrets e farei o deploy das Edge Functions.
