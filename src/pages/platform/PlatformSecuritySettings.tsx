import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Save, 
  Loader2, 
  Clock, 
  Key, 
  Lock, 
  UserX,
  ShieldCheck,
  Fingerprint,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SecurityConfig {
  session_timeout_minutes: number;
  require_mfa_admins: boolean;
  password_min_length: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
}

const defaultConfig: SecurityConfig = {
  session_timeout_minutes: 480,
  require_mfa_admins: false,
  password_min_length: 8,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
};

export default function PlatformSecuritySettings() {
  const { isPlatformAdmin } = useAuth();
  const [config, setConfig] = useState<SecurityConfig>(defaultConfig);
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
        const loaded: Partial<SecurityConfig> = {};
        settings.forEach((row) => {
          const val = row.value as { value: unknown } | null;
          if (val && typeof val === "object" && "value" in val) {
            (loaded as Record<string, unknown>)[row.key] = val.value;
          }
        });
        setConfig({ ...defaultConfig, ...loaded } as SecurityConfig);
      }
    } catch (error: any) {
      console.error("Error fetching security settings:", error);
      toast.error("Erro ao carregar configurações de segurança");
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

      toast.success("Configurações de segurança salvas!");
    } catch (error: any) {
      console.error("Error saving security settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: keyof SecurityConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

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
            <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Segurança</h1>
              <p className="text-muted-foreground">
                Configurações de autenticação e proteção
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
          <div className="grid gap-6">
            {/* Session Settings */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Sessão e Autenticação
                  </CardTitle>
                  <CardDescription>
                    Configure o tempo de sessão e requisitos de login
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Timeout da Sessão</Label>
                      <Select
                        value={String(config.session_timeout_minutes)}
                        onValueChange={(val) => updateConfig("session_timeout_minutes", parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                          <SelectItem value="240">4 horas</SelectItem>
                          <SelectItem value="480">8 horas</SelectItem>
                          <SelectItem value="1440">24 horas</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Tempo de inatividade antes do logout automático
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Fingerprint className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">MFA Obrigatório</p>
                          <p className="text-xs text-muted-foreground">
                            Exigir 2FA para administradores
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={config.require_mfa_admins}
                        onCheckedChange={(checked) => updateConfig("require_mfa_admins", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Password Policy */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    Política de Senhas
                  </CardTitle>
                  <CardDescription>
                    Defina os requisitos mínimos para senhas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Comprimento Mínimo</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={config.password_min_length}
                          onChange={(e) => updateConfig("password_min_length", parseInt(e.target.value) || 8)}
                          min={6}
                          max={32}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">caracteres</span>
                        <Badge variant="outline" className={cn(
                          config.password_min_length >= 12 ? "border-emerald-500 text-emerald-600" :
                          config.password_min_length >= 8 ? "border-amber-500 text-amber-600" :
                          "border-red-500 text-red-600"
                        )}>
                          {config.password_min_length >= 12 ? "Forte" :
                           config.password_min_length >= 8 ? "Médio" : "Fraco"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Lockout Policy */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                    Bloqueio por Tentativas
                  </CardTitle>
                  <CardDescription>
                    Proteção contra ataques de força bruta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tentativas Máximas</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={config.max_login_attempts}
                          onChange={(e) => updateConfig("max_login_attempts", parseInt(e.target.value) || 5)}
                          min={3}
                          max={10}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">tentativas</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Número de tentativas antes do bloqueio
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Duração do Bloqueio</Label>
                      <Select
                        value={String(config.lockout_duration_minutes)}
                        onValueChange={(val) => updateConfig("lockout_duration_minutes", parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 minutos</SelectItem>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="1440">24 horas</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Tempo de bloqueio após exceder tentativas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">Status de Segurança</h3>
                      <p className="text-sm text-muted-foreground">
                        Suas configurações de segurança estão em conformidade com as melhores práticas.
                      </p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Seguro
                    </Badge>
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
