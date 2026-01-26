

# Plano de Modernização Total: Painel GESTOR 2027

## Resumo Executivo

Uma reestruturação completa do painel do Gestor, incluindo nova paleta de cores, tipografia premium, reorganização de seções, e redesign das Configurações do Sistema. O objetivo é criar uma experiência visual de nível **Stripe/Linear/Vercel** com layout moderno e profissional.

---

## 1. Nova Paleta de Cores (Luz Mina)

Atualização do `src/index.css` com uma paleta mais vibrante e moderna:

| Token | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| `--primary` | `262 83% 58%` (Violeta) | `262 83% 65%` | Ações principais |
| `--accent` | `340 80% 58%` (Rosa) | `340 75% 55%` | Destaques |
| `--success` | `160 84% 39%` (Esmeralda) | `160 84% 45%` | Sucesso |
| `--chart-1` | `262 83% 58%` | - | Gráficos |
| `--chart-2` | `340 80% 58%` | - | Gráficos |
| `--chart-3` | `25 95% 55%` (Laranja) | - | Gráficos |

---

## 2. Reorganização da Arquitetura de Configurações

### 2.1 Atual (Problema)
- Tudo misturado em abas na mesma página
- Segurança e Alertas fora de contexto
- Layout genérico sem identidade

### 2.2 Nova Estrutura

```text
/platform/settings (Hub Central)
├── Marca & Identidade
│   ├── Logo e Nome
│   ├── Cores do Gradiente (com color picker visual)
│   ├── Favicon e SEO
│   └── Termos de Privacidade
│
├── Funcionalidades
│   ├── Novos Cadastros
│   ├── Notificações por Email
│   ├── Modo Manutenção
│   └── Gateways (Stripe/Asaas)
│
├── Limites
│   ├── Escolas
│   ├── Usuários por Escola
│   ├── Alunos por Escola
│   └── Tamanho de Arquivos
│
├── Backup & Logs (dentro de Sistema)
│   ├── Backup Automático
│   ├── Frequência
│   └── Retenção de Logs

/platform/security (Página Separada - NOVO)
├── Sessão e Autenticação
├── Política de Senhas
└── Bloqueio por Tentativas

/platform/alerts (Página Separada - NOVO)
├── Notificações de Novos Tenants
├── Alertas de Pagamento
└── Alertas de Segurança
```

---

## 3. Dashboard Modernizado

### 3.1 WelcomeCard Aprimorado
- Versículo bíblico em destaque com fundo glassmorphism
- Badge de "Gestor Master" ao lado do nome
- Gradiente sutil de fundo

### 3.2 Nova Sidebar do Gestor
- Ícones modernos com tamanho uniforme (20px)
- Cores semânticas com opacidade consistente
- Indicador de "Página Ativa" com gradiente lateral
- Separadores sutis entre seções
- Botão de "Segurança" e "Alertas" adicionados ao menu

### 3.3 Novos Widgets
- **StatusWidget**: Card compacto mostrando status do sistema (Online, Manutenção)
- **StorageWidget**: Barra de progresso de uso de armazenamento global
- Remover duplicidade de ProfileWidget (já aparece no WelcomeCard)

---

## 4. Configurações do Sistema - Redesign Premium

### 4.1 Nova Interface Visual

Em vez de tabs horizontais genéricas, usar navegação lateral estilo Shopify:

