import doodlePatternBg from "@/assets/doodle-pattern-bg.png";

export function GradientBackground() {
  return (
    <>
      {/* Black and white gradient background - darker */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(0, 0%, 50%) 0%, 
              hsl(0, 0%, 58%) 25%,
              hsl(0, 0%, 54%) 50%, 
              hsl(0, 0%, 60%) 75%,
              hsl(0, 0%, 52%) 100%
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
          opacity: 0.35,
        }}
      />

      {/* Subtle gray accents */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(at 0% 0%, hsla(0, 0%, 70%, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(0, 0%, 95%, 0.4) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(0, 0%, 80%, 0.3) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(0, 0%, 75%, 0.3) 0px, transparent 50%)
          `,
        }}
      />
    </>
  );
}
