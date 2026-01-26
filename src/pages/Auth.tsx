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
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const Auth = () => {
  const navigate = useNavigate();
  const { data: platformSettings, isLoading: platformLoading } = usePlatformSettings();
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

  if (authLoading || platformLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-pink-400 to-orange-300">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 via-40% via-pink-400 via-60% to-orange-300 to-90%" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 via-transparent to-transparent" />
        
        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-white" />
            <span className="text-xl font-bold text-white">{platformName}</span>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="p-3 rounded-full bg-violet-100">
                    <ShieldCheck className="h-8 w-8 text-violet-600" />
                  </div>
                </div>

                <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
                  Verificação em Duas Etapas
                </h1>
                <p className="text-gray-500 text-center text-sm mb-8">
                  Digite o código de 6 dígitos do seu app autenticador
                </p>

                <form onSubmit={handleMFAVerify} className="space-y-6">
                  <Input
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-3xl tracking-[0.5em] font-mono h-14 border-gray-300"
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    disabled={mfaVerifying}
                  />

                  <Button 
                    type="submit" 
                    disabled={mfaVerifying || mfaCode.length !== 6}
                    className="w-full h-11 bg-violet-500 hover:bg-violet-600 text-white font-medium"
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
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 p-6 text-center text-white/70 text-sm">
          © {new Date().getFullYear()} {platformName}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Gradient Background - Stripe style */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-500 via-40% via-pink-400 via-60% to-orange-300 to-90%" />
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/30 via-transparent to-transparent" />
      
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(at 40% 20%, hsla(280, 80%, 60%, 0.3) 0px, transparent 50%),
                          radial-gradient(at 80% 0%, hsla(340, 80%, 60%, 0.2) 0px, transparent 50%),
                          radial-gradient(at 0% 50%, hsla(200, 80%, 60%, 0.2) 0px, transparent 50%),
                          radial-gradient(at 80% 50%, hsla(30, 80%, 60%, 0.2) 0px, transparent 50%),
                          radial-gradient(at 0% 100%, hsla(280, 80%, 60%, 0.2) 0px, transparent 50%)`
      }} />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-white" />
          <span className="text-xl font-bold text-white">{platformName}</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Form Section */}
            <div className="p-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-8">
                Acesse sua conta
              </h1>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                    E-mail
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className={`h-11 border-gray-300 focus:border-violet-500 focus:ring-violet-500 ${errors.email ? "border-red-400" : ""}`} 
                    disabled={loading} 
                    autoComplete="email" 
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                      Senha
                    </Label>
                    <button
                      type="button"
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                      onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className={`h-11 pr-10 border-gray-300 focus:border-violet-500 focus:ring-violet-500 ${errors.password ? "border-red-400" : ""}`} 
                      disabled={loading} 
                      autoComplete="current-password" 
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600 font-normal cursor-pointer">
                    Lembrar de mim neste dispositivo
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-11 bg-violet-500 hover:bg-violet-600 text-white font-medium"
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
            </div>

            {/* Footer Section */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-center text-gray-600">
                Começando agora?{" "}
                <Link to="/cadastro" className="text-violet-600 hover:text-violet-700 font-medium">
                  Crie uma conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 flex items-center justify-center gap-4 text-white/70 text-sm">
        <span>© {new Date().getFullYear()} {platformName}</span>
        <span>•</span>
        <button className="hover:text-white transition-colors">Privacidade</button>
        <span>•</span>
        <button className="hover:text-white transition-colors">Termos</button>
      </footer>
    </div>
  );
};

export default Auth;
