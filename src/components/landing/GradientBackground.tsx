import childrenPlayingBg from "@/assets/children-playing-bg.jpg";

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
      {/* Background image of children playing */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${childrenPlayingBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Gradient overlay for readability and branding */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              hsla(${gradientFrom}, 0.85) 0%, 
              hsla(340, 75%, 60%, 0.8) 25%,
              hsla(${gradientVia}, 0.75) 50%, 
              hsla(30, 90%, 65%, 0.8) 75%,
              hsla(${gradientTo}, 0.85) 100%
            )
          `,
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
