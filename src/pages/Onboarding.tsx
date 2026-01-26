import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
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
  Gift,
  Crown,
  GraduationCap,
  Check,
  Users,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

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

type Step = 1 | 2 | 3 | 4;

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular: boolean;
  color: string;
  icon: string;
  limite_alunos: number | null;
  limite_usuarios: number | null;
}

const iconMap: Record<string, React.ElementType> = {
  Zap,
  Sparkles,
  Crown,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { data: platformSettings } = usePlatformSettings();
  const platformName = platformSettings?.platform_name || "Sistema de Gestão";
  
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");
  
  // Fetch plans from database
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["subscription-plans-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as Plan[];
    },
  });
  
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

  const validateStep3 = () => {
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
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
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
          plan: selectedPlan,
          planLimits: {
            limite_alunos: selectedPlanData?.limite_alunos || 50,
            limite_usuarios: selectedPlanData?.limite_usuarios || 3,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStep(4);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price / 100);
  };

  const features = [
    { icon: GraduationCap, label: "Gestão completa de alunos" },
    { icon: CreditCard, label: "Controle financeiro" },
    { icon: Users, label: "Gestão de RH" },
    { icon: Shield, label: "Dados protegidos" },
  ];

  const stepLabels = ["Escola", "Plano", "Admin", "Pronto"];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{platformName}</h1>
              <p className="text-sm text-primary-foreground/70">Gestão Escolar Inteligente</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Comece agora com<br />
            <span className="text-primary-foreground/80">14 dias grátis</span>
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-md">
            Cadastre sua escola em minutos e tenha acesso completo a todas as funcionalidades durante o período de teste.
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
              >
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-primary-foreground/60">
          <Gift className="h-5 w-5" />
          <span>Sem cartão de crédito • Cancele quando quiser</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-xl">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">{platformName}</span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {stepLabels.map((label, index) => {
              const s = index + 1;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        step >= s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s ? <CheckCircle className="h-4 w-4" /> : s}
                    </div>
                    <span className={`text-xs mt-1 ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-8 sm:w-12 h-0.5 mx-1 rounded ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: School Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
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

            {/* Step 2: Plan Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Escolha seu Plano
                  </h2>
                  <p className="text-muted-foreground">
                    Todos os planos incluem 14 dias de teste grátis
                  </p>
                </div>

                {plansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => {
                      const IconComponent = iconMap[plan.icon] || Zap;
                      const isSelected = selectedPlan === plan.id;
                      
                      return (
                        <Card
                          key={plan.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? "ring-2 ring-primary border-primary"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}
                              >
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                                  {plan.popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-baseline gap-1 mb-2">
                                  <span className="text-2xl font-bold text-foreground">
                                    {formatPrice(plan.price)}
                                  </span>
                                  <span className="text-muted-foreground text-sm">/mês</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                  <span>
                                    {plan.limite_alunos ? `Até ${plan.limite_alunos} alunos` : "Alunos ilimitados"}
                                  </span>
                                  <span>
                                    {plan.limite_usuarios ? `Até ${plan.limite_usuarios} usuários` : "Usuários ilimitados"}
                                  </span>
                                </div>
                              </div>
                              
                              <div
                                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleNextStep} className="flex-1">
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Você pode mudar de plano a qualquer momento
                </p>
              </motion.div>
            )}

            {/* Step 3: Admin Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
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
                        onClick={() => setStep(2)}
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

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
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

                <Card className="mb-6 text-left">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">O que você pode fazer agora:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm">Cadastrar seus primeiros alunos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm">Configurar cursos e turmas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm">Gerar faturas e controlar finanças</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm">Explorar relatórios e dashboards</span>
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
