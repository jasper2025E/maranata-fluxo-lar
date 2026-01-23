import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const escolaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().optional(),
  telefone: z.string().min(10, "Telefone inválido"),
  endereco: z.string().optional(),
});

const adminSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // School data
  const [escola, setEscola] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    endereco: "",
  });
  
  // Admin data
  const [admin, setAdmin] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const result = escolaSchema.safeParse(escola);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const result = adminSchema.safeParse(admin);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Call edge function to create tenant and admin user
      const { data, error } = await supabase.functions.invoke("create-tenant-onboarding", {
        body: {
          escola: {
            nome: escola.nome,
            cnpj: escola.cnpj || null,
            telefone: escola.telefone,
            endereco: escola.endereco || null,
          },
          admin: {
            nome: admin.nome,
            email: admin.email,
            password: admin.password,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStep(3);
      toast.success("Escola cadastrada com sucesso!");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate("/auth");
  };

  const features = [
    { icon: Zap, label: "Gestão completa de alunos" },
    { icon: Shield, label: "Controle financeiro" },
    { icon: Sparkles, label: "Relatórios automáticos" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-pink-50 flex">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Wevessistem</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Sistema de Gestão Escolar Completo
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Gerencie sua escola de forma moderna e eficiente. 
            Comece hoje mesmo com 14 dias grátis.
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-white"
              >
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-lg">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/70">
            <Gift className="h-5 w-5" />
            <span>14 dias de teste grátis, sem cartão de crédito</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: School Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Dados da Escola
                </h2>
                <p className="text-muted-foreground">
                  Informe os dados básicos da sua instituição
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="escola-nome">Nome da Escola *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="escola-nome"
                        placeholder="Ex: Escola Municipal São José"
                        value={escola.nome}
                        onChange={(e) => setEscola({ ...escola, nome: e.target.value })}
                        className={`pl-10 ${errors.nome ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escola-cnpj">CNPJ (opcional)</Label>
                    <Input
                      id="escola-cnpj"
                      placeholder="00.000.000/0001-00"
                      value={escola.cnpj}
                      onChange={(e) => setEscola({ ...escola, cnpj: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escola-telefone">Telefone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="escola-telefone"
                        placeholder="(00) 00000-0000"
                        value={escola.telefone}
                        onChange={(e) => setEscola({ ...escola, telefone: e.target.value })}
                        className={`pl-10 ${errors.telefone ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="escola-endereco">Endereço (opcional)</Label>
                    <Input
                      id="escola-endereco"
                      placeholder="Rua, número, bairro, cidade"
                      value={escola.endereco}
                      onChange={(e) => setEscola({ ...escola, endereco: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleNextStep} className="w-full mt-6">
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem uma conta?{" "}
                <button
                  onClick={handleGoToLogin}
                  className="text-primary hover:underline font-medium"
                >
                  Fazer login
                </button>
              </p>
            </motion.div>
          )}

          {/* Step 2: Admin Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Dados do Administrador
                </h2>
                <p className="text-muted-foreground">
                  Crie sua conta de acesso ao sistema
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-nome">Seu Nome *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-nome"
                        placeholder="Nome completo"
                        value={admin.nome}
                        onChange={(e) => setAdmin({ ...admin, nome: e.target.value })}
                        className={`pl-10 ${errors.nome ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={admin.email}
                        onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                        className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={admin.password}
                        onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                        className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-confirm-password">Confirmar Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="admin-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Digite a senha novamente"
                        value={admin.confirmPassword}
                        onChange={(e) => setAdmin({ ...admin, confirmPassword: e.target.value })}
                        className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleNextStep} 
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          Criar Conta
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Conta Criada com Sucesso!
              </h2>
              <p className="text-muted-foreground mb-8">
                Sua escola <strong>{escola.nome}</strong> foi cadastrada.
                <br />
                Você tem <strong>14 dias de teste grátis</strong> para explorar todas as funcionalidades.
              </p>

              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Gestão completa de alunos e matrículas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Controle financeiro e faturas automáticas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Relatórios e dashboards em tempo real</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Gestão de RH e ponto eletrônico</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleGoToLogin} size="lg" className="w-full">
                Acessar o Sistema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-sm text-muted-foreground mt-4">
                Use o e-mail <strong>{admin.email}</strong> para fazer login
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
