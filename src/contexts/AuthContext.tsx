import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearQueryCache } from "@/lib/queryClient";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Prevent duplicate role fetches
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetching = useRef(false);

  const fetchUserRole = useCallback(async (userId: string) => {
    // Skip if already fetched for this user or currently fetching
    if (lastFetchedUserId.current === userId || isFetching.current) {
      return;
    }
    
    isFetching.current = true;
    setLoading(true);
    
    try {
      // Roles em ordem de prioridade (mais privilegiado primeiro)
      const rolePriority: AppRole[] = [
        "platform_admin",
        "admin",
        "financeiro",
        "secretaria",
        "staff",
      ];

      let resolvedRole: AppRole | null = null;
      for (const candidate of rolePriority) {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: candidate,
        });

        if (error) throw error;
        if (data === true) {
          resolvedRole = candidate;
          break;
        }
      }

      setRole(resolvedRole);
      lastFetchedUserId.current = userId;
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
      lastFetchedUserId.current = null;
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener for changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        const previousUserId = lastFetchedUserId.current;
        const newUserId = session?.user?.id;
        
        if (previousUserId && newUserId && previousUserId !== newUserId) {
          console.log("[Auth] Usuário mudou, limpando cache de dados");
          clearQueryCache();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchUserRole(session.user.id);
          }
        } else {
          if (previousUserId) {
            clearQueryCache();
          }
          setRole(null);
          lastFetchedUserId.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    lastFetchedUserId.current = null;
    isFetching.current = false;
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    clearQueryCache();
    
    lastFetchedUserId.current = null;
    isFetching.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    // Proprietário (platform_admin) tem acesso total a tudo
    if (role === "platform_admin") return true;
    // Admin tem acesso total dentro da escola
    if (role === "admin") return true;
    return role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
