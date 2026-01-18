import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, BookOpen } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres")
});
const Auth = () => {
  const navigate = useNavigate();
  const {
    user,
    signIn,
    loading: authLoading
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

  // Redirect if already authenticated
  if (user && !authLoading) {
    navigate("/dashboard", {
      replace: true
    });
    return null;
  }
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
        error
      } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message || "Erro ao fazer login");
        }
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-blue-100">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-violet-50 to-pink-50" />
      
      {/* Floating gradient blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-400/40 to-blue-400/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-pink-300/50 to-violet-300/40 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-gradient-to-l from-pink-200/60 to-purple-200/40 rounded-full blur-2xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/80 via-violet-100/60 to-white/80 rounded-3xl blur-xl" />
        
        <div className="relative bg-gradient-to-br from-pink-50/90 via-white/95 to-violet-50/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 md:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {escolaLoading ? (
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse border-4 border-white shadow-lg" />
            ) : logoUrl ? (
              <div className="relative h-28 w-28">
                {!logoLoaded && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse border-4 border-white" />
                )}
                <img 
                  src={logoUrl} 
                  alt={escolaNome} 
                  className={`h-28 w-28 object-contain rounded-full shadow-lg border-4 border-white transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLogoLoaded(true)}
                  loading="eager"
                />
              </div>
            ) : (
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg border-4 border-white">
                <BookOpen className="h-14 w-14 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo</h1>
            <p className="text-gray-600">Entre com email e senha</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Digite seu email" value={email} onChange={e => setEmail(e.target.value)} className={`h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-violet-400 ${errors.email ? "border-red-400" : ""}`} disabled={loading} autoComplete="email" />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} className={`h-12 bg-white/80 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-400 focus:border-violet-400 pr-12 ${errors.password ? "border-red-400" : ""}`} disabled={loading} autoComplete="current-password" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-600 hover:from-violet-600 hover:via-purple-600 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40">
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </> : "Entrar"}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Sistema de Gestão Escolar {escolaNome}
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;