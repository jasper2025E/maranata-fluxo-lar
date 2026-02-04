import doodlePatternBg from "@/assets/doodle-pattern-bg.png";

interface GradientBackgroundProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientBackground({}: GradientBackgroundProps) {
  return (
    <>
      {/* Light pastel gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(280, 60%, 92%) 0%, 
              hsl(320, 50%, 93%) 25%,
              hsl(340, 45%, 94%) 50%, 
              hsl(30, 60%, 93%) 75%,
              hsl(45, 70%, 92%) 100%
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
