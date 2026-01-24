import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Shield, ShieldCheck, ArrowLeft, Settings2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});

const LoginGestor = () => {
  const navigate = useNavigate();
  const { user, manager, loading: authLoading, signIn, isAuthenticated } = usePlatformAuth();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // Get MFA factor
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // MFA Verification Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Verificação em Duas Etapas</h1>
              <p className="text-slate-400 text-sm">
                Digite o código de 6 dígitos do seu app autenticador
              </p>
            </div>

            <form onSubmit={handleMFAVerify} className="space-y-6">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.75em] font-mono h-16 bg-slate-800 border-slate-700 text-white rounded-xl"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                disabled={mfaVerifying}
              />

              <Button 
                type="submit" 
                disabled={mfaVerifying || mfaCode.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl"
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
                className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Settings2 className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Painel de Gestão</h1>
            <p className="text-slate-400 text-sm">
              Acesso exclusivo para gestores do sistema
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Área restrita e monitorada</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium">
                Email
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="gestor@empresa.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className={`h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? "border-red-500" : ""}`}
                disabled={loading} 
                autoComplete="email" 
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`h-12 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-12 ${errors.password ? "border-red-500" : ""}`}
                  disabled={loading} 
                  autoComplete="current-password" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Acessar Painel"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              Este é o portal exclusivo para gestores do sistema.<br/>
              Usuários de escola devem acessar por outro portal.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginGestor;
