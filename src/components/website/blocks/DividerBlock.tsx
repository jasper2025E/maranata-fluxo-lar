import { cn } from "@/lib/utils";

interface DividerBlockProps {
  settings: {
    style?: "line" | "dots" | "space";
    spacing?: "sm" | "md" | "lg";
  };
  colors: {
    primary: string;
  };
}

export function DividerBlock({ settings, colors }: DividerBlockProps) {
  const style = settings.style || "line";
  const spacing = settings.spacing || "md";
  
  const spacingClass = {
    sm: "py-4",
    md: "py-8",
    lg: "py-16",
  }[spacing];
  
  if (style === "space") {
    return <div className={spacingClass} />;
  }
  
  if (style === "dots") {
    return (
      <div className={cn("flex justify-center gap-2", spacingClass)}>
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${colors.primary} / 0.3)` }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={spacingClass}>
      <div 
        className="max-w-xs mx-auto h-px"
        style={{ backgroundColor: `hsl(${colors.primary} / 0.2)` }}
      />
    </div>
  );
}
