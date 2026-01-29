
# Portal Público da Escola - Site Institucional + Autoatendimento

## Visão Geral

Transformar o módulo "Site Escolar" em um **portal público completo** que serve como:
1. **Landing Page Institucional** - Vitrine profissional da escola
2. **Portal de Autoatendimento** - Consulta de boletos por CPF sem login
3. **Sistema de Matrícula Online** - Cadastro de novos alunos

## Arquitetura Proposta

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ROTAS PÚBLICAS (sem login)                   │
├─────────────────────────────────────────────────────────────────┤
│  /escola/:slug              → Landing Page Institucional        │
│  /escola/:slug/portal       → Portal do Responsável (CPF)       │
│  /escola/:slug/matricula    → Formulário de Matrícula Online    │
└─────────────────────────────────────────────────────────────────┘
```

## Funcionalidades por Módulo

### 1. Landing Page Institucional (`/escola/:slug`)

**Página pública renderizada dinamicamente** com os blocos configurados pelo admin:

| Seção | Descrição |
|-------|-----------|
| **Hero** | Banner principal com CTAs para matrícula |
| **Sobre** | História, missão, valores da escola |
| **Diferenciais** | Cards com ícones destacando benefícios |
| **Galeria** | Fotos da estrutura e eventos |
| **Equipe** | Apresentação dos professores |
| **Depoimentos** | Testimonials de pais e alunos |
| **FAQ** | Perguntas frequentes |
| **Estatísticas** | Números de alunos, anos de experiência, aprovação |
| **Contato** | Telefone, WhatsApp, mapa, endereço |
| **CTA Final** | Chamada para matrícula |

**Navegação fixa** com links:
- Início | Sobre | Estrutura | Depoimentos | Contato | **Área do Responsável** | **Matricule-se**

### 2. Portal do Responsável (`/escola/:slug/portal`)

**Consulta de boletos por CPF** - sem necessidade de login:

```text
┌─────────────────────────────────────────────────────────────────┐
│                  🔍 CONSULTA DE BOLETOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Digite seu CPF para consultar suas faturas:                   │
│   ┌─────────────────────────────────────────┐                   │
│   │ 000.000.000-00                          │                   │
│   └─────────────────────────────────────────┘                   │
│                                                                 │
│   [ Consultar Boletos ]                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (após busca)
┌─────────────────────────────────────────────────────────────────┐
│  👤 Olá, Maria Silva!                                           │
│  📧 maria@email.com  |  📱 (11) 99999-9999                      │
├─────────────────────────────────────────────────────────────────┤
│  Alunos Vinculados:                                             │
│  • João Silva - Reforço Escolar (Fundamental II)                │
│  • Ana Silva - Educação Infantil                                │
├─────────────────────────────────────────────────────────────────┤
│  📋 SUAS FATURAS                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔴 VENCIDA  Jan/2025  R$ 180,00  Venc: 10/01/2025         │  │
│  │ [ Ver Boleto ]  [ Copiar PIX ]  [ Abrir Link ]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟡 ABERTA   Fev/2025  R$ 180,00  Venc: 10/02/2025         │  │
│  │ [ Ver Boleto ]  [ Copiar PIX ]  [ Abrir Link ]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🟢 PAGA     Dez/2024  R$ 180,00  Pago em: 08/12/2024      │  │
│  │ [ Ver Comprovante ]                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Funcionalidades do Portal:**
- Busca por CPF (validado e formatado)
- Exibe informações do responsável
- Lista todos os alunos vinculados
- Lista todas as faturas (abertas, vencidas, pagas)
- Para cada fatura pendente:
  - Botão "Copiar PIX" (copia o código copia-e-cola)
  - Botão "Ver Boleto" (abre PDF ou link Asaas)
  - Botão "Abrir Link" (abre página de pagamento Asaas)
- Para faturas pagas:
  - Botão "Ver Comprovante"

### 3. Matrícula Online (`/escola/:slug/matricula`)

**Formulário completo multi-step:**

```text
PASSO 1/3 - Dados do Responsável
┌─────────────────────────────────────────────────────────────────┐
│  Nome Completo*     [ João Silva                              ] │
│  CPF*               [ 000.000.000-00                          ] │
│  E-mail*            [ joao@email.com                          ] │
│  Telefone/WhatsApp* [ (11) 99999-9999                         ] │
│  Endereço           [ Rua das Flores, 123                     ] │
└─────────────────────────────────────────────────────────────────┘
                        [ Próximo → ]

PASSO 2/3 - Dados do Aluno
┌─────────────────────────────────────────────────────────────────┐
│  Nome do Aluno*     [ Maria Silva                             ] │
│  Data Nascimento    [ 15/03/2015                              ] │
│  Curso/Turma*       [ Reforço Escolar - Fund. II           ▼ ] │
│  Observações        [ Alergia a amendoim                      ] │
│                                                                 │
│  [ + Adicionar outro aluno ]                                    │
└─────────────────────────────────────────────────────────────────┘
                    [ ← Voltar ]  [ Próximo → ]

PASSO 3/3 - Confirmação
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Responsável: João Silva (CPF: 000.000.000-00)               │
│  ✅ Aluno: Maria Silva - Reforço Escolar (R$ 180/mês)           │
│                                                                 │
│  Mensalidade estimada: R$ 180,00                                │
│                                                                 │
│  [ ] Concordo com os termos de uso                              │
└─────────────────────────────────────────────────────────────────┘
                    [ ← Voltar ]  [ Enviar Matrícula ]
```

