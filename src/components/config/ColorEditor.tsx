import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, RotateCcw, Palette, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorConfig {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  destructive: string;
  sidebarBackground: string;
  sidebarPrimary: string;
}

const defaultColors: ColorConfig = {
  primary: "221 83% 53%",
  accent: "221 83% 96%",
  success: "152 69% 31%",
  warning: "38 92% 50%",
  destructive: "0 72% 51%",
  sidebarBackground: "222 47% 11%",
  sidebarPrimary: "221 83% 53%",
};

const colorPresets = [
  { name: "Azul Profissional", colors: { ...defaultColors } },
  { name: "Verde Natureza", colors: { ...defaultColors, primary: "152 69% 40%", accent: "152 69% 90%", sidebarPrimary: "152 69% 40%" } },
  { name: "Roxo Moderno", colors: { ...defaultColors, primary: "262 83% 58%", accent: "262 83% 92%", sidebarPrimary: "262 83% 58%" } },
  { name: "Laranja Energia", colors: { ...defaultColors, primary: "25 95% 53%", accent: "25 95% 92%", sidebarPrimary: "25 95% 53%" } },
  { name: "Rosa Vibrante", colors: { ...defaultColors, primary: "340 82% 52%", accent: "340 82% 92%", sidebarPrimary: "340 82% 52%" } },
  { name: "Ciano Tech", colors: { ...defaultColors, primary: "185 94% 35%", accent: "185 94% 90%", sidebarPrimary: "185 94% 35%" } },
];

interface ColorEditorProps {
  userId: string;
}

export function ColorEditor({ userId }: ColorEditorProps) {
  const [colors, setColors] = useState<ColorConfig>(defaultColors);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved colors
  useEffect(() => {
    const loadColors = async () => {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("custom_colors")
          .eq("user_id", userId)
          .maybeSingle();

        if (data?.custom_colors && typeof data.custom_colors === 'object') {
          const savedColors = data.custom_colors as Record<string, string>;
          const mergedColors: ColorConfig = {
            primary: savedColors.primary || defaultColors.primary,
            accent: savedColors.accent || defaultColors.accent,
            success: savedColors.success || defaultColors.success,
            warning: savedColors.warning || defaultColors.warning,
            destructive: savedColors.destructive || defaultColors.destructive,
            sidebarBackground: savedColors.sidebarBackground || defaultColors.sidebarBackground,
            sidebarPrimary: savedColors.sidebarPrimary || defaultColors.sidebarPrimary,
          };
          setColors(mergedColors);
          applyColors(mergedColors);
        }
      } catch (error) {
        console.error("Error loading colors:", error);
      } finally {
        setLoading(false);
      }
    };

    loadColors();
  }, [userId]);

  // Apply colors to CSS variables
  const applyColors = (colorConfig: ColorConfig) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", colorConfig.primary);
    root.style.setProperty("--accent", colorConfig.accent);
    root.style.setProperty("--success", colorConfig.success);
    root.style.setProperty("--warning", colorConfig.warning);
    root.style.setProperty("--destructive", colorConfig.destructive);
    root.style.setProperty("--sidebar-background", colorConfig.sidebarBackground);
    root.style.setProperty("--sidebar-primary", colorConfig.sidebarPrimary);
    root.style.setProperty("--ring", colorConfig.primary);
  };

  const handleColorChange = (key: keyof ColorConfig, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    applyColors(newColors);
  };

  const handlePresetSelect = (preset: typeof colorPresets[0]) => {
    setColors(preset.colors);
    applyColors(preset.colors);
  };

  const handleReset = () => {
    setColors(defaultColors);
    applyColors(defaultColors);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const colorData = JSON.parse(JSON.stringify(colors));

      if (existing) {
        const { error } = await supabase
          .from("user_preferences")
          .update({ custom_colors: colorData })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_preferences")
          .insert([{ user_id: userId, custom_colors: colorData }]);
        if (error) throw error;
      }

      toast.success("Cores salvas com sucesso!");
    } catch (error) {
      console.error("Error saving colors:", error);
      toast.error("Erro ao salvar cores");
    } finally {
      setSaving(false);
    }
  };

  // Convert HSL string to hex for color picker
  const hslToHex = (hsl: string): string => {
    const parts = hsl.split(" ");
    if (parts.length !== 3) return "#3b82f6";
    
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Convert hex to HSL string
  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "221 83% 53%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const colorFields: { key: keyof ColorConfig; label: string; description: string }[] = [
    { key: "primary", label: "Cor Principal", description: "Botões, links e elementos de destaque" },
    { key: "accent", label: "Cor de Destaque", description: "Fundos sutis e hover states" },
    { key: "success", label: "Sucesso", description: "Indicadores positivos e confirmações" },
    { key: "warning", label: "Alerta", description: "Avisos e pendências" },
    { key: "destructive", label: "Erro/Perigo", description: "Erros e ações destrutivas" },
    { key: "sidebarBackground", label: "Fundo da Sidebar", description: "Cor de fundo do menu lateral" },
    { key: "sidebarPrimary", label: "Destaque da Sidebar", description: "Itens ativos no menu lateral" },
  ];

  return (
    <div className="space-y-6">
      {/* Color Presets */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Temas Prontos
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
                  "hover:border-primary/50 hover:bg-muted/50",
                  JSON.stringify(colors) === JSON.stringify(preset.colors)
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <div 
                  className="h-6 w-6 rounded-full border border-border/50 shadow-sm"
                  style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                />
                <span className="text-sm font-medium">{preset.name}</span>
                {JSON.stringify(colors) === JSON.stringify(preset.colors) && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Cores Personalizadas</h3>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
        <div className="p-6">
          <div className="grid gap-4">
            {colorFields.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="h-9 w-14 rounded-md border border-border shadow-sm transition-transform hover:scale-105"
                        style={{ backgroundColor: `hsl(${colors[field.key]})` }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="end">
                      <div className="space-y-2">
                        <Input
                          type="color"
                          value={hslToHex(colors[field.key])}
                          onChange={(e) => handleColorChange(field.key, hexToHsl(e.target.value))}
                          className="h-32 w-32 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={colors[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="H S% L%"
                          className="text-xs font-mono"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Pré-visualização</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destrutivo</Button>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
              Sucesso
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
              Alerta
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Erro
            </span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Cores
        </Button>
      </div>
    </div>
  );
}
