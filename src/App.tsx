import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useUserLanguage } from "@/hooks/useUserLanguage";
import { queryClient } from "@/lib/queryClient";

// Pages
import Institucional from "./pages/Institucional";
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
import SaudeFinanceira from "./pages/SaudeFinanceira";
import Contabilidade from "./pages/Contabilidade";
import SiteEscolar from "./pages/SiteEscolar";
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
          {/* Público - Redireciona para login */}
          <Route path="/" element={<Auth />} />
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
          
          {/* Público funcional */}
          <Route path="/pagamento/resultado" element={<PaymentResult />} />
          <Route path="/ponto/:token" element={<PontoEletronico />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <ErrorBoundary>
          <TooltipProvider>
            <AppContent />
          </TooltipProvider>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
