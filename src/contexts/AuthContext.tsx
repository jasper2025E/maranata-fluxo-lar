import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    let mounted = true;
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth loading timeout - forcing complete");
        setLoading(false);
      }
    }, 8000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (mounted) fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error("Error getting session:", error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const queryPromise = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw error;
      setRole(data?.role ?? null);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;
    // Admin has access to everything
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
