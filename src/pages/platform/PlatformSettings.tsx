import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Save,
  RefreshCw,
  Globe,
  Bell,
  Shield,
  Database,
  Zap,
  Mail,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PlatformConfig {
  platform_name: string;
  support_email: string;
  max_schools: number;
  max_users_per_school: number;
  max_students_per_school: number;
  enable_new_registrations: boolean;
  enable_email_notifications: boolean;
  enable_maintenance_mode: boolean;
  stripe_enabled: boolean;
  asaas_enabled: boolean;
}

const defaultConfig: PlatformConfig = {
  platform_name: "Maranata Fluxo",
  support_email: "suporte@maranatafluxo.com",
  max_schools: 100,
  max_users_per_school: 10,
  max_students_per_school: 500,
  enable_new_registrations: true,
  enable_email_notifications: true,
  enable_maintenance_mode: false,
  stripe_enabled: true,
  asaas_enabled: true,
};

export default function PlatformSettings() {
  const { isPlatformAdmin } = useAuth();
  const [config, setConfig] = useState<PlatformConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchSettings();
    }
  }, [isPlatformAdmin]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedConfig: Partial<PlatformConfig> = {};
        data.forEach(setting => {
          const value = setting.value;
          if (typeof value === "object" && value !== null && "value" in value) {
            (loadedConfig as any)[setting.key] = value.value;
          }
        });
        setConfig({ ...defaultConfig, ...loadedConfig });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = Object.entries(config).map(([key, value]) => ({
        key,
        value: { value },
        description: getSettingDescription(key),
      }));

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert({
            key: setting.key,
            value: setting.value,
            description: setting.description,
          }, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      platform_name: "Nome da plataforma",
      support_email: "Email de suporte",
      max_schools: "Limite máximo de escolas",
      max_users_per_school: "Limite de usuários por escola",
      max_students_per_school: "Limite de alunos por escola",
      enable_new_registrations: "Permitir novas inscrições",
      enable_email_notifications: "Habilitar notificações por email",
      enable_maintenance_mode: "Modo de manutenção",
      stripe_enabled: "Pagamentos via Stripe",
      asaas_enabled: "Pagamentos via Asaas",
    };
    return descriptions[key] || key;
  };

  const updateConfig = (key: keyof PlatformConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isPlatformAdmin()) {
    return null;
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
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings className="h-8 w-8 text-amber-400" />
              Configurações Globais
            </h1>
            <p className="text-slate-400 mt-1">
              Configure as opções globais da plataforma
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchSettings}
              disabled={loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Recarregar
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* General Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="h-5 w-5 text-amber-400" />
                    Configurações Gerais
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Informações básicas da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome da Plataforma</Label>
                    <Input
                      value={config.platform_name}
                      onChange={(e) => updateConfig("platform_name", e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email de Suporte</Label>
                    <Input
                      type="email"
                      value={config.support_email}
                      onChange={(e) => updateConfig("support_email", e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Limits Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    Limites do Sistema
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure os limites de uso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Máximo de Escolas</Label>
                    <Input
                      type="number"
                      value={config.max_schools}
                      onChange={(e) => updateConfig("max_schools", parseInt(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Usuários por Escola</Label>
                    <Input
                      type="number"
                      value={config.max_users_per_school}
                      onChange={(e) => updateConfig("max_users_per_school", parseInt(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Alunos por Escola</Label>
                    <Input
                      type="number"
                      value={config.max_students_per_school}
                      onChange={(e) => updateConfig("max_students_per_school", parseInt(e.target.value))}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Features Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-400" />
                    Funcionalidades
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Ative ou desative recursos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-300">Novas Inscrições</Label>
                      <p className="text-xs text-slate-500">Permitir registro de novas escolas</p>
                    </div>
                    <Switch
                      checked={config.enable_new_registrations}
                      onCheckedChange={(checked) => updateConfig("enable_new_registrations", checked)}
                    />
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Notificações por Email
                      </Label>
                      <p className="text-xs text-slate-500">Enviar emails automatizados</p>
                    </div>
                    <Switch
                      checked={config.enable_email_notifications}
                      onCheckedChange={(checked) => updateConfig("enable_email_notifications", checked)}
                    />
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-300 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-400" />
                        Modo Manutenção
                      </Label>
                      <p className="text-xs text-slate-500">Bloquear acesso ao sistema</p>
                    </div>
                    <Switch
                      checked={config.enable_maintenance_mode}
                      onCheckedChange={(checked) => updateConfig("enable_maintenance_mode", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payments Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-400" />
                    Integrações de Pagamento
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure os gateways de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-300">Stripe</Label>
                      <p className="text-xs text-slate-500">Cartões internacionais</p>
                    </div>
                    <Switch
                      checked={config.stripe_enabled}
                      onCheckedChange={(checked) => updateConfig("stripe_enabled", checked)}
                    />
                  </div>
                  <Separator className="bg-slate-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-slate-300">Asaas</Label>
                      <p className="text-xs text-slate-500">PIX e Boleto</p>
                    </div>
                    <Switch
                      checked={config.asaas_enabled}
                      onCheckedChange={(checked) => updateConfig("asaas_enabled", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
