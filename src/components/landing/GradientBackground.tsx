interface GradientBackgroundProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientBackground({
  gradientFrom = "262 83% 58%",
  gradientVia = "292 84% 61%",
  gradientTo = "24 95% 53%",
}: GradientBackgroundProps) {
  return (
    <>
      {/* Main Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            hsl(${gradientFrom}) 0%, 
            hsl(${gradientVia}) 40%, 
            hsl(${gradientVia}) 60%,
            hsl(${gradientTo}) 100%
          )`,
        }}
      />

      {/* Mesh Overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 40% 20%, hsla(${gradientFrom.split(" ")[0]}, 80%, 60%, 0.3) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(${gradientVia.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(${gradientFrom.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(${gradientVia.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(${gradientFrom.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(${gradientTo.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%)
          `,
        }}
      />
    </>
  );
}
