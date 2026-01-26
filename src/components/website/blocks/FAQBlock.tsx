import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    items?: FAQItem[];
  };
  settings: {
    style?: "accordion" | "list";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function FAQBlock({ content, settings, colors }: FAQBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = content.items || [];
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-3xl mx-auto px-4">
        {content.title && (
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-4xl font-bold mb-4"
              style={{ color: `hsl(${colors.primary})` }}
            >
              {content.title}
            </h2>
            {content.subtitle && (
              <p className="text-muted-foreground text-lg">
                {content.subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div 
              key={index}
              className="border rounded-lg overflow-hidden bg-background"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium pr-4">{item.question}</span>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                  style={{ color: `hsl(${colors.primary})` }}
                />
              </button>
              
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="p-4 pt-0 text-muted-foreground">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
