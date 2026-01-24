import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecuritySetting {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface SecuritySettingsCardProps {
  settings: SecuritySetting[];
  onToggle: (key: string, value: boolean) => void;
  isSaving?: boolean;
  webhookToken?: {
    configured: boolean;
    maskedValue: string;
  };
}

export function SecuritySettingsCard({
  settings,
  onToggle,
  isSaving = false,
  webhookToken,
}: SecuritySettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl p-6",
        "border border-border/40",
        "shadow-sm"
      )}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-60" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center shadow-inner">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Configurações de Segurança</h3>
            <p className="text-xs text-muted-foreground">Controle os mecanismos de proteção das integrações</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {settings.map((setting, index) => (
            <motion.div
              key={setting.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-0.5">
                <Label className="font-medium text-foreground">{setting.label}</Label>
                <p className="text-xs text-muted-foreground">{setting.description}</p>
              </div>
              <Switch
                checked={setting.enabled}
                onCheckedChange={(checked) => onToggle(setting.key, checked)}
                disabled={isSaving}
              />
            </motion.div>
          ))}
        </div>

        {/* Webhook Token Section */}
        {webhookToken && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="font-medium text-foreground">Token de Webhook Asaas</Label>
              {webhookToken.configured ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <CheckCircle className="h-3 w-3" />
                  Configurado
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Não configurado
                </div>
              )}
            </div>
            <Input
              type="password"
              value={webhookToken.maskedValue}
              readOnly
              className="font-mono text-sm bg-muted/30 border-border/50"
              placeholder="Token não configurado"
            />
            <p className="text-xs text-muted-foreground">
              Configure este token no painel Asaas para autenticar webhooks recebidos
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
