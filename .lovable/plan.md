
# Plano: Modo Produção Profissional Completo

Transformação do sistema para ambiente de produção real com foco em 4 pilares: Visual/Estética, Segurança, Performance e Publicação.

---

## 1. Visual/Estética — Polimento Final

### 1.1 Meta Tags e SEO
- **index.html**: Atualizar meta tags para remover referências ao Lovable
  - Remover `og:image` e `twitter:image` apontando para lovable.dev
  - Substituir por imagem própria da escola (ou gerar uma)
  - Remover `twitter:site` "@Lovable"
  
### 1.2 Página 404 Aprimorada
- Transformar a página 404 simples em uma versão profissional com:
  - Gradiente de fundo consistente com o login
  - Animação suave de entrada
  - Ilustração ou ícone maior
  - Botão estilizado para voltar

### 1.3 Landing Page Removida
- A rota "/" já redireciona para /auth (correto para ambiente privado)
- Remover arquivo `src/pages/Index.tsx` (não utilizado) ou mantê-lo como fallback simples

### 1.4 Loading States Consistentes
- Verificar que todos os estados de loading usam os mesmos skeletons/spinners
- Garantir feedback visual em todas as ações

---

## 2. Segurança — Proteção de Produção

### 2.1 Habilitar Proteção de Senhas Vazadas
- Ativar "Leaked Password Protection" no Auth
  
### 2.2 Revisar Políticas RLS Permissivas
O linter detectou 4 políticas com `USING (true)` para INSERT/UPDATE/DELETE:
- Investigar quais tabelas estão com essas políticas
- Corrigir para usar verificação de autenticação adequada

### 2.3 Console Logs de Produção
- Remover `console.warn` e `console.error` desnecessários
- Manter apenas logs de monitoramento real (ou removê-los completamente)

### 2.4 Proteção de Conteúdo
- O sistema já usa `useContentProtection` para bloquear cópia
- Verificar se está ativo em produção

---

## 3. Performance — Otimização Final

### 3.1 Lazy Loading de Páginas
- Implementar `React.lazy()` para carregar páginas sob demanda
- Adicionar `Suspense` com fallback de loading
- Reduz bundle inicial significativamente

### 3.2 Otimização de Imagens
- Verificar que `StableImage` está sendo usado consistentemente
- Adicionar `loading="lazy"` em imagens não críticas

### 3.3 Cache de Dados Otimizado
- O sistema já usa `staleTime: 2 minutos` (adequado)
- Verificar prefetch de dados críticos

### 3.4 Bundle Splitting
- Verificar configuração do Vite para code splitting automático

---

## 4. Publicação — Deploy Final

### 4.1 Verificação Pré-Deploy
- Testar fluxo completo de login → dashboard → operações
- Validar integração Asaas em produção
- Confirmar webhooks funcionando

### 4.2 Publicação via Lovable
- Deploy será feito pela plataforma Lovable
- URL de produção: maranata-fluxo-lar.lovable.app

---

## Detalhes Técnicos de Implementação

### Arquivo: `index.html`
Remover referências ao Lovable nas meta tags:
```html
<!-- ANTES -->
<meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
<meta name="twitter:site" content="@Lovable" />

<!-- DEPOIS -->
<meta property="og:image" content="/escola-logo.png" />
<!-- Remover twitter:site completamente -->
```

### Arquivo: `src/pages/NotFound.tsx`
Transformar em página 404 profissional:
```tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientBackground } from "@/components/landing/GradientBackground";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <GradientBackground />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center p-8"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-10 border border-white/20">
          <AlertTriangle className="h-16 w-16 text-white/80 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <p className="text-xl text-white/80 mb-6">Página não encontrada</p>
          <Link to="/dashboard">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
```

### Arquivo: `src/App.tsx`
Implementar lazy loading das páginas:
```tsx
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load páginas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Faturas = lazy(() => import("./pages/Faturas"));
const Alunos = lazy(() => import("./pages/Alunos"));
// ... outras páginas

// Componente de loading
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// No Routes, envolver com Suspense:
<Suspense fallback={<PageLoader />}>
  <Dashboard />
</Suspense>
```

### Migração SQL: Corrigir Políticas RLS
```sql
-- Investigar e corrigir políticas permissivas
-- Exemplo de correção:
-- ALTER POLICY "policy_name" ON table_name
-- USING (auth.uid() IS NOT NULL);
```

---

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `index.html` | Remover meta tags do Lovable, usar assets próprios |
| `src/pages/NotFound.tsx` | Design profissional com gradiente e animação |
| `src/App.tsx` | Lazy loading de páginas para performance |
| Políticas RLS | Corrigir 4 políticas permissivas |
| Auth Config | Habilitar proteção de senhas vazadas |

## Resultado Esperado

- Interface 100% profissional sem menções a ferramentas de desenvolvimento
- Segurança reforçada com RLS e proteção de senhas
- Carregamento inicial ~40% mais rápido com lazy loading
- Sistema pronto para uso real pela Escola Maranata
