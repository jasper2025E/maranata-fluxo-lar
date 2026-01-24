import { ReactNode, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSchoolAuth } from "@/contexts/SchoolAuthContext";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { BlockedTenantScreen } from "@/components/BlockedTenantScreen";
import { Loader2 } from "lucide-react";

type SchoolRole = "admin" | "financeiro" | "secretaria" | "staff";

interface SchoolGuardProps {
  children: ReactNode;
  requiredRole?: SchoolRole;
}

/**
 * Guard exclusivo para rotas do domínio da Escola.
 * Bloqueia acesso de gestores do sistema.
 */
export function SchoolGuard({ children, requiredRole }: SchoolGuardProps) {
  const { user, schoolUser, tenant, loading: schoolLoading, isAuthenticated, hasRole } = useSchoolAuth();
  const { loading: platformLoading, isAuthenticated: isPlatformAuthenticated, manager } = usePlatformAuth();
  const location = useLocation();
  
  // Estado estável para evitar flickering durante transições
  const [isReady, setIsReady] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'platform_user' | 'not_auth' | 'not_school' | 'blocked' | 'no_role' | 'authorized'>('loading');

  useEffect(() => {
    // Aguarda ambos os loadings terminarem
    if (schoolLoading || platformLoading) {
      setAuthState('loading');
      return;
    }

    // Determina o estado de auth de forma estável
    if (!user) {
      setAuthState('not_auth');
    } else if (isPlatformAuthenticated && manager) {
      setAuthState('platform_user');
    } else if (!isAuthenticated || !schoolUser) {
      setAuthState('not_school');
    } else if (tenant && (tenant.blocked_at || tenant.subscription_status === "suspended")) {
      setAuthState('blocked');
    } else if (requiredRole && !hasRole(requiredRole)) {
      setAuthState('no_role');
    } else {
      setAuthState('authorized');
    }
    
    setIsReady(true);
  }, [schoolLoading, platformLoading, user, isPlatformAuthenticated, manager, isAuthenticated, schoolUser, tenant, requiredRole, hasRole]);

  // Sempre mostra loading até estar pronto
  if (!isReady || authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to school login
  if (authState === 'not_auth') {
    return <Navigate to="/login-escola" state={{ from: location }} replace />;
  }

  // Se está logado como Gestor, redireciona para o domínio correto
  if (authState === 'platform_user') {
    return <Navigate to="/platform" replace />;
  }

  // Authenticated but not a school user - block access
  if (authState === 'not_school') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-blue-100 p-4">
        <div className="bg-white/90 backdrop-blur-xl border border-violet-200 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            Esta área é exclusiva para usuários de escola. 
            Se você é um gestor do sistema, acesse pelo portal correto.
          </p>
          <div className="flex flex-col gap-2">
            <a 
              href="/login-gestor" 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Ir para Portal do Gestor
            </a>
            <a 
              href="/login-escola" 
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Tentar login como Escola
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check tenant status - blocked
  if (authState === 'blocked' && tenant) {
    return (
      <BlockedTenantScreen 
        reason={tenant.blocked_reason || undefined}
        isPastDue={false}
      />
    );
  }

  // Check role permission
  if (authState === 'no_role') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
