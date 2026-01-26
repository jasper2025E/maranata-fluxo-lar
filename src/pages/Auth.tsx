import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowLeft,
  GraduationCap,
  Users,
  BarChart3,
  CreditCard,
  Shield,
  CheckCircle2
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const features = [
  { icon: GraduationCap, title: "Gestão Escolar Completa", description: "Alunos, turmas, cursos e matrículas" },
  { icon: CreditCard, title: "Financeiro Integrado", description: "Faturas, cobranças e relatórios" },
  { icon: Users, title: "RH e Funcionários", description: "Folha de pagamento e ponto eletrônico" },
  { icon: BarChart3, title: "Relatórios Avançados", description: "Dashboards e projeções financeiras" },
  { icon: Shield, title: "Segurança Total", description: "Multi-tenant com isolamento de dados" },
];

const Auth = () => {
  const navigate = useNavigate();
  const { data: platformSettings, isLoading: platformLoading } = usePlatformSettings();
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
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // Platform branding
  const platformName = platformSettings?.platform_name || "Sistema de Gestão";

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
      // Redirect based on role will happen via useEffect
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
      // Redirect will happen via useEffect
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

  if (authLoading || platformLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Verificação em Duas Etapas</h1>
              <p className="text-muted-foreground text-sm">
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
                  className="text-center text-3xl tracking-[0.75em] font-mono h-16"
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
                className="w-full h-12"
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
                className="w-full"
                onClick={handleBackToLogin}
                disabled={mfaVerifying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </form>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Abra seu app autenticador (Google Authenticator, Authy, etc.) 
              e digite o código exibido.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Platform Presentation */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{platformName}</h1>
              <p className="text-sm text-primary-foreground/70">Gestão Escolar Inteligente</p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Simplifique a gestão<br />
              <span className="text-primary-foreground/80">da sua escola</span>
            </h2>
            <p className="text-lg text-primary-foreground/70 max-w-md">
              Uma plataforma completa para gerenciar alunos, finanças, RH e muito mais. 
              Tudo em um só lugar.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-primary-foreground/60">
          <CheckCircle2 className="h-4 w-4" />
          <span>Dados protegidos com criptografia de ponta a ponta</span>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{platformName}</h1>
              <p className="text-xs text-muted-foreground">Gestão Escolar</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`h-12 ${errors.email ? "border-destructive" : ""}`} 
                disabled={loading} 
                autoComplete="email" 
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`h-12 pr-12 ${errors.password ? "border-destructive" : ""}`} 
                  disabled={loading} 
                  autoComplete="current-password" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" 
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
              className="w-full h-12 text-base font-semibold"
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
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {platformName}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
