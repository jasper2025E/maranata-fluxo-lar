import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Webhook, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WebhookEvent {
  key: string;
  label: string;
  code: string;
  enabled: boolean;
}

interface WebhookConfigCardProps {
  webhookUrls: {
    asaas: string;
    stripe: string;
  };
  events: WebhookEvent[];
  onEventToggle: (key: string, value: boolean) => void;
  isSaving?: boolean;
}

export function WebhookConfigCard({
  webhookUrls,
  events,
  onEventToggle,
  isSaving = false,
}: WebhookConfigCardProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  return (
    <div className="space-y-6">
      {/* Endpoints Card */}
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
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-60" />

        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center shadow-inner">
              <Webhook className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Endpoints de Webhook</h3>
              <p className="text-xs text-muted-foreground">Configure estes endpoints nos painéis dos serviços</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Asaas Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrls.asaas}
                  readOnly
                  className="font-mono text-xs bg-muted/30 border-border/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(webhookUrls.asaas, "URL do Webhook Asaas")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Stripe Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhookUrls.stripe}
                  readOnly
                  className="font-mono text-xs bg-muted/30 border-border/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => copyToClipboard(webhookUrls.stripe, "URL do Webhook Stripe")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Events Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn(
          "relative overflow-hidden",
          "bg-card/80 backdrop-blur-sm rounded-2xl p-6",
          "border border-border/40",
          "shadow-sm"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60" />

        <div className="relative space-y-5">
          <div>
            <h3 className="font-semibold text-foreground">Eventos Monitorados</h3>
            <p className="text-xs text-muted-foreground">Eventos que disparam ações automáticas (salvamento automático)</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event, index) => (
              <motion.div
                key={event.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{event.code}</p>
                </div>
                <Switch
                  checked={event.enabled}
                  onCheckedChange={(checked) => onEventToggle(event.key, checked)}
                  disabled={isSaving}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
