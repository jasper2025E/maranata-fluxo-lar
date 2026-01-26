import { cn } from "@/lib/utils";

interface BannerBlockProps {
  content: {
    text?: string;
    link_text?: string;
    link_url?: string;
  };
  settings: {
    style?: "info" | "success" | "warning" | "gradient";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function BannerBlock({ content, settings, colors }: BannerBlockProps) {
  const style = settings.style || "info";
  
  const getBackgroundStyle = () => {
    if (style === "gradient") {
      return {
        background: `linear-gradient(90deg, hsl(${colors.primary}) 0%, hsl(${colors.accent}) 100%)`,
      };
    }
    return {
      backgroundColor: `hsl(${colors.primary})`,
    };
  };
  
  return (
    <div 
      className="py-3 text-center text-white"
      style={getBackgroundStyle()}
    >
      <div className="container max-w-6xl mx-auto px-4 flex items-center justify-center gap-2 flex-wrap">
        <span className="text-sm font-medium">{content.text}</span>
        {content.link_text && content.link_url && (
          <a 
            href={content.link_url}
            className="text-sm font-semibold underline hover:no-underline"
          >
            {content.link_text}
          </a>
        )}
      </div>
    </div>
  );
}
