import { Loader2 } from "lucide-react";

/**
 * Full-page loading component used as Suspense fallback for lazy-loaded pages.
 * Uses semantic theming tokens for consistency.
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
