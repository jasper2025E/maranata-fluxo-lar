import { User, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialItem {
  name: string;
  role?: string;
  text: string;
  photo_url?: string;
}

interface TestimonialsBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: TestimonialItem[];
  };
  settings: {
    columns?: 2 | 3;
    show_photos?: boolean;
    style?: "cards" | "quotes";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function TestimonialsBlock({ content, settings, colors }: TestimonialsBlockProps) {
  const columns = settings.columns || 3;
  const items = content.items || [];
  const showPhotos = settings.show_photos !== false;
  
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
  };
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-6xl mx-auto px-4">
        {content.title && (
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-4xl font-bold mb-4"
              style={{ color: `hsl(${colors.primary})` }}
            >
              {content.title}
            </h2>
            {content.subtitle && (
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                {content.subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className={cn("grid gap-6", gridCols[columns])}>
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-background p-6 rounded-xl shadow-sm border relative"
            >
              {settings.style === "quotes" && (
                <Quote 
                  className="absolute top-4 right-4 h-8 w-8 opacity-10"
                  style={{ color: `hsl(${colors.primary})` }}
                />
              )}
              
              <p className="text-muted-foreground mb-4 italic leading-relaxed">
                "{item.text}"
              </p>
              
              <div className="flex items-center gap-3">
                {showPhotos && (
                  <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.role && (
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
