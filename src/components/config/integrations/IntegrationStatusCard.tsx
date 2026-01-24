import { motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationStatusCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  iconBgClass?: string;
  isConfigured: boolean;
  isOptional?: boolean;
  prefix?: string;
  index?: number;
}

export function IntegrationStatusCard({
  name,
  description,
  icon,
  iconBgClass = "bg-primary/10",
  isConfigured,
  isOptional = false,
  prefix,
  index = 0,
}: IntegrationStatusCardProps) {
  const getStatusBadge = () => {
    if (isConfigured) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle className="h-3 w-3" />
          Conectado
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
        Não configurado
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        scale: 1.01,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={cn(
        "group relative overflow-hidden",
        "bg-card/80 backdrop-blur-sm rounded-2xl p-5",
        "border border-border/40",
        "shadow-sm hover:shadow-xl",
        "transition-all duration-300 ease-out"
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-40",
        isConfigured 
          ? "from-emerald-500/10 via-emerald-500/5 to-transparent"
          : isOptional
            ? "from-amber-500/10 via-amber-500/5 to-transparent"
            : "from-slate-500/10 via-slate-500/5 to-transparent"
      )} />
      
      {/* Accent Line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px]",
        "bg-gradient-to-r",
        isConfigured 
          ? "from-emerald-500/60 to-emerald-500/20"
          : isOptional
            ? "from-amber-500/60 to-amber-500/20"
            : "from-slate-500/40 to-slate-500/10",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )} />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              "shadow-inner",
              iconBgClass
            )}>
              {icon}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{name}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {isConfigured && prefix && (
          <p className="text-xs text-muted-foreground/70 mt-3 font-mono pl-14">
            Chave: {prefix}...
          </p>
        )}
      </div>

      {/* Bottom Glow Effect */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl",
        isConfigured 
          ? "bg-emerald-500/20"
          : "bg-slate-500/10",
        "opacity-0 group-hover:opacity-60 transition-opacity duration-500"
      )} />
    </motion.div>
  );
}
