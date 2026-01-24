import { createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { SchoolAuthProvider, useSchoolAuth } from "@/contexts/SchoolAuthContext";

/**
 * AuthContext (LEGADO) — agora representa APENAS o domínio ESCOLA.
 * Isso evita refatoração massiva imediata (DashboardLayout e outras telas ainda usam useAuth()).
 * O domínio Gestor usa exclusivamente usePlatformAuth().
 */

// Compatibilidade com tipos antigos do app (inclui platform_admin),
// mas este AuthContext representa APENAS o domínio ESCOLA.
type AppRole = "admin" | "financeiro" | "secretaria" | "staff" | "platform_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
  isPlatformAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthBridge({ children }: { children: ReactNode }) {
  const { user, session, schoolUser, loading, signIn, signOut, hasRole } = useSchoolAuth();

  const role = (schoolUser?.role ?? null) as AppRole | null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn: async (email, password) => {
          const res = await signIn(email, password);
          return { error: res.error };
        },
        signOut,
        hasRole: (requiredRole: AppRole) => {
          if (requiredRole === "platform_admin") return false;
          return hasRole(requiredRole);
        },
        // NUNCA true aqui: Gestor é outro domínio/contexto.
        isPlatformAdmin: () => false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SchoolAuthProvider>
      <AuthBridge>{children}</AuthBridge>
    </SchoolAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
