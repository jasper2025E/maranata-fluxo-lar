import doodlePatternBg from "@/assets/doodle-pattern-bg.png";

interface GradientBackgroundProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientBackground({
  gradientFrom = "262 83% 58%",
  gradientVia = "340 80% 65%",
  gradientTo = "30 95% 60%",
}: GradientBackgroundProps) {
  return (
    <>
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(${gradientFrom}) 0%, 
              hsl(340, 75%, 60%) 25%,
              hsl(${gradientVia}) 50%, 
              hsl(30, 90%, 65%) 75%,
              hsl(${gradientTo}) 100%
            )
          `,
        }}
      />

      {/* Doodle pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${doodlePatternBg})`,
          backgroundSize: "600px",
          backgroundRepeat: "repeat",
          mixBlendMode: "overlay",
        }}
      />

      {/* Cyan accent on top-right like Stripe */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to bottom left, 
              hsla(180, 70%, 70%, 0.4) 0%, 
              transparent 40%
            )
          `,
        }}
      />

      {/* Mesh Overlay for depth */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 10% 20%, hsla(${gradientFrom.split(" ")[0]}, 80%, 60%, 0.3) 0px, transparent 50%),
            radial-gradient(at 90% 10%, hsla(180, 70%, 70%, 0.3) 0px, transparent 40%),
            radial-gradient(at 30% 80%, hsla(340, 80%, 60%, 0.2) 0px, transparent 50%),
            radial-gradient(at 70% 60%, hsla(${gradientTo.split(" ")[0]}, 80%, 60%, 0.2) 0px, transparent 50%)
          `,
        }}
      />
    </>
  );
}
