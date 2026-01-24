import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSchoolAuth } from "@/contexts/SchoolAuthContext";
import { 
  useTenantBranding, 
  useTenantByDomain,
  useCustomDomainDetection,
  validateUserForTenant,
  TenantBranding 
} from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, BookOpen, ShieldCheck, ArrowLeft, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

/**
 * Tela de Login Dinâmica por Escola
 * Suporta:
 * - Acesso via slug: /e/:slug
 * - Acesso via domínio customizado: portal.escola.com.br
 */
const LoginEscolaDinamico = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, schoolUser, loading: authLoading, signIn, isAuthenticated } = useSchoolAuth();
  
  // Detectar se é acesso via domínio customizado
  const { isCustomDomain, customDomain } = useCustomDomainDetection();
  
  // Buscar branding: via slug OU via domínio customizado
  const { data: tenantBySlug, isLoading: slugLoading } = useTenantBranding(slug);
  const { data: tenantByDomain, isLoading: domainLoading } = useTenantByDomain(
    isCustomDomain ? customDomain || undefined : undefined
  );
  
  // Usar tenant do slug ou do domínio
  const tenant: TenantBranding | null = tenantBySlug || tenantByDomain || null;
  const tenantLoading = slug ? slugLoading : domainLoading;
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // CSS custom properties baseadas no branding
  const brandStyles = tenant ? {
    "--brand-primary": tenant.primary_color || "#7C3AED",
    "--brand-secondary": tenant.secondary_color || "#EC4899",
  } as React.CSSProperties : {};

  // Redirect if already authenticated and belongs to this tenant
  useEffect(() => {
    if (isAuthenticated && schoolUser && tenant && !authLoading) {
      if (schoolUser.tenant_id === tenant.id) {
        navigate("/dashboard", { replace: true });
      } else {
        // Usuário logado em outra escola
        toast.error("Você não pertence a esta instituição.");
        supabase.auth.signOut();
      }
    }
  }, [isAuthenticated, schoolUser, tenant, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!tenant) {
      toast.error("Instituição não encontrada");
      return;
    }

    // Verificar se escola está bloqueada
    if (tenant.blocked_at || tenant.status !== "ativo") {
      toast.error("Esta instituição está temporariamente indisponível.");
      return;
    }
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setLoading(true);
    try {
      const { error, requiresMfa } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Após login, validar se usuário pertence a ESTE tenant
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const belongsToTenant = await validateUserForTenant(authUser.id, tenant.id);
        if (!belongsToTenant) {
          await supabase.auth.signOut();
          toast.error("Você não possui acesso a esta instituição.");
          return;
        }
      }

      if (requiresMfa) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        if (factorsData?.totp && factorsData.totp.length > 0) {
          const verifiedFactor = factorsData.totp.find(f => f.status === "verified");
          if (verifiedFactor) {
            setMfaFactorId(verifiedFactor.id);
            setMfaRequired(true);
          }
        }
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast.error("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mfaCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }

    setMfaVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      if (error.message?.includes("Invalid")) {
        toast.error("Código inválido. Tente novamente.");
      } else {
        toast.error(error.message || "Erro na verificação");
      }
      setMfaCode("");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    setMfaRequired(false);
    setMfaFactorId("");
    setMfaCode("");
    setPassword("");
  };

  // Loading state
  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-blue-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tenant não encontrado (slug inválido ou domínio não configurado)
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Instituição não encontrada</h1>
          <p className="text-gray-600 mb-6">
            {isCustomDomain 
              ? `O domínio "${customDomain}" não está configurado para nenhuma instituição.`
              : "O endereço que você tentou acessar não corresponde a nenhuma instituição cadastrada."
            }
          </p>
          {!isCustomDomain && (
            <Button 
              onClick={() => navigate("/login-escola")}
              variant="outline"
              className="w-full"
            >
              Ir para o login padrão
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // Escola bloqueada
  if (tenant.blocked_at || tenant.status !== "ativo") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tenant.nome}</h1>
          <p className="text-gray-600 mb-6">
            Esta instituição está temporariamente indisponível. Entre em contato com a administração.
          </p>
        </motion.div>
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={brandStyles}>
        <div 
          className="absolute inset-0" 
          style={{ 
            background: `linear-gradient(135deg, ${tenant.primary_color}15 0%, ${tenant.secondary_color}10 100%)` 
          }} 
        />
        <div 
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 animate-pulse"
          style={{ background: `linear-gradient(135deg, ${tenant.primary_color}40, ${tenant.secondary_color}30)` }}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div 
                className="p-4 rounded-full shadow-lg"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})` }}
              >
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificação em Duas Etapas</h1>
              <p className="text-gray-600 text-sm">
                Digite o código de 6 dígitos do seu app autenticador
              </p>
            </div>

            <form onSubmit={handleMFAVerify} className="space-y-6">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.75em] font-mono h-16 bg-white/80 border-gray-200 rounded-xl"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={mfaVerifying}
              />

              <Button 
                type="submit" 
                disabled={mfaVerifying || mfaCode.length !== 6}
                className="w-full h-12 text-white font-semibold rounded-xl shadow-lg"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})` }}
              >
                {mfaVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-gray-600"
                onClick={handleBackToLogin}
                disabled={mfaVerifying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Login Form com Branding Dinâmico
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={brandStyles}>
      {/* Background dinâmico baseado nas cores do tenant */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: `linear-gradient(135deg, ${tenant.primary_color}15 0%, ${tenant.secondary_color}10 50%, white 100%)` 
        }} 
      />
      
      {/* Floating gradient blobs com cores do tenant */}
      <div 
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 animate-pulse"
        style={{ background: `linear-gradient(135deg, ${tenant.primary_color}40, ${tenant.secondary_color}30)` }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl translate-x-1/4 translate-y-1/4"
        style={{ background: `linear-gradient(225deg, ${tenant.secondary_color}50, ${tenant.primary_color}40)` }}
      />

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 md:p-10">
          {/* Logo do Tenant */}
          <div className="flex justify-center mb-6">
            {tenant.logo_url ? (
              <div className="relative h-28 w-28">
                {!logoLoaded && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse border-4 border-white" />
                )}
                <img 
                  src={tenant.logo_url} 
                  alt={tenant.nome} 
                  className={`h-28 w-28 object-contain rounded-full shadow-lg border-4 border-white transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLogoLoaded(true)}
                  loading="eager"
                />
              </div>
            ) : (
              <div 
                className="h-28 w-28 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
                style={{ background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})` }}
              >
                <BookOpen className="h-14 w-14 text-white" />
              </div>
            )}
          </div>

          {/* Title com nome do tenant */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{tenant.nome}</h1>
            <p className="text-gray-600">Portal do Colaborador</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Digite seu email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent ${errors.email ? "border-red-400" : ""}`}
                style={{ "--tw-ring-color": tenant.primary_color } as React.CSSProperties}
                disabled={loading} 
                autoComplete="email" 
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite sua senha" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:border-transparent pr-12 ${errors.password ? "border-red-400" : ""}`}
                  style={{ "--tw-ring-color": tenant.primary_color } as React.CSSProperties}
                  disabled={loading} 
                  autoComplete="current-password" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-transparent" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
              style={{ 
                background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.secondary_color})`,
                boxShadow: `0 10px 25px -5px ${tenant.primary_color}50`
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sistema de Gestão - {tenant.nome}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginEscolaDinamico;
