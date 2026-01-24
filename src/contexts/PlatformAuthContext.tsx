import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SystemManager {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

interface PlatformAuthContextType {
  user: User | null;
  session: Session | null;
  manager: SystemManager | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresMfa?: boolean }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | undefined>(undefined);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [manager, setManager] = useState<SystemManager | null>(null);
  const [loading, setLoading] = useState(true);
  
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetching = useRef(false);

  const fetchManagerData = useCallback(async (userId: string) => {
    if (lastFetchedUserId.current === userId || isFetching.current) {
      return;
    }
    
    isFetching.current = true;
    
    try {
      // Verify user is a system manager
      const { data: managerData, error } = await supabase
        .from("system_managers")
        .select("*")
        .eq("id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching manager:", error);
        setLoading(false);
        isFetching.current = false;
        return;
      }

      if (!managerData) {
        // Not a system manager - just don't set manager data
        // DON'T sign out - user might be a school user
        setManager(null);
        lastFetchedUserId.current = userId;
        setLoading(false);
        isFetching.current = false;
        return;
      }

      setManager(managerData);
      lastFetchedUserId.current = userId;

      // Update last_login_at
      await supabase
        .from("system_managers")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);

      // Log authentication
      await supabase.from("auth_logs").insert({
        user_id: userId,
        domain: "platform",
        action: "login",
        metadata: { email: managerData.email }
      });

    } catch (error) {
      console.error("Error fetching manager data:", error);
      setManager(null);
      lastFetchedUserId.current = null;
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchManagerData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchManagerData(session.user.id);
          }
        } else {
          setManager(null);
          lastFetchedUserId.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchManagerData]);

  const signIn = async (email: string, password: string) => {
    lastFetchedUserId.current = null;
    isFetching.current = false;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: new Error(error.message) };
      }

      // Verify this user is a system manager BEFORE completing login
      const { data: managerCheck, error: managerError } = await supabase
        .from("system_managers")
        .select("id")
        .eq("id", data.user?.id)
        .eq("is_active", true)
        .maybeSingle();

      if (managerError || !managerCheck) {
        // Not a system manager - sign out immediately
        await supabase.auth.signOut();
        setLoading(false);
        
        // Log failed attempt
        if (data.user?.id) {
          await supabase.from("auth_logs").insert({
            user_id: data.user.id,
            domain: "platform",
            action: "failed_login",
            metadata: { reason: "not_system_manager", email }
          });
        }
        
        return { error: new Error("Acesso negado. Esta área é exclusiva para gestores do sistema.") };
      }

      // Check for MFA
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      
      if (factorsData?.totp && factorsData.totp.length > 0) {
        const verifiedFactors = factorsData.totp.filter(f => f.status === "verified");
        if (verifiedFactors.length > 0) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
            return { error: null, requiresMfa: true };
          }
        }
      }

      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    if (user?.id) {
      await supabase.from("auth_logs").insert({
        user_id: user.id,
        domain: "platform",
        action: "logout"
      });
    }
    
    lastFetchedUserId.current = null;
    isFetching.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setManager(null);
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        session,
        manager,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user && !!manager,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext);
  if (context === undefined) {
    throw new Error("usePlatformAuth must be used within a PlatformAuthProvider");
  }
  return context;
}
