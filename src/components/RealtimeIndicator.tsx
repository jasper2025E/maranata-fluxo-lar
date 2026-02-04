import { useRealtime } from "@/contexts/RealtimeProvider";
import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Indicador visual de status da conexão Realtime
 * Aparece apenas quando há problemas de conexão
 */
export function RealtimeIndicator() {
  const { isConnected, reconnecting } = useRealtime();
  const { t } = useTranslation();

  // Não mostrar nada se estiver conectado
  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg bg-warning/10 border border-warning/20 backdrop-blur-sm">
        {reconnecting ? (
          <>
            <RefreshCw className="h-4 w-4 text-warning animate-spin" />
            <span className="text-sm font-medium text-warning-foreground">
              {t("common.reconnecting", "Reconectando...")}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium text-warning-foreground">
              {t("common.connectionLost", "Conexão perdida")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
