import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useUserLanguage } from "@/hooks/useUserLanguage";
import { queryClient } from "@/lib/queryClient";

// Pages
import Institucional from "./pages/Institucional";
import RootRedirect from "./components/RootRedirect";
import Auth from "./pages/Auth";
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
import SaudeFinanceira from "./pages/SaudeFinanceira";
import Contabilidade from "./pages/Contabilidade";
import SiteEscolar from "./pages/SiteEscolar";
import EscolaPublica from "./pages/EscolaPublica";

// Platform Admin Pages
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import TenantsList from "./pages/platform/TenantsList";
import TenantForm from "./pages/platform/TenantForm";
import TenantDetails from "./pages/platform/TenantDetails";
import TenantData from "./pages/platform/TenantData";
import ImpersonateUser from "./pages/platform/ImpersonateUser";
import PlatformUsers from "./pages/platform/PlatformUsers";
import PlatformSubscriptions from "./pages/platform/PlatformSubscriptions";
import PlatformLogs from "./pages/platform/PlatformLogs";
// PlatformSettings foi consolidado em SystemProfile
import PlatformSecurity from "./pages/platform/PlatformSecurity";
import PlatformAnalytics from "./pages/platform/PlatformAnalytics";
import PlatformPlans from "./pages/platform/PlatformPlans";
import PlatformModules from "./pages/platform/PlatformModules";
import PlatformMonitoring from "./pages/platform/PlatformMonitoring";
import PlatformBranding from "./pages/platform/PlatformBranding";
import PlatformProfile from "./pages/platform/PlatformProfile";
import SystemProfile from "./pages/platform/SystemProfile";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

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
          <Route path="/" element={<Institucional />} />
          <Route path="/auth" element={<Auth />} />
          {/* Legacy route (marketing removido) */}
          <Route path="/marketing" element={<RootRedirect />} />
          
          {/* Protected Routes */}
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
            path="/pagamentos"
            element={
              <ProtectedRoute>
                <Pagamentos />
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
          {/* Redirect old subscription route to escola */}
          <Route
            path="/assinatura"
            element={<Navigate to="/escola?tab=assinatura" replace />}
          />
          <Route
            path="/assinatura/faturas"
            element={<Navigate to="/escola/faturas" replace />}
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
          <Route
            path="/site-escolar"
            element={
              <ProtectedRoute requiredRole="admin">
                <SiteEscolar />
              </ProtectedRoute>
            }
          />
          {/* Escola Faturas */}
          <Route
            path="/escola/faturas"
            element={
              <ProtectedRoute requiredRole="admin">
                <FaturasAssinatura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pagar-fatura"
            element={
              <ProtectedRoute>
                <PagarFatura />
              </ProtectedRoute>
            }
          />
          
          {/* Platform Admin Routes */}
          <Route
            path="/platform"
            element={
              <ProtectedRoute platformOnly>
                <PlatformDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/tenants"
            element={
              <ProtectedRoute platformOnly>
                <TenantsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/tenants/new"
            element={
              <ProtectedRoute platformOnly>
                <TenantForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/tenants/:id"
            element={
              <ProtectedRoute platformOnly>
                <TenantDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/tenants/:id/edit"
            element={
              <ProtectedRoute platformOnly>
                <TenantForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/impersonate"
            element={
              <ProtectedRoute platformOnly>
                <ImpersonateUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/users"
            element={
              <ProtectedRoute platformOnly>
                <PlatformUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/subscriptions"
            element={
              <ProtectedRoute platformOnly>
                <PlatformSubscriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/logs"
            element={
              <ProtectedRoute platformOnly>
                <PlatformLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/settings"
            element={
              <ProtectedRoute platformOnly>
                <SystemProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/security"
            element={
              <ProtectedRoute platformOnly>
                <PlatformSecurity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/analytics"
            element={
              <ProtectedRoute platformOnly>
                <PlatformAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/plans"
            element={
              <ProtectedRoute platformOnly>
                <PlatformPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/modules"
            element={
              <ProtectedRoute platformOnly>
                <PlatformModules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/monitoring"
            element={
              <ProtectedRoute platformOnly>
                <PlatformMonitoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/branding"
            element={
              <ProtectedRoute platformOnly>
                <PlatformBranding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/profile"
            element={
              <ProtectedRoute platformOnly>
                <PlatformProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/system-profile"
            element={
              <ProtectedRoute platformOnly>
                <SystemProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform/tenants/:id/data"
            element={
              <ProtectedRoute platformOnly>
                <TenantData />
              </ProtectedRoute>
            }
          />
          
          {/* Public Payment Result Page */}
          <Route path="/pagamento/resultado" element={<PaymentResult />} />
          
          {/* Public Ponto Eletrônico Page */}
          <Route path="/ponto/:token" element={<PontoEletronico />} />
          
          {/* Public Landing Page */}
          <Route path="/inscricao" element={<LandingPage />} />
          
          {/* Public Onboarding - New School Registration */}
          <Route path="/cadastro" element={<Onboarding />} />
          
          {/* Public School Website */}
          <Route path="/escola/:slug" element={<EscolaPublica />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

// queryClient agora é importado de @/lib/queryClient

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
