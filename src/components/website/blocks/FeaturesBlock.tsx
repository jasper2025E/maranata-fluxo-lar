import { cn } from "@/lib/utils";
import { 
  Star, Users, Award, Heart, Palette, Shield, Utensils, Clock, 
  Music, BookOpen, Laptop, Trophy, GraduationCap, Target, Globe,
  Dumbbell, School, Medal, Briefcase, Wrench, TrendingUp, Leaf,
  Sprout, Recycle, Sun, TreePine, Apple, Bike, Code, Cpu, Gamepad,
  Wifi, Lightbulb, Rocket, MessageCircle, Building2, Phone
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star, Users, Award, Heart, Palette, Shield, Utensils, Clock,
  Music, BookOpen, Laptop, Trophy, GraduationCap, Target, Globe,
  Dumbbell, School, Medal, Briefcase, Wrench, TrendingUp, Leaf,
  Sprout, Recycle, Sun, TreePine, Apple, Bike, Code, Cpu, Gamepad,
  Wifi, Lightbulb, Rocket, MessageCircle, Building2, Phone
};

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: FeatureItem[];
  };
  settings: {
    columns?: 2 | 3 | 4;
    style?: "cards" | "minimal" | "icons";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function FeaturesBlock({ content, settings, colors }: FeaturesBlockProps) {
  const columns = settings.columns || 3;
  const items = content.items || [];
  
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Star;
  };
  
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };
  
  return (
    <section className="py-16 md:py-24">
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
          {items.map((item, index) => {
            const Icon = getIcon(item.icon);
            
            if (settings.style === "minimal") {
              return (
                <div key={index} className="text-center">
                  <Icon 
                    className="h-8 w-8 mx-auto mb-3" 
                    style={{ color: `hsl(${colors.primary})` }}
                  />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            }
            
            if (settings.style === "icons") {
              return (
                <div key={index} className="flex gap-4 items-start">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `hsl(${colors.primary} / 0.1)` }}
                  >
                    <Icon 
                      className="h-6 w-6" 
                      style={{ color: `hsl(${colors.primary})` }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            }
            
            // Default: cards style
            return (
              <div 
                key={index}
                className="group p-6 rounded-xl border bg-background hover:shadow-md transition-shadow"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `hsl(${colors.primary} / 0.1)` }}
                >
                  <Icon 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${colors.primary})` }}
                  />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
