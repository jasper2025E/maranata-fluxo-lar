import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, 
  Save, 
  Loader2, 
  Building2, 
  CreditCard, 
  Shield,
  BellRing,
  Mail,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationConfig {
  notify_new_tenant: boolean;
  notify_payment_issues: boolean;
  notify_security_alerts: boolean;
}

const defaultConfig: NotificationConfig = {
  notify_new_tenant: true,
  notify_payment_issues: true,
  notify_security_alerts: true,
};

interface NotificationItem {
  key: keyof NotificationConfig;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  badge?: { label: string; variant: "default" | "destructive" | "outline" };
}

const notificationItems: NotificationItem[] = [
  {
    key: "notify_new_tenant",
    title: "Novos Cadastros",
    description: "Receber notificação quando uma nova escola se cadastrar",
    icon: Building2,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    key: "notify_payment_issues",
    title: "Problemas de Pagamento",
    description: "Alertas sobre falhas de cobrança e assinaturas vencidas",
    icon: CreditCard,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    badge: { label: "Importante", variant: "outline" },
  },
  {
    key: "notify_security_alerts",
    title: "Alertas de Segurança",
    description: "Notificações sobre tentativas de acesso suspeitas",
    icon: Shield,
    iconColor: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    badge: { label: "Crítico", variant: "destructive" },
  },
];

export default function PlatformNotifications() {
  const { isPlatformAdmin } = useAuth();
  const [config, setConfig] = useState<NotificationConfig>(defaultConfig);
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
      const keys = Object.keys(defaultConfig);
      const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      if (settings && settings.length > 0) {
        const loaded: Partial<NotificationConfig> = {};
        settings.forEach((row) => {
          const val = row.value as { value: unknown } | null;
          if (val && typeof val === "object" && "value" in val) {
            (loaded as Record<string, unknown>)[row.key] = val.value;
          }
        });
        setConfig({ ...defaultConfig, ...loaded } as NotificationConfig);
      }
    } catch (error: any) {
      console.error("Error fetching notification settings:", error);
      toast.error("Erro ao carregar configurações de notificações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(config);
      
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert({ key, value: { value } }, { onConflict: "key" });
        if (error) throw error;
      }

      toast.success("Configurações de notificações salvas!");
    } catch (error: any) {
      console.error("Error saving notification settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof NotificationConfig, value: boolean) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const enabledCount = Object.values(config).filter(Boolean).length;

  if (!isPlatformAdmin()) {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
              <p className="text-muted-foreground">
                Configure os alertas que você deseja receber
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BellRing className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {enabledCount} de {notificationItems.length} alertas ativos
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Os alertas serão enviados por email para o administrador do sistema
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Settings */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configurar Alertas</CardTitle>
                  <CardDescription>
                    Escolha quais notificações você deseja receber
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationItems.map((item, index) => {
                    const ItemIcon = item.icon;
                    const isEnabled = config[item.key];

                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                          isEnabled 
                            ? "border-primary/20 bg-primary/5" 
                            : "border-border bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                            isEnabled ? item.iconBg : "bg-muted"
                          )}>
                            <ItemIcon className={cn(
                              "h-5 w-5 transition-colors",
                              isEnabled ? item.iconColor : "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium",
                                isEnabled ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {item.title}
                              </p>
                              {item.badge && (
                                <Badge 
                                  variant={item.badge.variant}
                                  className="text-xs"
                                >
                                  {item.badge.label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => updateConfig(item.key, checked)}
                        />
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Alerts Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Alertas Recentes
                  </CardTitle>
                  <CardDescription>
                    Últimos alertas gerados pelo sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-medium text-foreground">Tudo tranquilo!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nenhum alerta crítico nos últimos 7 dias
                    </p>
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
