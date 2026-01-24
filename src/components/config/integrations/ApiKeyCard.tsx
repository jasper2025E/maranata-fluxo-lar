import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKeyCardProps {
  name: string;
  description: string;
  isConfigured: boolean;
  isOptional?: boolean;
  maskedValue: string;
  prefix?: string;
  externalLink?: {
    url: string;
    label: string;
  };
  iconBgClass?: string;
  onTest?: () => Promise<void>;
  isTesting?: boolean;
  index?: number;
}

export function ApiKeyCard({
  name,
  description,
  isConfigured,
  isOptional = false,
  maskedValue,
  prefix,
  externalLink,
  iconBgClass = "bg-primary/10",
  onTest,
  isTesting = false,
  index = 0,
}: ApiKeyCardProps) {
  const [showKey, setShowKey] = useState(false);

  const getStatusBadge = () => {
    if (isConfigured) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle className="h-3 w-3" />
          Configurada
        </div>
      );
    }
    
    if (isOptional) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
          <AlertTriangle className="h-3 w-3" />
          Opcional
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
        <XCircle className="h-3 w-3" />
        Não configurada
      </div>
    );
  };

  const displayValue = showKey && prefix 
    ? `${prefix}...${maskedValue.slice(-8)}` 
    : maskedValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl p-5",
        "border border-border/40",
        "shadow-sm",
        "transition-all duration-300 ease-out"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-30",
        isConfigured 
          ? "from-emerald-500/10 via-transparent to-transparent"
          : "from-slate-500/10 via-transparent to-transparent"
      )} />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner",
              iconBgClass
            )}>
              <Key className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Key Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              type={showKey ? "text" : "password"}
              value={displayValue}
              readOnly
              className="pr-12 font-mono text-sm bg-muted/30 border-border/50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-muted"
                onClick={() => setShowKey(!showKey)}
                disabled={!isConfigured}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          {onTest && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={!isConfigured || isTesting}
              className="shrink-0"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Testar
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {externalLink ? (
            <a 
              href={externalLink.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              {externalLink.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => toast.info("Para atualizar esta chave, solicite ao administrador do sistema.")}
          >
            Atualizar Chave
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
