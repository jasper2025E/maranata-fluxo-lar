import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  name: string;
  role?: string;
  photo_url?: string;
  bio?: string;
}

interface TeamBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: TeamMember[];
  };
  settings: {
    columns?: 2 | 3 | 4;
    show_role?: boolean;
    show_bio?: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function TeamBlock({ content, settings, colors }: TeamBlockProps) {
  const items = content.items || [];
  const columns = settings.columns || 4;
  
  if (items.length === 0) {
    return null;
  }
  
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
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
          {items.map((member, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-4 mx-auto w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-muted">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold">{member.name}</h3>
              
              {settings.show_role !== false && member.role && (
                <p 
                  className="text-sm mt-1"
                  style={{ color: `hsl(${colors.primary})` }}
                >
                  {member.role}
                </p>
              )}
              
              {settings.show_bio && member.bio && (
                <p className="text-sm text-muted-foreground mt-2">
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
