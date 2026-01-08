import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";

// Pages
import Index from "./pages/Index";
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
import Marketing from "./pages/Marketing";
import NotFound from "./pages/NotFound";

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
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              
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
              <Route
                path="/marketing"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Marketing />
                  </ProtectedRoute>
                }
              />
              
              {/* Public Payment Result Page */}
              <Route path="/pagamento/resultado" element={<PaymentResult />} />
              
              {/* Public Ponto Eletrônico Page */}
              <Route path="/ponto/:token" element={<PontoEletronico />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;
