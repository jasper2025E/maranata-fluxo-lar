import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Image, FileText, Film, AlertTriangle, ArrowUpCircle } from "lucide-react";

interface StorageUsageCardProps {
  onUpgrade?: () => void;
}

// Storage limits (in bytes) - single-tenant has enterprise limits
const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10 GB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function StorageUsageCard({ onUpgrade }: StorageUsageCardProps) {
  // Mock storage usage for single-tenant (in a real app, fetch from storage API)
  const storageUsed = 0;
  const planLimit = STORAGE_LIMIT;
  
  const usagePercent = Math.min(100, Math.round((storageUsed / planLimit) * 100));
  const isWarning = usagePercent >= 80;
  const isCritical = usagePercent >= 95;
  
  // Mock distribution data
  const distribution = [
    { type: "Imagens", icon: Image, bytes: Math.round(storageUsed * 0.6), color: "text-blue-500" },
    { type: "Documentos", icon: FileText, bytes: Math.round(storageUsed * 0.3), color: "text-green-500" },
    { type: "Vídeos", icon: Film, bytes: Math.round(storageUsed * 0.1), color: "text-purple-500" },
  ];
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Uso de Armazenamento
            </CardTitle>
            <CardDescription>
              Plano Completo
            </CardDescription>
          </div>
          {isWarning && (
            <Badge variant={isCritical ? "destructive" : "secondary"} className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {isCritical ? "Quase cheio" : "Alto uso"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatBytes(storageUsed)} de {formatBytes(planLimit)}
            </span>
            <span className={`font-medium ${isCritical ? "text-destructive" : isWarning ? "text-warning" : ""}`}>
              {usagePercent}%
            </span>
          </div>
          <Progress 
            value={usagePercent} 
            className={`h-2 ${isCritical ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-warning" : ""}`}
          />
        </div>
        
        {/* Distribution */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Distribuição
          </p>
          <div className="space-y-1.5">
            {distribution.map((item) => {
              const Icon = item.icon;
              const itemPercent = storageUsed > 0 ? Math.round((item.bytes / storageUsed) * 100) : 0;
              return (
                <div key={item.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                    <span>{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{formatBytes(item.bytes)}</span>
                    <span className="text-xs">({itemPercent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Upgrade CTA */}
        {isWarning && onUpgrade && (
          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={onUpgrade}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Expandir armazenamento
            </Button>
          </div>
        )}
        
        {/* Tips */}
        {!isWarning && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Imagens são automaticamente comprimidas no upload para economizar espaço.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
