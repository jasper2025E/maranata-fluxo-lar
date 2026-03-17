import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLegalDocuments } from "@/hooks/useLegalDocuments";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  skipTermsCheck?: boolean;
}

export function ProtectedRoute({ children, requiredRole, skipTermsCheck }: ProtectedRouteProps) {
  const { user, loading, roleLoading, hasRole } = useAuth();
  const location = useLocation();
  const { hasPendingTerms, termsLoading } = useLegalDocuments();

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (requiredRole) {
    if (roleLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando permissões...</p>
          </div>
        </div>
      );
    }

    if (!hasRole(requiredRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check legal terms acceptance (skip for the terms page itself)
  if (!skipTermsCheck) {
    if (termsLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando termos...</p>
          </div>
        </div>
      );
    }

    if (hasPendingTerms && location.pathname !== "/termos") {
      return <Navigate to="/termos" replace />;
    }
  }

  return <>{children}</>;
}
