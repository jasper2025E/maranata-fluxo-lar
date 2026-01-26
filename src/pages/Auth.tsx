import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformBranding, usePlatformAnnouncements } from "@/hooks/usePlatformBranding";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { AnnouncementBanner } from "@/components/landing/AnnouncementBanner";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const Auth = () => {
  const navigate = useNavigate();
  const { data: branding, isLoading: brandingLoading } = usePlatformBranding();
  const { data: announcements = [] } = usePlatformAnnouncements("login");
  const {
    user,
    loading: authLoading,
    isPlatformAdmin
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // Platform branding
  const platformName = branding?.platformName || "Sistema de Gestão";

  // Redirect if already authenticated - route based on role
  useEffect(() => {
    if (user && !authLoading) {
      if (isPlatformAdmin()) {
        navigate("/platform", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, isPlatformAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
      } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message || "Erro ao fazer login");
        }
        return;
      }

      if (data.session === null && data.user === null) {
        toast.error("Erro inesperado no login");
        return;
      }

      // Check for MFA factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (!factorsError && factorsData.totp.length > 0) {
        const verifiedFactors = factorsData.totp.filter(f => f.status === "verified");
        if (verifiedFactors.length > 0) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
            setMfaFactorId(verifiedFactors[0].id);
            setMfaRequired(true);
            return;
          }
        }
      }

      toast.success("Login realizado com sucesso!");
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
    } catch (error: any) {
      console.error("MFA verification error:", error);
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

  if (authLoading || brandingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <GradientBackground
          gradientFrom={branding?.gradientFrom}
          gradientVia={branding?.gradientVia}
          gradientTo={branding?.gradientTo}
        />
        <Loader2 className="h-8 w-8 animate-spin text-white relative z-10" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Dynamic Gradient Background */}
        <div className="fixed inset-0 z-0">
          <GradientBackground
            gradientFrom={branding?.gradientFrom}
            gradientVia={branding?.gradientVia}
            gradientTo={branding?.gradientTo}
          />
        </div>
        
        {/* Header */}
        <header className="relative z-10 p-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            {branding?.platformLogo ? (
              <img src={branding.platformLogo} alt={platformName} className="h-7 w-auto" />
            ) : (
              <GraduationCap className="h-7 w-7 text-white" />
            )}
            <span className="text-xl font-bold text-white">{platformName}</span>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-foreground text-center mb-2">
                  Verificação em Duas Etapas
                </h1>
                <p className="text-muted-foreground text-center text-sm mb-8">
                  Digite o código de 6 dígitos do seu app autenticador
                </p>

                <form onSubmit={handleMFAVerify} className="space-y-6">
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-3xl tracking-[0.5em] font-mono h-14 border-border"
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    disabled={mfaVerifying}
                  />

                  <Button 
                    type="submit" 
                    disabled={mfaVerifying || mfaCode.length !== 6}
                    className="w-full h-11 font-medium"
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
                    className="w-full text-muted-foreground"
                    onClick={handleBackToLogin}
                    disabled={mfaVerifying}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-4 flex-shrink-0 text-center text-white/70 text-sm">
          © {new Date().getFullYear()} {platformName}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Dynamic Gradient Background */}
      <div className="fixed inset-0 z-0">
        <GradientBackground
          gradientFrom={branding?.gradientFrom}
          gradientVia={branding?.gradientVia}
          gradientTo={branding?.gradientTo}
        />
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="relative z-10 px-6 pt-6 max-w-md mx-auto w-full flex-shrink-0">
          <AnnouncementBanner announcements={announcements} />
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Glassmorphic Card - Premium Style */}
          <div className="backdrop-blur-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="p-8 sm:p-10">
              {/* Logo */}
              <div className="flex justify-center mb-10">
                {branding?.platformLogo ? (
                  <img src={branding.platformLogo} alt={platformName} className="h-14 w-auto drop-shadow-lg" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm">
                      <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">{platformName}</span>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  {branding?.loginTitle || "Bem-vindo de volta"}
                </h1>
                <p className="text-white/60 text-sm mt-2">
                  Entre com suas credenciais para continuar
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="seuemail@exemplo.com"
                    className={`h-12 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 transition-all duration-200 hover:border-white/30 focus:bg-white/10 focus:border-white/40 focus:ring-0 focus:outline-none shadow-inner ${errors.email ? "border-red-400/60" : ""}`} 
                    disabled={loading} 
                    autoComplete="email" 
                  />
                  {errors.email && <p className="text-xs text-red-300/90 mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••"
                      className={`h-12 pr-11 rounded-xl bg-white/5 border border-white/20 text-white placeholder:text-white/30 transition-all duration-200 hover:border-white/30 focus:bg-white/10 focus:border-white/40 focus:ring-0 focus:outline-none shadow-inner ${errors.password ? "border-red-400/60" : ""}`} 
                      disabled={loading} 
                      autoComplete="current-password" 
                    />
                    <button 
                      type="button" 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-300/90 mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary rounded"
                    />
                    <Label htmlFor="remember" className="text-sm text-white/60 font-normal cursor-pointer">
                      Lembrar-me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                    onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 font-semibold text-base rounded-xl bg-white text-slate-900 hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl mt-3"
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

              {/* Divider */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs text-white/40 uppercase tracking-wider">ou continue com</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-14 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200"
                  onClick={() => toast.info("Login com Google em desenvolvimento")}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-14 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200"
                  onClick={() => toast.info("Login com GitHub em desenvolvimento")}
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-14 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-200"
                  onClick={() => toast.info("Login com Facebook em desenvolvimento")}
                >
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>
              </div>

              {/* Register Link */}
              <p className="text-sm text-center text-white/50 mt-8">
                Não tem uma conta?{" "}
                <Link to="/cadastro" className="text-white/90 hover:text-white font-medium transition-colors">
                  Cadastre-se grátis
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          {branding?.privacyTermsUrl && (
            <div className="mt-6 text-center">
              <a 
                href={branding.privacyTermsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-white hover:underline transition-colors"
              >
                Privacidade e termos
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Auth;
