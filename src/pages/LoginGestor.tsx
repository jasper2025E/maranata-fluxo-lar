import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, Settings2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const LoginGestor = () => {
  const navigate = useNavigate();
  const { loading: authLoading, signIn, isAuthenticated } = usePlatformAuth();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  // Redirect if already authenticated as manager
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/platform", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
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
        toast.error(error.message);
        return;
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

      toast.success("Bem-vindo ao Painel de Gestão!");
      navigate("/platform", { replace: true });
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

      toast.success("Bem-vindo ao Painel de Gestão!");
      navigate("/platform", { replace: true });
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Stripe-style gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-violet-500 to-cyan-400 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-300/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-400/50 via-transparent to-transparent" />

        {/* Header */}
        <header className="relative z-10 p-6">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <Settings2 className="h-6 w-6" />
            <span>Gestor</span>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8"
          >
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-full bg-violet-100">
                <ShieldCheck className="h-8 w-8 text-violet-600" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
              Verificação em Duas Etapas
            </h1>
            <p className="text-gray-500 text-sm text-center mb-6">
              Digite o código de 6 dígitos do seu app autenticador
            </p>

            <form onSubmit={handleMFAVerify} className="space-y-4">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 border-gray-300"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={mfaVerifying}
              />

              <Button 
                type="submit" 
                disabled={mfaVerifying || mfaCode.length !== 6}
                className="w-full h-11 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-md"
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
                className="w-full text-gray-500 hover:text-gray-700"
                onClick={handleBackToLogin}
                disabled={mfaVerifying}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao login
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Stripe-style mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-violet-500 to-cyan-400 opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-300/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-400/50 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-300/40 via-transparent to-transparent" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <Settings2 className="h-6 w-6" />
          <span>Gestor</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Form content */}
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Acesse sua conta
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 text-sm font-normal">
                  E-mail
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className={`h-11 border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 ${errors.email ? "border-red-400" : ""}`}
                  disabled={loading} 
                  autoComplete="email" 
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 text-sm font-normal">
                    Senha
                  </Label>
                  <button 
                    type="button"
                    className="text-sm text-violet-600 hover:text-violet-700 font-normal"
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
                    className={`h-11 border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-violet-500 pr-10 ${errors.password ? "border-red-400" : ""}`}
                    disabled={loading} 
                    autoComplete="current-password" 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-transparent" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
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
                <label 
                  htmlFor="remember" 
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Lembrar de mim neste dispositivo
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-md"
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">OU</span>
              </div>
            </div>

            {/* Alternative login options */}
            <div className="space-y-3">
              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 font-normal hover:bg-gray-50"
                disabled
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com o Google
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 font-normal hover:bg-gray-50"
                disabled
              >
                Fazer login com chave de acesso
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 text-gray-700 font-normal hover:bg-gray-50"
                disabled
              >
                Entrar com SSO
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center">
              Novo por aqui?{" "}
              <a href="/cadastro" className="text-violet-600 hover:text-violet-700">
                Cadastre sua escola
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6">
        <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
          <span>© Gestor</span>
          <a href="#" className="hover:text-white">Privacidade e termos</a>
        </div>
      </footer>
    </div>
  );
};

export default LoginGestor;
