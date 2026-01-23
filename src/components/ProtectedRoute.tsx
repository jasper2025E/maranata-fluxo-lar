import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole;
  platformOnly?: boolean;
}

// Routes that platform_admin can access outside of /platform
const platformAdminAllowedRoutes = ["/configuracoes"];

export function ProtectedRoute({ children, requiredRole, platformOnly }: ProtectedRouteProps) {
  const { user, loading, hasRole, isPlatformAdmin } = useAuth();
  const location = useLocation();

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
    return <Navigate to="/auth" replace />;
  }

  // Platform-only routes
  if (platformOnly && !isPlatformAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Platform admin logic
  if (isPlatformAdmin() && !platformOnly) {
    // Allow access to specific routes for platform_admin
    const isAllowedRoute = platformAdminAllowedRoutes.some(route => 
      location.pathname.startsWith(route)
    );
    
    if (!isAllowedRoute) {
      return <Navigate to="/platform" replace />;
    }
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
