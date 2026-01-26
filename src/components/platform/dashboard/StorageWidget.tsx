import { motion } from "framer-motion";
import { HardDrive, FileText, Image, Video, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StorageItem {
  label: string;
  icon: React.ElementType;
  size: string;
  color: string;
  percentage: number;
}

interface StorageWidgetProps {
  usedGB?: number;
  totalGB?: number;
  className?: string;
}

export function StorageWidget({ usedGB = 45.2, totalGB = 100, className }: StorageWidgetProps) {
  const usagePercentage = Math.round((usedGB / totalGB) * 100);
  
  const storageItems: StorageItem[] = [
    { label: "Documentos", icon: FileText, size: "18.5 GB", color: "bg-primary", percentage: 41 },
    { label: "Imagens", icon: Image, size: "15.2 GB", color: "bg-accent", percentage: 34 },
    { label: "Vídeos", icon: Video, size: "8.3 GB", color: "bg-chart-3", percentage: 18 },
    { label: "Outros", icon: Archive, size: "3.2 GB", color: "bg-muted-foreground", percentage: 7 },
  ];

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-warning";
    return "bg-primary";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className={cn("border-border/50", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            Armazenamento Global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Espaço utilizado</span>
              <span className="font-semibold text-foreground">
                {usedGB.toFixed(1)} GB / {totalGB} GB
              </span>
            </div>
            <div className="relative">
              <Progress 
                value={usagePercentage} 
                className="h-3 bg-muted"
              />
              <div 
                className={cn(
                  "absolute top-0 left-0 h-3 rounded-full transition-all duration-500",
                  getProgressColor(usagePercentage)
                )}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-medium",
                usagePercentage >= 90 ? "text-destructive" : 
                usagePercentage >= 75 ? "text-warning" : "text-muted-foreground"
              )}>
                {usagePercentage}% utilizado
              </span>
              <span className="text-xs text-muted-foreground">
                {(totalGB - usedGB).toFixed(1)} GB disponível
              </span>
            </div>
          </div>

          {/* Storage Breakdown */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Distribuição
            </p>
            <div className="space-y-2">
              {storageItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "h-6 w-6 rounded-md flex items-center justify-center",
                    item.color + "/10"
                  )}>
                    <item.icon className={cn("h-3.5 w-3.5", item.color.replace("bg-", "text-"))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.size}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
