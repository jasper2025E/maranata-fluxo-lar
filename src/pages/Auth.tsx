import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, GraduationCap } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { GradientBackground } from "@/components/landing/GradientBackground";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

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
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
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
      const {
        data: factorsData,
        error: factorsError
      } = await supabase.auth.mfa.listFactors();
      if (!factorsError && factorsData.totp.length > 0) {
        const verifiedFactors = factorsData.totp.filter(f => f.status === "verified");
        if (verifiedFactors.length > 0) {
          const {
            data: aalData
          } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
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
      const {
        data: challengeData,
        error: challengeError
      } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId
      });
      if (challengeError) throw challengeError;
      const {
        error: verifyError
      } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <GradientBackground />
        <Loader2 className="h-8 w-8 animate-spin text-white relative z-10" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-x-hidden">
        <div className="fixed inset-0 z-0">
          <GradientBackground />
        </div>
        
        <header className="relative z-10 p-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-white" />
            <span className="text-xl font-bold text-white">Escola Maranata</span>
          </div>
        </header>

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
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                    placeholder="000000" 
                    className="text-center text-3xl tracking-[0.5em] font-mono h-14 border-border" 
                    maxLength={6} 
                    autoFocus 
                    autoComplete="one-time-code" 
                    inputMode="numeric" 
                    disabled={mfaVerifying} 
                  />

                  <Button type="submit" disabled={mfaVerifying || mfaCode.length !== 6} className="w-full h-11 font-medium">
                    {mfaVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : "Verificar"}
                  </Button>

                  <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={handleBackToLogin} disabled={mfaVerifying}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao login
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 py-4 flex-shrink-0 text-center text-white/70 text-sm">
          © {new Date().getFullYear()} Escola Maranata
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 z-0">
        <GradientBackground />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10">
              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-4">
                  <GraduationCap className="h-14 w-14 text-white" />
                  <span className="text-3xl font-bold text-white">Escola Maranata</span>
                </div>
              </div>

              <h1 className="text-white mb-6 text-center font-mono font-light text-lg mx-px">
                Entrar no Sistema
              </h1>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                    E-mail
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="seuemail@exemplo.com" 
                    className={`h-12 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/40 transition-all duration-500 ease-out focus:bg-white/10 focus:border-white/60 focus:shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:ring-0 focus:outline-none hover:border-white/40 hover:bg-white/[0.07] ${errors.email ? "border-red-400" : ""}`} 
                    disabled={loading} 
                    autoComplete="email" 
                  />
                  {errors.email && <p className="text-xs text-red-300">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className={`h-12 pr-10 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/40 transition-all duration-500 ease-out focus:bg-white/10 focus:border-white/60 focus:shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:ring-0 focus:outline-none hover:border-white/40 hover:bg-white/[0.07] ${errors.password ? "border-red-400" : ""}`} 
                      disabled={loading} 
                      autoComplete="current-password" 
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-300">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe} 
                      onCheckedChange={checked => setRememberMe(checked as boolean)} 
                      className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-primary" 
                    />
                    <Label htmlFor="remember" className="text-sm text-white/80 font-normal cursor-pointer">
                      Lembrar
                    </Label>
                  </div>
                  <button 
                    type="button" 
                    className="text-sm text-white/80 hover:text-white hover:underline" 
                    onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 font-medium text-base rounded-lg bg-slate-800 hover:bg-slate-700 text-white mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : "Entrar"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
