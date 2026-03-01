import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAUpdatePrompt() {
  const { needRefresh, applyUpdate } = usePWA();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg">
        <RefreshCw className="h-4 w-4 text-primary animate-spin" />
        <span className="text-sm font-medium text-card-foreground">
          Atualização disponível
        </span>
        <Button size="sm" variant="default" onClick={applyUpdate}>
          Atualizar
        </Button>
      </div>
    </div>
  );
}
