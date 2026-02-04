import doodlePatternBg from "@/assets/doodle-pattern-bg.png";

interface GradientBackgroundProps {
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function GradientBackground({}: GradientBackgroundProps) {
  return (
    <>
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(280, 40%, 15%) 0%, 
              hsl(320, 35%, 18%) 25%,
              hsl(340, 30%, 20%) 50%, 
              hsl(20, 35%, 18%) 75%,
              hsl(35, 40%, 15%) 100%
            )
          `,
        }}
      />

      {/* Doodle pattern overlay - subtle on dark */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${doodlePatternBg})`,
          backgroundSize: "500px",
          backgroundRepeat: "repeat",
          opacity: 0.08,
          mixBlendMode: "overlay",
        }}
      />

      {/* Subtle color accents */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(280, 50%, 30%, 0.5) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(35, 50%, 25%, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(20, 45%, 25%, 0.4) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(320, 40%, 25%, 0.4) 0px, transparent 50%)
          `,
        }}
      />
    </>
  );
}
