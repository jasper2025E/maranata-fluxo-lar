import { WifiOff } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export function NetworkStatusIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground text-center text-xs py-1.5 font-medium">
      <WifiOff className="inline h-3 w-3 mr-1.5 -mt-0.5" />
      Sem conexão — modo offline ativo
    </div>
  );
}
