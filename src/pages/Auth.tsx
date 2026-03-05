import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft, GraduationCap, Headphones, MessageCircle, Instagram, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import loginBg from "@/assets/login-bg.jpg";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const Auth = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
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

  // Fetch school branding
  const { data: escola } = useQuery({
    queryKey: ["escola-branding"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_escola_public_info").maybeSingle();
      if (error) {
        console.error("Error fetching escola branding:", error);
        return null;
      }
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const schoolName = escola?.nome || "Escola Maranata";
  const schoolLogo = escola?.logo_url;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
        const verifiedFactors = factorsData.totp.filter((f) => f.status === "verified");
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
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Already authenticated
  if (user) {
    const from = (location.state as any)?.from;
    const to = from?.pathname ? `${from.pathname}${from.search || ""}${from.hash || ""}` : "/dashboard";
    return <Navigate to={to} replace />;
  }

  // MFA Screen
  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-2">
            Verificação em Duas Etapas
          </h1>
          <p className="text-white/50 text-center text-sm mb-8">
            Digite o código de 6 dígitos do seu app autenticador
          </p>

          <form onSubmit={handleMFAVerify} className="space-y-6">
            <Input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl tracking-[0.5em] font-mono h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              disabled={mfaVerifying}
            />

            <Button
              type="submit"
              disabled={mfaVerifying || mfaCode.length !== 6}
              className="w-full h-12 font-semibold text-base rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, hsl(280 70% 50%) 0%, hsl(340 80% 58%) 50%, hsl(30 90% 60%) 100%)",
              }}
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

            <Button type="button" variant="ghost" className="w-full text-white/50 hover:text-white hover:bg-white/5" onClick={handleBackToLogin} disabled={mfaVerifying}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Main Login Screen
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-between bg-[#0a0a0f] px-8 sm:px-12 lg:px-16 py-8 min-h-screen lg:min-h-0 lg:max-w-[55%]">
        {/* Logo */}
        <div className="mb-8 lg:mb-0" />

        {/* Form centered */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px]">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-12 tracking-tight">
              Faça seu Login<span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, hsl(280 70% 50%), hsl(340 80% 58%), hsl(30 90% 60%))" }}>.</span>
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className={`h-14 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 transition-all focus:bg-white/[0.08] focus:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.email ? "border-red-400/60" : ""}`}
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70 text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className={`h-14 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 transition-all focus:bg-white/[0.08] focus:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.password ? "border-red-400/60" : ""}`}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4 transition-colors">
                  Esqueci minha senha
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 font-semibold text-lg rounded-full text-white border-0 mt-4"
                style={{
                  background: "linear-gradient(135deg, hsl(280 70% 50%) 0%, hsl(340 80% 58%) 50%, hsl(30 90% 60%) 100%)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} {schoolName}
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors">
                <Headphones className="h-4 w-4" />
                Suporte
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 bg-[#1a1a2e] border-white/10" align="end">
              <div className="flex flex-col gap-1">
                <a
                  href="https://wa.me/5598981384957"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/mendysvictor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href="mailto:victordbvtey@outlook.com"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  E-mail
                </a>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block flex-1 relative">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for smooth transition */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, #0a0a0f 0%, transparent 30%)",
          }}
        />
      </div>
    </div>
  );
};

export default Auth;
