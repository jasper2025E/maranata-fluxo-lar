import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle, Loader2, Sparkles, Shield, Zap, Gift, Crown, GraduationCap, Check, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";
import { OnboardingCardForm } from "@/components/onboarding/OnboardingCardForm";
const escolaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().optional(),
  telefone: z.string().min(10, "Telefone inválido"),
  endereco: z.string().optional()
});
const adminSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});
type Step = 1 | 2 | 3 | 4 | 5;
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
  Crown
};
export default function Onboarding() {
  const navigate = useNavigate();
  const {
    data: branding
  } = usePlatformBranding();
  const platformName = branding?.platformName || "Sistema de Gestão";
  const platformLogo = branding?.platformLogo;
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");

  // Fetch plans from database
  const {
    data: plans = [],
    isLoading: plansLoading
  } = useQuery({
    queryKey: ["subscription-plans-onboarding"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("subscription_plans").select("*").eq("active", true).order("display_order");
      if (error) throw error;
      return data as Plan[];
    }
  });

  // School data
  const [escola, setEscola] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    endereco: ""
  });

  // Admin data
  const [admin, setAdmin] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const validateStep1 = () => {
    const result = escolaSchema.safeParse(escola);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
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
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };
  // State for SetupIntent flow (card verification without charge)
  const [setupIntentSecret, setSetupIntentSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      // Create tenant first, then go to card step
      handleCreateTenant();
    }
  };

  // Step 1: Create tenant and get SetupIntent for card verification (no charge)
  const handleCreateTenant = async () => {
    setLoading(true);
    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const {
        data,
        error
      } = await supabase.functions.invoke("create-tenant-onboarding", {
        body: {
          escola: {
            nome: escola.nome,
            cnpj: escola.cnpj || null,
            telefone: escola.telefone,
            endereco: escola.endereco || null
          },
          admin: {
            nome: admin.nome,
            email: admin.email,
            password: admin.password
          },
          plan: selectedPlan,
          planLimits: {
            limite_alunos: selectedPlanData?.limite_alunos || 50,
            limite_usuarios: selectedPlanData?.limite_usuarios || 3
          }
        }
      });
      if (error) {
        // Handle FunctionsHttpError - extract message from response body
        if (error.name === "FunctionsHttpError") {
          const errorBody = await error.context?.json?.();
          const errorMessage = errorBody?.error || "Erro ao criar conta. Tente novamente.";
          throw new Error(errorMessage);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      // Save SetupIntent secret and tenant ID for card form
      setSetupIntentSecret(data.setup_intent_client_secret);
      setSetupIntentId(data.setup_intent_id);
      setTenantId(data.tenant_id);
      setStripePublishableKey(data.stripe_publishable_key || null);
      setStep(4);
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Card verified successfully (no charge)
  const handleCardSuccess = () => {
    setStep(5);
    toast.success("Cartão verificado com sucesso! Nenhuma cobrança foi realizada agora.");
  };
  const handleGoToLogin = () => {
    navigate("/auth");
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price / 100);
  };
  const features = [{
    icon: GraduationCap,
    label: "Gestão completa de alunos"
  }, {
    icon: CreditCard,
    label: "Controle financeiro"
  }, {
    icon: Users,
    label: "Gestão de RH"
  }, {
    icon: Shield,
    label: "Dados protegidos"
  }];
  const stepLabels = ["Escola", "Plano", "Admin", "Cartão", "Pronto"];
  return <div className="min-h-screen relative overflow-x-hidden">
      {/* Stripe-style gradient background - fixed */}
      <div className="fixed inset-0 z-0">
        {/* Main gradient blob - top left */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <svg viewBox="0 0 1200 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="onboarding-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#80e9ff" />
                <stop offset="20%" stopColor="#a855f7" />
                <stop offset="40%" stopColor="#ec4899" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="80%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#80e9ff" />
              </linearGradient>
            </defs>
            <path d="M0,0 L600,0 Q800,100 700,300 Q600,500 400,450 Q200,400 150,550 Q100,700 0,800 Z" fill="url(#onboarding-gradient)" opacity="0.85" />
          </svg>
        </div>

        {/* Secondary gradient - bottom right */}
        <div className="absolute bottom-0 right-0 w-[60%] h-[60%] pointer-events-none">
          <svg viewBox="0 0 600 600" className="w-full h-full" preserveAspectRatio="xMaxYMax slice">
            <defs>
              <linearGradient id="onboarding-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path d="M600,600 L600,200 Q500,300 400,350 Q300,400 350,500 Q400,600 200,600 Z" fill="url(#onboarding-gradient-2)" opacity="0.6" />
          </svg>
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                             linear-gradient(to bottom, #000 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

        {/* White overlay for readability */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
      </div>

      {/* Logo - Fixed top right */}
      <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20 flex flex-row items-center gap-3">
        <span className="text-xl font-bold text-slate-900">{platformName}</span>
        {platformLogo ? (
          <img src={platformLogo} alt={platformName} className="h-10 w-auto object-contain" />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-xl">
          
          <AnimatePresence mode="wait">
            {/* Step 1: School Info */}
            {step === 1 && (
              <motion.div 
                key="step1" 
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Shopify-style card */}
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">
                      Dados da escola
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Informações básicas da sua instituição
                    </p>
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="escola-nome" className="text-sm font-medium">
                        Nome da escola
                      </Label>
                      <Input 
                        id="escola-nome" 
                        placeholder="Ex: Escola Municipal São José" 
                        value={escola.nome} 
                        onChange={e => setEscola({ ...escola, nome: e.target.value })} 
                        className={`h-10 ${errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="escola-cnpj" className="text-sm font-medium">
                          CNPJ
                          <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
                        </Label>
                        <Input 
                          id="escola-cnpj" 
                          placeholder="00.000.000/0001-00" 
                          value={escola.cnpj} 
                          onChange={e => setEscola({ ...escola, cnpj: e.target.value })}
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="escola-telefone" className="text-sm font-medium">
                          Telefone
                        </Label>
                        <Input 
                          id="escola-telefone" 
                          placeholder="(00) 00000-0000" 
                          value={escola.telefone} 
                          onChange={e => setEscola({ ...escola, telefone: e.target.value })} 
                          className={`h-10 ${errors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="escola-endereco" className="text-sm font-medium">
                        Endereço
                        <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
                      </Label>
                      <Input 
                        id="escola-endereco" 
                        placeholder="Rua, número, bairro, cidade" 
                        value={escola.endereco} 
                        onChange={e => setEscola({ ...escola, endereco: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 py-4 bg-muted/30 border-t border-border">
                    <Button onClick={handleNextStep} className="w-full h-10">
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Já tem uma conta?{" "}
                  <button onClick={handleGoToLogin} className="text-primary hover:underline font-medium">
                    Fazer login
                  </button>
                </p>
              </motion.div>
            )}

            {/* Step 2: Plan Selection */}
            {step === 2 && <motion.div key="step2" initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Escolha seu Plano
                  </h2>
                  <p className="text-slate-600">
                    Todos os planos incluem 14 dias de teste grátis
                  </p>
                </div>

                {plansLoading ? <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div> : <div className="space-y-4">
                    {plans.map(plan => {
                const IconComponent = iconMap[plan.icon] || Zap;
                const isSelected = selectedPlan === plan.id;
                return <div key={plan.id} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary border-primary shadow-md" : "border-slate-200 hover:border-primary/50"}`} onClick={() => setSelectedPlan(plan.id)}>
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center shrink-0`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                                {plan.popular && <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>}
                              </div>
                              
                              <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-2xl font-bold text-slate-900">
                                  {formatPrice(plan.price)}
                                </span>
                                <span className="text-slate-500 text-sm">/mês</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span>
                                  {plan.limite_alunos ? `Até ${plan.limite_alunos} alunos` : "Alunos ilimitados"}
                                </span>
                                <span>
                                  {plan.limite_usuarios ? `Até ${plan.limite_usuarios} usuários` : "Usuários ilimitados"}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-slate-300"}`}>
                              {isSelected && <Check className="h-4 w-4 text-white" />}
                            </div>
                          </div>
                        </div>;
              })}
                  </div>}

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

                <p className="text-center text-xs text-slate-500 mt-4">
                  Você pode mudar de plano a qualquer momento
                </p>
              </motion.div>}

            {/* Step 3: Admin Info */}
            {step === 3 && <motion.div key="step3" initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Dados do Administrador
                  </h2>
                  <p className="text-slate-600">
                    Crie sua conta de acesso ao sistema
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-nome">Seu Nome *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="admin-nome" placeholder="Nome completo" value={admin.nome} onChange={e => setAdmin({
                      ...admin,
                      nome: e.target.value
                    })} className={`pl-10 ${errors.nome ? "border-destructive" : ""}`} />
                      </div>
                      {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-email">E-mail *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="admin-email" type="email" placeholder="seu@email.com" value={admin.email} onChange={e => setAdmin({
                      ...admin,
                      email: e.target.value
                    })} className={`pl-10 ${errors.email ? "border-destructive" : ""}`} />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="admin-password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={admin.password} onChange={e => setAdmin({
                      ...admin,
                      password: e.target.value
                    })} className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-confirm-password">Confirmar Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="admin-confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="Digite a senha novamente" value={admin.confirmPassword} onChange={e => setAdmin({
                      ...admin,
                      confirmPassword: e.target.value
                    })} className={`pl-10 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                      <Button onClick={handleNextStep} className="flex-1" disabled={loading}>
                        {loading ? <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando conta...
                          </> : <>
                            Criar Conta
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>}

            {/* Step 4: Credit Card */}
            {step === 4 && <motion.div key="step4" initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }}>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Adicione seu Cartão
                  </h2>
                  <p className="text-slate-600">
                    Cartão necessário para ativar o trial de 14 dias
                  </p>
                </div>

                <OnboardingCardForm schoolName={escola.nome} adminEmail={admin.email} setupIntentClientSecret={setupIntentSecret || ""} setupIntentId={setupIntentId || ""} tenantId={tenantId || ""} stripePublishableKey={stripePublishableKey} onSuccess={handleCardSuccess} onBack={() => setStep(3)} />
              </motion.div>}

            {/* Step 5: Success */}
            {step === 5 && <motion.div key="step5" initial={{
            opacity: 0,
            scale: 0.95
          }} animate={{
            opacity: 1,
            scale: 1
          }} className="text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Conta Criada com Sucesso!
                </h2>
                <p className="text-slate-600 mb-8">
                  Sua escola <strong>{escola.nome}</strong> foi cadastrada.
                  <br />
                  Você tem <strong>14 dias de teste grátis</strong> antes da primeira cobrança.
                </p>

                <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 mb-6 text-left">
                  <h3 className="font-semibold text-slate-900 mb-4">O que você pode fazer agora:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm text-slate-700">Cadastrar seus primeiros alunos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm text-slate-700">Configurar cursos e turmas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-sm text-slate-700">Gerar faturas e controlar finanças</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm text-slate-700">Cartão registrado para cobrança automática</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleGoToLogin} size="lg" className="w-full">
                  Acessar o Sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-sm text-slate-500 mt-4">
                  Use o e-mail <strong>{admin.email}</strong> para fazer login
                </p>
              </motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>;
}