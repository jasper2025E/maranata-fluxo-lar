import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTABlockProps {
  content: {
    title?: string;
    subtitle?: string;
    button_text?: string;
    button_url?: string;
  };
  settings: {
    style?: "gradient" | "solid" | "outline";
    alignment?: "left" | "center" | "right";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onButtonClick?: () => void;
}

export function CTABlock({ content, settings, colors, onButtonClick }: CTABlockProps) {
  const alignment = settings.alignment || "center";
  const style = settings.style || "gradient";
  
  const getBackgroundStyle = () => {
    if (style === "gradient") {
      return {
        background: `linear-gradient(135deg, hsl(${colors.primary}) 0%, hsl(${colors.secondary}) 100%)`,
      };
    }
    if (style === "solid") {
      return {
        backgroundColor: `hsl(${colors.primary})`,
      };
    }
    return {};
  };
  
  return (
    <section 
      className={cn(
        "py-16 md:py-20",
        style === "outline" && "border-y"
      )}
      style={style !== "outline" ? getBackgroundStyle() : undefined}
    >
      <div className={cn(
        "container max-w-4xl mx-auto px-4",
        alignment === "center" && "text-center",
        alignment === "left" && "text-left",
        alignment === "right" && "text-right"
      )}>
        <h2 className={cn(
          "text-2xl md:text-4xl font-bold mb-4",
          style !== "outline" && "text-white"
        )}>
          {content.title || "Pronto para começar?"}
        </h2>
        
        {content.subtitle && (
          <p className={cn(
            "text-lg mb-8",
            style !== "outline" ? "text-white/90" : "text-muted-foreground"
          )}>
            {content.subtitle}
          </p>
        )}
        
        {content.button_text && (
          <Button 
            size="lg"
            variant={style !== "outline" ? "secondary" : "default"}
            className="text-base px-8"
            onClick={onButtonClick}
          >
            {content.button_text}
          </Button>
        )}
      </div>
    </section>
  );
}
