// Paleta de cores unificada para o site institucional
// Baseada no gradiente principal do Hero

export const INSTITUCIONAL_COLORS = {
  // Gradiente principal (usado em Hero, CTA, Navbar)
  gradient: {
    from: "262 83% 58%", // Violet
    via1: "280 75% 55%", // Purple
    via2: "310 70% 55%", // Magenta
    via3: "340 80% 58%", // Pink
    to: "25 95% 55%", // Orange
  },
  
  // Cores de destaque
  accent: {
    primary: "262 83% 58%", // Violet - cor principal
    secondary: "340 80% 58%", // Pink
    tertiary: "25 95% 55%", // Orange
  },
  
  // Cores de sucesso/status
  success: {
    base: "160 84% 39%", // Emerald
    light: "160 84% 45%",
  },
} as const;

// Gradiente CSS completo
export const GRADIENT_MAIN = `linear-gradient(135deg, 
  hsl(${INSTITUCIONAL_COLORS.gradient.from}) 0%, 
  hsl(${INSTITUCIONAL_COLORS.gradient.via1}) 25%,
  hsl(${INSTITUCIONAL_COLORS.gradient.via2}) 50%,
  hsl(${INSTITUCIONAL_COLORS.gradient.via3}) 75%,
  hsl(${INSTITUCIONAL_COLORS.gradient.to}) 100%
)`;

// Mesh overlay para profundidade
export const MESH_OVERLAY = `
  radial-gradient(at 20% 30%, hsla(${INSTITUCIONAL_COLORS.gradient.from}, 0.5) 0px, transparent 50%),
  radial-gradient(at 80% 20%, hsla(180, 70%, 60%, 0.4) 0px, transparent 40%),
  radial-gradient(at 40% 80%, hsla(${INSTITUCIONAL_COLORS.gradient.via3}, 0.3) 0px, transparent 50%),
  radial-gradient(at 90% 70%, hsla(${INSTITUCIONAL_COLORS.gradient.to}, 0.3) 0px, transparent 50%)
`;