```text
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Configurações do Sistema                            │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  📦 Marca    │   [Formulário de Marca]                  │
│  ⚡ Geral    │   - Logo com upload drag-and-drop       │
│  📊 Limites  │   - Preview do gradiente em tempo real  │
│  🛡️ Backup   │   - Color pickers HSL visuais           │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### 4.2 Color Picker Visual

Novo componente `HSLColorPicker`:
- Slider de Hue (0-360)
- Slider de Saturation (0-100%)
- Slider de Lightness (0-100%)
- Preview em tempo real do gradiente

### 4.3 Preview do Gradiente

Card maior com preview da landing page simulada:
- Caixa de login glass no centro
- Logo centralizado
- Botões CTA

---

## 5. Tipografia e Iconografia

### 5.1 Tipografia
- Títulos: `font-bold text-2xl tracking-tight`
- Subtítulos: `text-muted-foreground text-sm`
- Labels: `text-xs uppercase tracking-wide text-muted-foreground`
- Valores: `font-semibold tabular-nums`

### 5.2 Ícones Profissionais
- Substituir ícones genéricos por versões Lucide mais modernas
- Tamanho padrão: 18-20px (h-5 w-5)
- Stroke width: 1.75
- Cores: usar classes semânticas, nunca hardcoded

| Atual | Novo |
|-------|------|
| `Building2` | `School` |
| `Database` | `HardDrive` |
| `Globe` | `Languages` |
| `Settings` | `Cog` |

---

## 6. Novas Páginas

### 6.1 `/platform/security`
Configurações de segurança extraídas das Configurações do Sistema:
- Timeout de sessão
- MFA para admins
- Política de senhas
- Bloqueio por tentativas

### 6.2 `/platform/alerts` (Notificações)
Sistema de alertas extraído:
- Alertas de novos cadastros
- Alertas de pagamento
- Alertas de segurança
- Histórico de notificações

---

## 7. Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/index.css` | Nova paleta de cores Luz Mina |
| `src/pages/platform/SystemProfile.tsx` | Redesign completo com sidebar lateral |
| `src/components/platform/PlatformLayout.tsx` | Novos ícones, nova estrutura do menu |
| `src/components/platform/dashboard/WelcomeCard.tsx` | Versículo em destaque, badge de gestor |
| `src/pages/platform/PlatformDashboard.tsx` | Remover duplicação, adicionar StatusWidget |
| `src/components/platform/dashboard/index.ts` | Exportar novos widgets |

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/platform/PlatformSecuritySettings.tsx` | Página dedicada de segurança |
| `src/pages/platform/PlatformAlerts.tsx` | Página dedicada de alertas/notificações |
| `src/components/config/HSLColorPicker.tsx` | Componente visual de seleção HSL |
| `src/components/platform/dashboard/SystemStatusWidget.tsx` | Status online/manutenção |
| `src/components/platform/settings/SettingsSidebar.tsx` | Navegação lateral das configs |

---

## 8. Detalhes Técnicos

### 8.1 Paleta Luz Mina (CSS Variables)

```css
:root {
  --primary: 262 83% 58%;       /* Violeta vibrante */
  --accent: 340 80% 58%;        /* Rosa/Pink */
  --success: 160 84% 39%;       /* Esmeralda */
  --warning: 38 92% 50%;        /* Âmbar */
  --info: 199 89% 48%;          /* Ciano */
  
  --chart-1: 262 83% 58%;       /* Violeta */
  --chart-2: 340 80% 58%;       /* Rosa */
  --chart-3: 25 95% 55%;        /* Laranja */
  --chart-4: 160 84% 39%;       /* Esmeralda */
  --chart-5: 199 89% 48%;       /* Ciano */
}
```

### 8.2 Estrutura do HSLColorPicker

```typescript
interface HSLColorPickerProps {
  value: string;          // "262 83% 58%"
  onChange: (value: string) => void;
  label: string;
}
```

### 8.3 Rotas Novas

```typescript
// Em App.tsx
<Route path="/platform/security-settings" element={<PlatformSecuritySettings />} />
<Route path="/platform/notifications" element={<PlatformAlerts />} />
```

---

## 9. Animações e Micro-interações

- Cards: `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`
- Sidebar items: `hover:bg-muted/50 active:scale-[0.98]`
- Color pickers: Gradiente atualiza em tempo real ao arrastar sliders
- Versículo bíblico: Fade-in com delay de 0.3s

---

## 10. Resultado Esperado

Uma experiência de administração de plataforma que:
- Reflete padrões visuais de 2027+ (Linear, Stripe, Vercel)
- Usa a paleta Luz Mina com cores vibrantes e profissionais
- Organiza configurações de forma lógica (Marca, Geral, Limites, Segurança, Alertas)
- Mantém o versículo bíblico em destaque com design premium
- Usa ícones modernos e tipografia refinada
- Tem navegação fluida com animações sutis

