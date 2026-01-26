import { cn } from "@/lib/utils";

interface TimelineItem {
  step: number;
  title: string;
  description: string;
}

interface TimelineBlockProps {
  content: {
    title?: string;
    items?: TimelineItem[];
  };
  settings: {
    style?: "vertical" | "horizontal";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function TimelineBlock({ content, settings, colors }: TimelineBlockProps) {
  const items = content.items || [];
  const style = settings.style || "vertical";
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-4xl mx-auto px-4">
        {content.title && (
          <h2 
            className="text-2xl md:text-4xl font-bold text-center mb-12"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title}
          </h2>
        )}
        
        {style === "vertical" ? (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div 
                key={index}
                className="flex gap-4 items-start"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: `hsl(${colors.primary})` }}
                >
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold"
                  style={{ backgroundColor: `hsl(${colors.primary})` }}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                {index < items.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
