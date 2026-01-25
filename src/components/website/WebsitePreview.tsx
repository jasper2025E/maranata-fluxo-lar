import { useState } from "react";
import { SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface WebsitePreviewProps {
  config: SchoolWebsiteConfig;
  slug: string;
}

type ViewportSize = "desktop" | "tablet" | "mobile";

export function WebsitePreview({ config, slug }: WebsitePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [key, setKey] = useState(0);

  const baseUrl = window.location.origin;
  const previewUrl = `${baseUrl}/escola/${slug}`;

  const viewportClasses: Record<ViewportSize, string> = {
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            variant={viewport === "desktop" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewport("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "tablet" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewport("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={viewport === "mobile" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewport("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir em Nova Aba
            </a>
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <div
          className={cn(
            "mx-auto transition-all duration-300",
            viewportClasses[viewport]
          )}
        >
          {config.enabled ? (
            <iframe
              key={key}
              src={previewUrl}
              className="w-full h-[600px] border-0"
              title="Website Preview"
            />
          ) : (
            <div className="h-[600px] flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  O site está desativado
                </p>
                <p className="text-sm text-muted-foreground">
                  Ative o site para visualizar o preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
