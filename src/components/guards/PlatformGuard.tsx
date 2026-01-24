import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { useSchoolAuth } from "@/contexts/SchoolAuthContext";
import { Loader2 } from "lucide-react";

interface PlatformGuardProps {
  children: ReactNode;
}

/**
 * Guard exclusivo para rotas do domínio da Plataforma (Gestor).
 * Bloqueia acesso de usuários de escola.
 */
export function PlatformGuard({ children }: PlatformGuardProps) {
  const { user, manager, loading, isAuthenticated } = usePlatformAuth();
  const { loading: schoolLoading, isAuthenticated: isSchoolAuthenticated, schoolUser } = useSchoolAuth();
  const location = useLocation();

  if (loading || schoolLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to platform login
  if (!user) {
    return <Navigate to="/login-gestor" state={{ from: location }} replace />;
  }

  // Se está logado como usuário de Escola, redireciona para o domínio correto
  if (isSchoolAuthenticated && schoolUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authenticated but not a system manager - block access
  if (!isAuthenticated || !manager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400 mb-6">
            Esta área é exclusiva para gestores do sistema. 
            Se você é um usuário de escola, acesse pelo portal correto.
          </p>
          <div className="flex flex-col gap-2">
            <a 
              href="/login-escola" 
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
            >
              Ir para Portal da Escola
            </a>
            <a 
              href="/login-gestor" 
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Tentar login como Gestor
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
