import { useCustomDomainDetection, useTenantByDomain } from "@/hooks/useTenantBranding";
import LoginEscolaDinamico from "@/pages/LoginEscolaDinamico";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Componente de roteamento inteligente para a raiz do domínio
 * Detecta se é um domínio customizado e redireciona apropriadamente:
 * - Domínio customizado → Login da escola com branding
 * - Domínio padrão → Redireciona para /login-escola
 */
export default function CustomDomainRouter() {
  const { isCustomDomain, customDomain, isLovableDomain } = useCustomDomainDetection();
  const { data: tenant, isLoading } = useTenantByDomain(customDomain || undefined);

  // Se é domínio da plataforma, redireciona para login padrão
  if (isLovableDomain) {
    return <Navigate to="/login-escola" replace />;
  }

  // Se está carregando a verificação de domínio customizado
  if (isCustomDomain && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-blue-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se é domínio customizado com tenant encontrado, mostra login dinâmico
  if (isCustomDomain && tenant) {
    return <LoginEscolaDinamico />;
  }

  // Fallback: redireciona para login padrão
  return <Navigate to="/login-escola" replace />;
}
