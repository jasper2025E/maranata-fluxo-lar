import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
}

interface StatsBlockProps {
  content: {
    title?: string;
    items?: StatItem[];
  };
  settings: {
    columns?: 2 | 3 | 4;
    style?: "default" | "cards" | "minimal";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function StatsBlock({ content, settings, colors }: StatsBlockProps) {
  const items = content.items || [];
  const columns = settings.columns || 3;
  
  if (items.length === 0) {
    return null;
  }
  
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };
  
  return (
    <section 
      className="py-16 md:py-20"
      style={{ backgroundColor: `hsl(${colors.primary})` }}
    >
      <div className="container max-w-6xl mx-auto px-4">
        {content.title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-white">
            {content.title}
          </h2>
        )}
        
        <div className={cn("grid gap-8", gridCols[columns])}>
          {items.map((item, index) => (
            <div key={index} className="text-center text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">
                {item.value}
              </div>
              <div className="text-white/80">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
