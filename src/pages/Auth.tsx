import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, BookOpen, ShieldCheck, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const Auth = () => {
  const navigate = useNavigate();
  const {
    user,
    signIn,
    loading: authLoading,
    isPlatformAdmin
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [escolaNome, setEscolaNome] = useState("Escola");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [escolaLoading, setEscolaLoading] = useState(true);
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // Fetch escola info using secure RPC function
  useEffect(() => {
    const fetchEscola = async () => {
      try {
        const { data, error } = await supabase.rpc("get_escola_public_info");
        if (!error && data && data.length > 0) {
          setEscolaNome(data[0].nome);
          setLogoUrl(data[0].logo_url);
        }
      } finally {
        setEscolaLoading(false);
      }
    };
    fetchEscola();
  }, []);

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
      // Use signInWithPassword directly to check for MFA
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

      // Check if MFA is required
      if (data.session === null && data.user === null) {
        // This shouldn't happen with current Supabase, but handle just in case
        toast.error("Erro inesperado no login");
        return;
      }

      // Check for MFA factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (!factorsError && factorsData.totp.length > 0) {
        const verifiedFactors = factorsData.totp.filter(f => f.status === "verified");
        if (verifiedFactors.length > 0) {
          // MFA is required - get the assurance level
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (aalData && aalData.currentLevel === "aal1" && aalData.nextLevel === "aal2") {
            // Need to verify MFA
            setMfaFactorId(verifiedFactors[0].id);
            setMfaRequired(true);
            return;
          }
        }
      }

      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
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
      navigate("/dashboard");
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
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>;
  }
  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-violet-50 to-pink-50" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-400/40 to-blue-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-pink-300/50 to-violet-300/40 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100/80 via-violet-100/60 to-white/80 rounded-3xl blur-xl" />
          
          <div className="relative bg-gradient-to-br from-pink-50/90 via-white/95 to-violet-50/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 shadow-lg">
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
              <div className="space-y-2">
                <Label htmlFor="mfa-code" className="sr-only">
                  Código de verificação
                </Label>
                <Input
                  id="mfa-code"
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
              </div>

              <Button 
                type="submit" 
                disabled={mfaVerifying || mfaCode.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-600 hover:via-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30"
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

            <p className="mt-6 text-xs text-center text-gray-500">
              Abra seu app autenticador (Google Authenticator, Authy, etc.) 
              e digite o código exibido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Bom dia", emoji: "☀️" };
    if (hour >= 12 && hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
    return { text: "Boa noite", emoji: "🌙" };
  };

  const greeting = getGreeting();

  return (
    <div className="min-h-screen flex">
      {/* Netflix-style Hero Banner - Left Side */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-blue-600/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-r from-pink-500/20 to-rose-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Greeting Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8 w-fit"
          >
            <span className="text-lg">{greeting.emoji}</span>
            <span>{greeting.text}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6"
          >
            Gestão Escolar
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Simplificada
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg xl:text-xl text-white/70 max-w-md mb-10 leading-relaxed"
          >
            Controle financeiro, matrículas, faturas e muito mais em uma única plataforma intuitiva.
          </motion.p>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            {[
              "Dashboard financeiro em tempo real",
              "Gestão de alunos e responsáveis",
              "Faturas e cobranças automatizadas",
              "Relatórios e análises detalhadas",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                <span className="text-sm xl:text-base">{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>

      {/* Login Form - Right Side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative bg-gradient-to-br from-slate-50 via-violet-50/30 to-white">
        {/* Mobile greeting banner */}
        <div className="lg:hidden absolute top-0 left-0 right-0 py-4 px-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{greeting.emoji}</span>
            <span>{greeting.text}! Bem-vindo ao Sistema de Gestão Escolar</span>
          </div>
        </div>

        <div className="w-full max-w-md lg:mt-0 mt-16">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            {escolaLoading ? (
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse shadow-lg" />
            ) : logoUrl ? (
              <div className="relative h-24 w-24">
                {!logoLoaded && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                )}
                <img 
                  src={logoUrl} 
                  alt={escolaNome} 
                  className={`h-24 w-24 object-contain rounded-2xl shadow-lg transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLogoLoaded(true)}
                  loading="eager"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesse sua conta</h1>
            <p className="text-muted-foreground text-sm">{escolaNome}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium text-sm">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Digite seu email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`h-12 bg-background border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${errors.email ? "border-destructive" : ""}`} 
                disabled={loading} 
                autoComplete="email" 
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium text-sm">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Digite sua senha" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`h-12 bg-background border-border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 pr-12 ${errors.password ? "border-destructive" : ""}`} 
                  disabled={loading} 
                  autoComplete="current-password" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30"
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
            <p className="text-xs text-muted-foreground">
              Sistema de Gestão Escolar • Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Auth;