import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap,
  Save,
  RefreshCw,
  GraduationCap,
  Users,
  Receipt,
  DollarSign,
  BookOpen,
  Layers,
  Settings,
  CreditCard,
  Building2,
  FileText,
  Calculator,
  Clock,
  BarChart3,
  Shield,
  Briefcase,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  plans: string[]; // Plans that have access
  category: "core" | "financial" | "academic" | "premium";
}

const defaultModules: ModuleConfig[] = [
  // Core
  { id: "dashboard", name: "Dashboard", description: "Painel principal com métricas", icon: BarChart3, enabled: true, plans: ["basic", "pro", "enterprise"], category: "core" },
  { id: "alunos", name: "Alunos", description: "Gestão de matrículas e cadastros", icon: GraduationCap, enabled: true, plans: ["basic", "pro", "enterprise"], category: "core" },
  { id: "cursos", name: "Cursos", description: "Cadastro de cursos e níveis", icon: BookOpen, enabled: true, plans: ["basic", "pro", "enterprise"], category: "core" },
  { id: "turmas", name: "Turmas", description: "Organização de turmas", icon: Layers, enabled: true, plans: ["basic", "pro", "enterprise"], category: "core" },
  { id: "responsaveis", name: "Responsáveis", description: "Gestão de responsáveis financeiros", icon: Users, enabled: true, plans: ["basic", "pro", "enterprise"], category: "core" },
  
  // Financial
  { id: "faturas", name: "Faturas", description: "Emissão e controle de cobranças", icon: Receipt, enabled: true, plans: ["basic", "pro", "enterprise"], category: "financial" },
  { id: "pagamentos", name: "Pagamentos", description: "Registro de pagamentos recebidos", icon: CreditCard, enabled: true, plans: ["basic", "pro", "enterprise"], category: "financial" },
  { id: "despesas", name: "Despesas", description: "Controle de custos operacionais", icon: DollarSign, enabled: true, plans: ["pro", "enterprise"], category: "financial" },
  { id: "contabilidade", name: "Contabilidade", description: "Relatórios contábeis e patrimônio", icon: Calculator, enabled: true, plans: ["enterprise"], category: "financial" },
  
  // Academic
  { id: "rh", name: "RH", description: "Gestão de funcionários e folha", icon: Briefcase, enabled: true, plans: ["pro", "enterprise"], category: "academic" },
  { id: "ponto", name: "Ponto Eletrônico", description: "Controle de frequência", icon: Clock, enabled: true, plans: ["pro", "enterprise"], category: "academic" },
  
  // Premium
  { id: "relatorios", name: "Relatórios Avançados", description: "Dashboards e exportações", icon: FileText, enabled: true, plans: ["pro", "enterprise"], category: "premium" },
  { id: "saude_financeira", name: "Saúde Financeira", description: "Projeções e análise preditiva", icon: BarChart3, enabled: true, plans: ["enterprise"], category: "premium" },
  { id: "integracoes", name: "Integrações", description: "Asaas, Stripe e APIs externas", icon: Zap, enabled: true, plans: ["pro", "enterprise"], category: "premium" },
];

interface PlanFeatures {
  planId: string;
  planName: string;
  modules: string[];
}

export default function PlatformModules() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<ModuleConfig[]>(defaultModules);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price");

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch module settings from platform_settings
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("key", "module_configurations");

      if (settings && settings.length > 0) {
        const savedModules = settings[0].value as any;
        if (savedModules?.modules) {
          // Merge saved settings with defaults
          const mergedModules = defaultModules.map(mod => {
            const saved = savedModules.modules.find((s: any) => s.id === mod.id);
            return saved ? { ...mod, ...saved } : mod;
          });
          setModules(mergedModules);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = (moduleId: string) => {
    setModules(prev => 
      prev.map(mod => 
        mod.id === moduleId ? { ...mod, enabled: !mod.enabled } : mod
      )
    );
  };

  const handleTogglePlanAccess = (moduleId: string, planName: string) => {
    setModules(prev =>
      prev.map(mod => {
        if (mod.id !== moduleId) return mod;
        const hasAccess = mod.plans.includes(planName);
        return {
          ...mod,
          plans: hasAccess 
            ? mod.plans.filter(p => p !== planName)
            : [...mod.plans, planName]
        };
      })
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .upsert({
          key: "module_configurations",
          value: { modules: modules.map(m => ({ id: m.id, enabled: m.enabled, plans: m.plans })) },
          description: "Configurações de módulos do sistema",
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      core: { label: "Essencial", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      financial: { label: "Financeiro", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      academic: { label: "Acadêmico", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
      premium: { label: "Premium", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    };
    return labels[category] || labels.core;
  };

  const filteredModules = modules.filter(mod => {
    const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          mod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === "all" || mod.plans.includes(selectedPlan);
    return matchesSearch && matchesPlan;
  });

  const groupedModules = {
    core: filteredModules.filter(m => m.category === "core"),
    financial: filteredModules.filter(m => m.category === "financial"),
    academic: filteredModules.filter(m => m.category === "academic"),
    premium: filteredModules.filter(m => m.category === "premium"),
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              Controle de Funcionalidades
            </h1>
            <p className="text-muted-foreground mt-1">
              Ative ou desative módulos por plano de assinatura
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Recarregar
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.name.toLowerCase()}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Modules by Category */}
        {Object.entries(groupedModules).map(([category, categoryModules]) => {
          if (categoryModules.length === 0) return null;
          const categoryInfo = getCategoryLabel(category);

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryModules.length} módulo(s)
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryModules.map((module) => (
                  <Card key={module.id} className={!module.enabled ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            module.enabled ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <module.icon className={`h-5 w-5 ${
                              module.enabled ? "text-primary" : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {module.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={module.enabled}
                          onCheckedChange={() => handleToggleModule(module.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Disponível para:
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {["basic", "pro", "enterprise"].map(planName => (
                            <button
                              key={planName}
                              onClick={() => handleTogglePlanAccess(module.id, planName)}
                              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                module.plans.includes(planName)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              {planName.charAt(0).toUpperCase() + planName.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Resumo por Plano
              </CardTitle>
              <CardDescription>
                Quantidade de módulos disponíveis em cada plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {["basic", "pro", "enterprise"].map(planName => {
                  const enabledModules = modules.filter(m => m.enabled && m.plans.includes(planName));
                  return (
                    <div key={planName} className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{planName}</span>
                        <Badge variant="outline">{enabledModules.length} módulos</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {enabledModules.slice(0, 5).map(m => (
                          <div key={m.id} className="flex items-center gap-1">
                            <m.icon className="h-3 w-3" />
                            {m.name}
                          </div>
                        ))}
                        {enabledModules.length > 5 && (
                          <div className="text-primary">+{enabledModules.length - 5} mais</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
