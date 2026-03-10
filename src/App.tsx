import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import RootRedirect from "@/components/RootRedirect";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useContentProtection } from "@/hooks/useContentProtection";
import { queryClient } from "@/lib/queryClient";
import { useUserLanguage } from "@/hooks/useUserLanguage";
import { PageLoader } from "@/components/PageLoader";
import { PWAInstallBanner, PWAUpdatePrompt, NetworkStatusIndicator } from "@/components/pwa";

// Lazy load all pages for optimal bundle splitting
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ResponsavelDashboard = lazy(() => import("./pages/ResponsavelDashboard"));
const Responsaveis = lazy(() => import("./pages/Responsaveis"));
const Alunos = lazy(() => import("./pages/Alunos"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Turmas = lazy(() => import("./pages/Turmas"));
const Escola = lazy(() => import("./pages/Escola"));
const Faturas = lazy(() => import("./pages/Faturas"));

const Despesas = lazy(() => import("./pages/Despesas"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const RH = lazy(() => import("./pages/RH"));
const PontoEletronico = lazy(() => import("./pages/PontoEletronico"));
const SaudeFinanceira = lazy(() => import("./pages/SaudeFinanceira"));
const Contabilidade = lazy(() => import("./pages/Contabilidade"));
const PerfilAluno = lazy(() => import("./pages/PerfilAluno"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Institucional = lazy(() => import("./pages/Institucional"));

// Componente interno que usa hooks de proteção
function AppContent() {
  // Ativar proteção de conteúdo (não afeta inputs/formulários)
  useContentProtection({ enabled: true, allowInputs: true });
  
  // Carregar idioma do usuário do banco de dados
  useUserLanguage();

  return (
    <>
      <NetworkStatusIndicator />
      <PWAUpdatePrompt />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Público - raiz inteligente */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/site" element={<Institucional />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protegido - Escola Maranata */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/financeiro"
              element={
                <ProtectedRoute>
                  <ResponsavelDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/responsaveis"
              element={
                <ProtectedRoute>
                  <Responsaveis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alunos"
              element={
                <ProtectedRoute>
                  <Alunos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cursos"
              element={
                <ProtectedRoute>
                  <Cursos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/turmas"
              element={
                <ProtectedRoute>
                  <Turmas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Escola />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faturas"
              element={
                <ProtectedRoute>
                  <Faturas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/despesas"
              element={
                <ProtectedRoute>
                  <Despesas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rh"
              element={
                <ProtectedRoute>
                  <RH />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saude-financeira"
              element={
                <ProtectedRoute>
                  <SaudeFinanceira />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contabilidade"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Contabilidade />
                </ProtectedRoute>
              }
            />
            
            {/* Público funcional */}
            <Route path="/pagamento/resultado" element={<PaymentResult />} />
            <Route path="/ponto/:token" element={<PontoEletronico />} />
            
            {/* Perfil do Aluno */}
            <Route
              path="/alunos/:alunoId/perfil"
              element={
                <ProtectedRoute>
                  <PerfilAluno />
                </ProtectedRoute>
              }
            />
            
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <PWAInstallBanner />
    </>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <RealtimeProvider>
            <ErrorBoundary>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </ErrorBoundary>
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
