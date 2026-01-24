import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useUserLanguage } from "@/hooks/useUserLanguage";

// Auth Contexts - Domínios Separados
import { PlatformAuthProvider } from "@/contexts/PlatformAuthContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Guards - Isolamento por Domínio
import { PlatformGuard } from "@/components/guards/PlatformGuard";
import { SchoolGuard } from "@/components/guards/SchoolGuard";

// Pages - School Domain
import Dashboard from "./pages/Dashboard";
import ResponsavelDashboard from "./pages/ResponsavelDashboard";
import Responsaveis from "./pages/Responsaveis";
import Alunos from "./pages/Alunos";
import Cursos from "./pages/Cursos";
import Turmas from "./pages/Turmas";
import Escola from "./pages/Escola";
import Faturas from "./pages/Faturas";
import Pagamentos from "./pages/Pagamentos";
import Despesas from "./pages/Despesas";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import PaymentResult from "./pages/PaymentResult";
import RH from "./pages/RH";
import PontoEletronico from "./pages/PontoEletronico";
import MinhaAssinatura from "./pages/MinhaAssinatura";
import FaturasAssinatura from "./pages/FaturasAssinatura";
import PagarFatura from "./pages/PagarFatura";

// Pages - Platform Domain
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import TenantsList from "./pages/platform/TenantsList";
import TenantForm from "./pages/platform/TenantForm";
import TenantDetails from "./pages/platform/TenantDetails";
import ImpersonateUser from "./pages/platform/ImpersonateUser";
import PlatformUsers from "./pages/platform/PlatformUsers";
import PlatformSubscriptions from "./pages/platform/PlatformSubscriptions";
import PlatformLogs from "./pages/platform/PlatformLogs";
import PlatformSettings from "./pages/platform/PlatformSettings";
import PlatformSecurity from "./pages/platform/PlatformSecurity";
import PlatformAnalytics from "./pages/platform/PlatformAnalytics";
import PlatformPlans from "./pages/platform/PlatformPlans";

// Pages - Login Separados
import LoginGestor from "./pages/LoginGestor";
import LoginEscola from "./pages/LoginEscola";

// Pages - Public
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Root redirect component
function RootRedirect() {
  // Por padrão, redireciona para o login da escola
  // O gestor deve acessar /login-gestor diretamente
  return <Navigate to="/login-escola" replace />;
}

// Componente interno que usa o hook de proteção
function AppContent() {
  // Ativar proteção de conteúdo (não afeta inputs/formulários)
  useContentProtection({ enabled: true, allowInputs: true });
  
  // Carregar idioma do usuário do banco de dados
  useUserLanguage();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ============================================ */}
          {/* ROTAS PÚBLICAS */}
          {/* ============================================ */}
          
          <Route path="/" element={<RootRedirect />} />
          
          {/* Login Separados por Domínio */}
          <Route path="/login-gestor" element={<LoginGestor />} />
          <Route path="/login-escola" element={<LoginEscola />} />
          
          {/* Legacy route - redireciona para login da escola */}
          <Route path="/auth" element={<Navigate to="/login-escola" replace />} />
          
          {/* Public Payment Result Page */}
          <Route path="/pagamento/resultado" element={<PaymentResult />} />
          
          {/* Public Ponto Eletrônico Page */}
          <Route path="/ponto/:token" element={<PontoEletronico />} />
          
          {/* Public Landing Page */}
          <Route path="/inscricao" element={<LandingPage />} />
          
          {/* Public Onboarding - New School Registration */}
          <Route path="/cadastro" element={<Onboarding />} />
          
          {/* ============================================ */}
          {/* DOMÍNIO: ESCOLA */}
          {/* Todas as rotas usam SchoolGuard */}
          {/* ============================================ */}
          
          <Route
            path="/dashboard"
            element={
              <SchoolGuard>
                <Dashboard />
              </SchoolGuard>
            }
          />
          <Route
            path="/dashboard/financeiro"
            element={
              <SchoolGuard>
                <ResponsavelDashboard />
              </SchoolGuard>
            }
          />
          <Route
            path="/responsaveis"
            element={
              <SchoolGuard>
                <Responsaveis />
              </SchoolGuard>
            }
          />
          <Route
            path="/alunos"
            element={
              <SchoolGuard>
                <Alunos />
              </SchoolGuard>
            }
          />
          <Route
            path="/cursos"
            element={
              <SchoolGuard>
                <Cursos />
              </SchoolGuard>
            }
          />
          <Route
            path="/turmas"
            element={
              <SchoolGuard>
                <Turmas />
              </SchoolGuard>
            }
          />
          <Route
            path="/escola"
            element={
              <SchoolGuard requiredRole="admin">
                <Escola />
              </SchoolGuard>
            }
          />
          <Route
            path="/faturas"
            element={
              <SchoolGuard>
                <Faturas />
              </SchoolGuard>
            }
          />
          <Route
            path="/pagamentos"
            element={
              <SchoolGuard>
                <Pagamentos />
              </SchoolGuard>
            }
          />
          <Route
            path="/despesas"
            element={
              <SchoolGuard>
                <Despesas />
              </SchoolGuard>
            }
          />
          <Route
            path="/relatorios"
            element={
              <SchoolGuard>
                <Relatorios />
              </SchoolGuard>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <SchoolGuard>
                <Configuracoes />
              </SchoolGuard>
            }
          />
          <Route
            path="/rh"
            element={
              <SchoolGuard>
                <RH />
              </SchoolGuard>
            }
          />
          <Route
            path="/assinatura"
            element={
              <SchoolGuard requiredRole="admin">
                <MinhaAssinatura />
              </SchoolGuard>
            }
          />
          <Route
            path="/assinatura/faturas"
            element={
              <SchoolGuard requiredRole="admin">
                <FaturasAssinatura />
              </SchoolGuard>
            }
          />
          <Route
            path="/pagar-fatura"
            element={
              <SchoolGuard>
                <PagarFatura />
              </SchoolGuard>
            }
          />
          
          {/* ============================================ */}
          {/* DOMÍNIO: PLATAFORMA (GESTOR) */}
          {/* Todas as rotas usam PlatformGuard */}
          {/* ============================================ */}
          
          <Route
            path="/platform"
            element={
              <PlatformGuard>
                <PlatformDashboard />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/tenants"
            element={
              <PlatformGuard>
                <TenantsList />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/tenants/new"
            element={
              <PlatformGuard>
                <TenantForm />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/tenants/:id"
            element={
              <PlatformGuard>
                <TenantDetails />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/tenants/:id/edit"
            element={
              <PlatformGuard>
                <TenantForm />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/impersonate"
            element={
              <PlatformGuard>
                <ImpersonateUser />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/users"
            element={
              <PlatformGuard>
                <PlatformUsers />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/subscriptions"
            element={
              <PlatformGuard>
                <PlatformSubscriptions />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/logs"
            element={
              <PlatformGuard>
                <PlatformLogs />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/settings"
            element={
              <PlatformGuard>
                <PlatformSettings />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/security"
            element={
              <PlatformGuard>
                <PlatformSecurity />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/analytics"
            element={
              <PlatformGuard>
                <PlatformAnalytics />
              </PlatformGuard>
            }
          />
          <Route
            path="/platform/plans"
            element={
              <PlatformGuard>
                <PlatformPlans />
              </PlatformGuard>
            }
          />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

// Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {/* Providers separados para cada domínio de autenticação */}
        <PlatformAuthProvider>
          {/* AuthProvider aqui é o domínio ESCOLA (compatível com useAuth legado) */}
          <AuthProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </AuthProvider>
        </PlatformAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
