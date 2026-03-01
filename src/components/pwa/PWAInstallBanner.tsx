import { useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function PWAInstallBanner() {
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("pwa-banner-dismissed") === "true";
  });

  if (dismissed || isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-banner-dismissed", "true");
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-fade-in">
      <div className="rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-card-foreground">
              Instalar Maranata
            </p>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                Toque em <Share className="inline h-3 w-3" /> e depois em{" "}
                <strong>"Adicionar à Tela de Início"</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Instale o app para acesso rápido e offline
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {!isIOS && (
          <Button className="w-full mt-3" size="sm" onClick={handleInstall}>
            <Download className="h-4 w-4 mr-2" />
            Instalar App
          </Button>
        )}
      </div>
    </div>
  );
}
