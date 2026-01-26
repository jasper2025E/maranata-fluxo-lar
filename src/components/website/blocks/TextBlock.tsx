import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface TextBlockProps {
  content: {
    title?: string;
    text?: string;
  };
  settings: {
    alignment?: "left" | "center" | "right";
    max_width?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function TextBlock({ content, settings, colors }: TextBlockProps) {
  const alignment = settings.alignment || "center";
  const maxWidth = settings.max_width || "3xl";
  
  const maxWidthClass = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];
  
  return (
    <section className="py-16 md:py-24">
      <div className={cn(
        "container mx-auto px-4",
        maxWidthClass,
        alignment === "center" && "text-center",
        alignment === "left" && "text-left",
        alignment === "right" && "text-right"
      )}>
        {content.title && (
          <h2 
            className="text-2xl md:text-4xl font-bold mb-6"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title}
          </h2>
        )}
        
        {content.text && (
          <div 
            className="prose prose-lg max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(content.text.replace(/\n/g, '<br/>')) 
            }}
          />
        )}
      </div>
    </section>
  );
}