## Implementação Técnica

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/EscolaPublica.tsx` | Página pública da landing page |
| `src/pages/PortalResponsavel.tsx` | Portal de consulta por CPF |
| `src/pages/MatriculaOnline.tsx` | Formulário de matrícula multi-step |
| `src/components/portal/PortalHeader.tsx` | Header público com navegação |
| `src/components/portal/PortalFooter.tsx` | Footer com dados da escola |
| `src/components/portal/BuscaCpf.tsx` | Componente de busca por CPF |
| `src/components/portal/FaturaCard.tsx` | Card de fatura com ações |
| `src/components/portal/ResponsavelInfo.tsx` | Exibição de dados do responsável |
| `src/components/portal/MatriculaForm.tsx` | Formulário multi-step de matrícula |
| `src/hooks/usePortalResponsavel.ts` | Hook para consulta pública por CPF |
| `supabase/functions/portal-consulta-cpf/index.ts` | Edge function para consulta segura |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Adicionar rotas públicas `/escola/:slug/*` |
| `src/hooks/useWebsiteBuilder.ts` | Adicionar bloco "portal_link" |
| `supabase/functions/register-prematricula/index.ts` | Atualizar para suportar matrícula completa |

### Rotas no App.tsx

```typescript
// Rotas públicas do site escolar
<Route path="/escola/:slug" element={<EscolaPublica />} />
<Route path="/escola/:slug/portal" element={<PortalResponsavel />} />
<Route path="/escola/:slug/matricula" element={<MatriculaOnline />} />
```

### Edge Function: Consulta por CPF

A consulta por CPF será feita via edge function para:
1. Validar que o CPF existe no tenant correto
2. Retornar dados sem expor informações sensíveis
3. Aplicar rate limiting para evitar abuso
4. Não expor IDs internos ou dados de outros responsáveis

```typescript
// Retorno da edge function
{
  responsavel: {
    nome: "Maria Silva",
    email_parcial: "m***@email.com", // parcialmente mascarado
    telefone_parcial: "(11) ****-9999"
  },
  alunos: [
    { nome: "João Silva", curso: "Reforço Escolar" }
  ],
  faturas: [
    {
      referencia: "Jan/2025",
      valor: 180.00,
      vencimento: "2025-01-10",
      status: "vencida",
      pix_payload: "00020126...", // código PIX
      boleto_url: "https://...", // link do boleto
      invoice_url: "https://..." // link Asaas
    }
  ]
}
```

### Segurança

| Medida | Implementação |
|--------|---------------|
| Rate Limiting | Max 5 consultas por IP/minuto |
| CPF Validation | Validação de dígitos verificadores |
| Tenant Isolation | Consulta apenas no tenant do slug |
| Data Masking | Email e telefone parcialmente mascarados |
| HTTPS Only | Todas as requisições via HTTPS |
| No Auth Required | Apenas CPF + tenant_id |

### Novo Bloco: Link do Portal

Adicionar bloco "Portal Link" à biblioteca de blocos para permitir que o admin adicione um banner/botão para o portal:

```typescript
{
  type: "portal_link",
  name: "Acesso ao Portal",
  description: "Link para área do responsável",
  icon: "FileSearch",
  category: "forms",
  defaultContent: {
    title: "Área do Responsável",
    subtitle: "Consulte seus boletos e faturas",
    button_text: "Acessar Portal"
  }
}
```

## Fluxo de Navegação

```text
                    ┌──────────────────┐
                    │  Landing Page    │
                    │  /escola/:slug   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Portal CPF     │ │  Matrícula      │ │  Contato        │
│  /escola/portal │ │  /escola/matr.  │ │  WhatsApp/Tel   │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────┐ ┌─────────────────┐
│  Ver Boletos    │ │  Pré-Matrícula  │
│  Copiar PIX     │ │  Cadastrada     │
│  Pagar Online   │ │  (Notificação)  │
└─────────────────┘ └─────────────────┘
```

## Mobile First

Todo o portal será **responsivo** com foco em mobile, pois a maioria dos pais acessará pelo celular:

- Botões grandes e touch-friendly
- Layout vertical otimizado
- Botão "Copiar PIX" com feedback visual
- Navegação simplificada
- Cards de fatura com swipe actions (futuro)

## Próximos Passos (Fases)

**Fase 1** (Esta implementação):
- Página pública renderizando blocos existentes
- Portal de consulta por CPF
- Visualização e download de boletos

**Fase 2** (Futuro):
- Formulário de matrícula multi-step completo
- Pagamento online via PIX/Cartão
- Notificações por WhatsApp
- Histórico de pagamentos com gráficos

**Fase 3** (Futuro):
- App PWA para pais
- Push notifications
- Área de documentos (boletins, declarações)
- Chat com a escola

