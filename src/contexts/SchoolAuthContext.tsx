import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SchoolRole = "admin" | "financeiro" | "secretaria" | "staff";

interface SchoolUser {
  id: string;
  tenant_id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  role: SchoolRole;
  is_active: boolean;
  last_login_at: string | null;
}

interface Tenant {
  id: string;
  nome: string;
  logo_url: string | null;
  plano: string | null;
  subscription_status: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
}

interface SchoolAuthContextType {
  user: User | null;
  session: Session | null;
  schoolUser: SchoolUser | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresMfa?: boolean }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (requiredRole: SchoolRole) => boolean;
  isAdmin: () => boolean;
}

const SchoolAuthContext = createContext<SchoolAuthContextType | undefined>(undefined);

export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [schoolUser, setSchoolUser] = useState<SchoolUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  
  const lastFetchedUserId = useRef<string | null>(null);
  const isFetching = useRef(false);

  const fetchSchoolUserData = useCallback(async (userId: string) => {
    if (lastFetchedUserId.current === userId || isFetching.current) {
      return;
    }
    
    isFetching.current = true;
    
    try {
      // Verify user is a school user
      const { data: schoolUserData, error } = await supabase
        .from("school_users")
        .select("*")
        .eq("id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching school user:", error);
        setLoading(false);
        isFetching.current = false;
        return;
      }
      
      if (!schoolUserData) {
        // Not a school user - just don't set school user data
        // DON'T sign out - user might be a system manager
        setSchoolUser(null);
        setTenant(null);
        lastFetchedUserId.current = userId;
        setLoading(false);
        isFetching.current = false;
        return;
      }

      setSchoolUser(schoolUserData as SchoolUser);
      lastFetchedUserId.current = userId;

      // Fetch tenant data
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("id, nome, logo_url, plano, subscription_status, blocked_at, blocked_reason")
        .eq("id", schoolUserData.tenant_id)
        .single();

      if (tenantData) {
        setTenant(tenantData);
      }

      // Update last_login_at
      await supabase
        .from("school_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);

      // Log authentication
      await supabase.from("auth_logs").insert({
        user_id: userId,
        domain: "school",
        action: "login",
        metadata: { 
          email: schoolUserData.email,
          tenant_id: schoolUserData.tenant_id,
          role: schoolUserData.role
        }
      });

    } catch (error) {
      console.error("Error fetching school user data:", error);
      setSchoolUser(null);
      setTenant(null);
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
        fetchSchoolUserData(session.user.id);
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
            fetchSchoolUserData(session.user.id);
          }
        } else {
          setSchoolUser(null);
          setTenant(null);
          lastFetchedUserId.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchSchoolUserData]);

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

      // Verify this user is a school user BEFORE completing login
      const { data: schoolCheck, error: schoolError } = await supabase
        .from("school_users")
        .select("id, tenant_id")
        .eq("id", data.user?.id)
        .eq("is_active", true)
        .maybeSingle();

      if (schoolError || !schoolCheck) {
        // Not a school user - sign out immediately
        await supabase.auth.signOut();
        setLoading(false);
        
        // Log failed attempt
        if (data.user?.id) {
          await supabase.from("auth_logs").insert({
            user_id: data.user.id,
            domain: "school",
            action: "failed_login",
            metadata: { reason: "not_school_user", email }
          });
        }
        
        return { error: new Error("Acesso negado. Utilize o portal correto para acessar o sistema.") };
      }

      // Check if tenant is blocked
      const { data: tenantCheck } = await supabase
        .from("tenants")
        .select("blocked_at, subscription_status")
        .eq("id", schoolCheck.tenant_id)
        .single();

      if (tenantCheck?.blocked_at || tenantCheck?.subscription_status === "suspended") {
        await supabase.auth.signOut();
        setLoading(false);
        return { error: new Error("A escola está com acesso bloqueado. Entre em contato com o suporte.") };
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
        domain: "school",
        action: "logout",
        metadata: { tenant_id: schoolUser?.tenant_id }
      });
    }
    
    lastFetchedUserId.current = null;
    isFetching.current = false;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSchoolUser(null);
    setTenant(null);
  };

  const hasRole = (requiredRole: SchoolRole): boolean => {
    if (!schoolUser) return false;
    // Admin has access to everything
    if (schoolUser.role === "admin") return true;
    return schoolUser.role === requiredRole;
  };

  const isAdmin = (): boolean => {
    return schoolUser?.role === "admin";
  };

  return (
    <SchoolAuthContext.Provider
      value={{
        user,
        session,
        schoolUser,
        tenant,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user && !!schoolUser,
        hasRole,
        isAdmin,
      }}
    >
      {children}
    </SchoolAuthContext.Provider>
  );
}

export function useSchoolAuth() {
  const context = useContext(SchoolAuthContext);
  if (context === undefined) {
    throw new Error("useSchoolAuth must be used within a SchoolAuthProvider");
  }
  return context;
}
