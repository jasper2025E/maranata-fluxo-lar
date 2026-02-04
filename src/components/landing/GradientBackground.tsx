import doodlePatternBg from "@/assets/doodle-pattern-bg.png";

interface GradientBackgroundProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientBackground({}: GradientBackgroundProps) {
  return (
    <>
      {/* Darker pastel gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(280, 50%, 78%) 0%, 
              hsl(320, 45%, 80%) 25%,
              hsl(340, 40%, 82%) 50%, 
              hsl(30, 50%, 80%) 75%,
              hsl(45, 55%, 78%) 100%
            )
          `,
        }}
      />

      {/* Doodle pattern overlay - more visible */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${doodlePatternBg})`,
          backgroundSize: "500px",
          backgroundRepeat: "repeat",
          opacity: 0.4,
        }}
      />

      {/* Subtle color accents */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(280, 60%, 80%, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(45, 70%, 85%, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(30, 60%, 85%, 0.3) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(320, 50%, 85%, 0.3) 0px, transparent 50%)
          `,
        }}
      />
    </>
  );
}
