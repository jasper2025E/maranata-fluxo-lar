import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    badge?: string;
    cta_primary?: string;
    cta_secondary?: string;
    background_url?: string;
  };
  settings: {
    background_type?: "gradient" | "image" | "solid";
    show_badge?: boolean;
    alignment?: "left" | "center" | "right";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onCtaClick?: (type: "primary" | "secondary") => void;
}

export function HeroBlock({ content, settings, colors, onCtaClick }: HeroBlockProps) {
  const alignment = settings.alignment || "center";
  
  const getBackgroundStyle = () => {
    if (settings.background_type === "image" && content.background_url) {
      return {
        background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${content.background_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {
      background: `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 100%)`,
    };
  };
  
  return (
    <section 
      className="relative min-h-[500px] md:min-h-[600px] flex items-center text-white"
      style={getBackgroundStyle()}
    >
      <div className={cn(
        "container max-w-6xl mx-auto px-4 relative z-10",
        alignment === "center" && "text-center",
        alignment === "left" && "text-left",
        alignment === "right" && "text-right"
      )}>
        {settings.show_badge && content.badge && (
          <div 
            className={cn(
              "inline-block mb-6 px-4 py-1.5 rounded-full text-sm font-medium",
              alignment === "center" && "mx-auto"
            )}
            style={{ backgroundColor: `hsl(${colors.accent})` }}
          >
            {content.badge}
          </div>
        )}
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight max-w-4xl">
          {content.title || "Título Principal"}
        </h1>
        
        {content.subtitle && (
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        )}
        
        <div className={cn(
          "flex flex-col sm:flex-row gap-3",
          alignment === "center" && "justify-center",
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end"
        )}>
          {content.cta_primary && (
            <Button 
              size="lg" 
              className="text-base px-8"
              onClick={() => onCtaClick?.("primary")}
            >
              {content.cta_primary}
            </Button>
          )}
          {content.cta_secondary && (
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 border-white text-white hover:bg-white/10 hover:text-white"
              onClick={() => onCtaClick?.("secondary")}
            >
              {content.cta_secondary}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
