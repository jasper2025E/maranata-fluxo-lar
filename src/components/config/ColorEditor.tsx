import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2, RotateCcw, Palette, Check, Type, Layout, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateThemeConfigCache, applyThemeConfig } from "@/hooks/useThemeConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ColorConfig {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  destructive: string;
  sidebarBackground: string;
  sidebarPrimary: string;
}

interface LayoutConfig {
  borderRadius: number;
  shadowIntensity: number;
}

interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
}

interface ThemeConfig {
  lightColors: ColorConfig;
  darkColors: ColorConfig;
  layout: LayoutConfig;
  typography: TypographyConfig;
}

const defaultLightColors: ColorConfig = {
  primary: "221 83% 53%",
  accent: "221 83% 96%",
  success: "152 69% 31%",
  warning: "38 92% 50%",
  destructive: "0 72% 51%",
  sidebarBackground: "222 47% 11%",
  sidebarPrimary: "221 83% 53%",
};

const defaultDarkColors: ColorConfig = {
  primary: "221 83% 53%",
  accent: "221 83% 20%",
  success: "152 69% 40%",
  warning: "38 92% 50%",
  destructive: "0 72% 51%",
  sidebarBackground: "222 47% 7%",
  sidebarPrimary: "221 83% 53%",
};

const defaultLayout: LayoutConfig = {
  borderRadius: 12,
  shadowIntensity: 50,
};

const defaultTypography: TypographyConfig = {
  fontFamily: "Inter",
  fontSize: 16,
};

const defaultConfig: ThemeConfig = {
  lightColors: defaultLightColors,
  darkColors: defaultDarkColors,
  layout: defaultLayout,
  typography: defaultTypography,
};

const fontOptions = [
  { value: "Inter", label: "Inter (Padrão)" },
  { value: "system-ui", label: "Sistema" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Nunito", label: "Nunito" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Montserrat", label: "Montserrat" },
];

const colorPresets = [
  { name: "Azul Profissional", primary: "221 83% 53%" },
  { name: "Verde Natureza", primary: "152 69% 40%" },
  { name: "Roxo Moderno", primary: "262 83% 58%" },
  { name: "Laranja Energia", primary: "25 95% 53%" },
  { name: "Rosa Vibrante", primary: "340 82% 52%" },
  { name: "Ciano Tech", primary: "185 94% 35%" },
];

interface ColorEditorProps {
  userId: string;
}

export function ColorEditor({ userId }: ColorEditorProps) {
  const [config, setConfig] = useState<ThemeConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeColorMode, setActiveColorMode] = useState<"light" | "dark">("light");

  // Load saved config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("custom_colors")
          .eq("user_id", userId)
          .maybeSingle();

        if (data?.custom_colors && typeof data.custom_colors === 'object') {
          const saved = data.custom_colors as Record<string, unknown>;
          const safeLightColors = typeof saved.lightColors === 'object' && saved.lightColors 
            ? { ...defaultLightColors, ...(saved.lightColors as Partial<ColorConfig>) } 
            : defaultLightColors;
          const safeDarkColors = typeof saved.darkColors === 'object' && saved.darkColors 
            ? { ...defaultDarkColors, ...(saved.darkColors as Partial<ColorConfig>) } 
            : defaultDarkColors;
          const safeLayout = typeof saved.layout === 'object' && saved.layout 
            ? { ...defaultLayout, ...(saved.layout as Partial<LayoutConfig>) } 
            : defaultLayout;
          const safeTypography = typeof saved.typography === 'object' && saved.typography 
            ? { ...defaultTypography, ...(saved.typography as Partial<TypographyConfig>) } 
            : defaultTypography;
          setConfig({
            lightColors: safeLightColors,
            darkColors: safeDarkColors,
            layout: safeLayout,
            typography: safeTypography,
          });
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [userId]);

  // Apply config to CSS using the shared function
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    applyThemeConfig(config, isDark);
  }, [config]);

  const handleColorChange = (mode: "light" | "dark", key: keyof ColorConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [mode === "light" ? "lightColors" : "darkColors"]: {
        ...prev[mode === "light" ? "lightColors" : "darkColors"],
        [key]: value,
      },
    }));
  };

  const handleLayoutChange = (key: keyof LayoutConfig, value: number) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: value },
    }));
  };

  const handleTypographyChange = (key: keyof TypographyConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  const handlePresetSelect = (primary: string) => {
    const accent = primary.replace(/(\d+)%$/, (_, l) => `${Math.min(96, parseInt(l) + 40)}%`);
    setConfig(prev => ({
      ...prev,
      [activeColorMode === "light" ? "lightColors" : "darkColors"]: {
        ...prev[activeColorMode === "light" ? "lightColors" : "darkColors"],
        primary,
        accent,
        sidebarPrimary: primary,
      },
    }));
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    const isDark = document.documentElement.classList.contains("dark");
    applyThemeConfig(defaultConfig, isDark);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const colorData = JSON.parse(JSON.stringify(config));

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

      // Update global cache so theme persists across page navigations
      updateThemeConfigCache(config);

      toast.success("Personalização salva!");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

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
    if (s === 0) { r = g = b = l; } 
    else {
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

  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "221 83% 53%";
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
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

  const currentColors = activeColorMode === "light" ? config.lightColors : config.darkColors;

  const colorFields: { key: keyof ColorConfig; label: string; description: string }[] = [
    { key: "primary", label: "Cor Principal", description: "Botões, links e elementos de destaque" },
    { key: "accent", label: "Cor de Destaque", description: "Fundos sutis e hover states" },
    { key: "success", label: "Sucesso", description: "Indicadores positivos" },
    { key: "warning", label: "Alerta", description: "Avisos e pendências" },
    { key: "destructive", label: "Erro/Perigo", description: "Erros e ações destrutivas" },
    { key: "sidebarBackground", label: "Fundo Sidebar", description: "Cor de fundo do menu" },
    { key: "sidebarPrimary", label: "Destaque Sidebar", description: "Itens ativos no menu" },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Tipografia
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          {/* Theme Mode Selector */}
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveColorMode("light")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeColorMode === "light" ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Sun className="h-4 w-4" />
              Modo Claro
            </button>
            <button
              onClick={() => setActiveColorMode("dark")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeColorMode === "dark" ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Moon className="h-4 w-4" />
              Modo Escuro
            </button>
          </div>

          {/* Quick Presets */}
          <div className="bg-card border border-border rounded-lg p-4">
            <Label className="text-sm font-medium mb-3 block">Temas Rápidos</Label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.primary)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                    "hover:border-primary/50",
                    currentColors.primary === preset.primary ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div 
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.primary})` }}
                  />
                  <span className="text-xs font-medium">{preset.name}</span>
                  {currentColors.primary === preset.primary && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium">Cores Personalizadas ({activeColorMode === "light" ? "Modo Claro" : "Modo Escuro"})</h3>
            </div>
            <div className="p-4 grid gap-3">
              {colorFields.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm">{field.label}</Label>
                    <p className="text-xs text-muted-foreground truncate">{field.description}</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="h-8 w-12 rounded-md border border-border shadow-sm transition-transform hover:scale-105"
                        style={{ backgroundColor: `hsl(${currentColors[field.key]})` }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="end">
                      <Input
                        type="color"
                        value={hslToHex(currentColors[field.key])}
                        onChange={(e) => handleColorChange(activeColorMode, field.key, hexToHsl(e.target.value))}
                        className="h-24 w-24 p-1 cursor-pointer"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Border Radius */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Arredondamento de Bordas</Label>
                <span className="text-sm text-muted-foreground">{config.layout.borderRadius}px</span>
              </div>
              <Slider
                value={[config.layout.borderRadius]}
                onValueChange={([value]) => handleLayoutChange("borderRadius", value)}
                max={24}
                min={0}
                step={2}
                className="w-full"
              />
              <div className="flex gap-2 mt-2">
                {[0, 4, 8, 12, 16, 20].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleLayoutChange("borderRadius", val)}
                    className={cn(
                      "h-8 w-8 border transition-colors",
                      config.layout.borderRadius === val ? "border-primary bg-primary/10" : "border-border"
                    )}
                    style={{ borderRadius: `${val}px` }}
                  />
                ))}
              </div>
            </div>

            {/* Shadow Intensity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Intensidade de Sombras</Label>
                <span className="text-sm text-muted-foreground">{config.layout.shadowIntensity}%</span>
              </div>
              <Slider
                value={[config.layout.shadowIntensity]}
                onValueChange={([value]) => handleLayoutChange("shadowIntensity", value)}
                max={100}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex gap-3 mt-3">
                {[0, 25, 50, 75, 100].map((val) => (
                  <div
                    key={val}
                    onClick={() => handleLayoutChange("shadowIntensity", val)}
                    className={cn(
                      "h-12 w-12 bg-card border border-border rounded-lg cursor-pointer transition-all",
                      config.layout.shadowIntensity === val && "ring-2 ring-primary"
                    )}
                    style={{
                      boxShadow: `0 4px 6px -1px rgb(0 0 0 / ${val / 1000}), 0 2px 4px -2px rgb(0 0 0 / ${val / 1000})`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Layout Preview */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Label className="text-sm font-medium mb-4 block">Pré-visualização</Label>
            <div className="flex gap-3">
              <Button>Botão</Button>
              <Button variant="outline">Outline</Button>
              <div className="px-4 py-2 bg-muted rounded-lg text-sm">Card</div>
            </div>
          </div>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Font Family */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Família de Fonte</Label>
              <Select
                value={config.typography.fontFamily}
                onValueChange={(value) => handleTypographyChange("fontFamily", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tamanho Base</Label>
                <span className="text-sm text-muted-foreground">{config.typography.fontSize}px</span>
              </div>
              <Slider
                value={[config.typography.fontSize]}
                onValueChange={([value]) => handleTypographyChange("fontSize", value)}
                max={20}
                min={12}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Typography Preview */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4" style={{ fontFamily: config.typography.fontFamily }}>
            <Label className="text-sm font-medium mb-4 block">Pré-visualização</Label>
            <h1 className="text-2xl font-bold">Título Principal</h1>
            <h2 className="text-xl font-semibold text-muted-foreground">Subtítulo</h2>
            <p className="text-base">Texto parágrafo normal com a fonte selecionada.</p>
            <p className="text-sm text-muted-foreground">Texto pequeno secundário.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Personalização
        </Button>
      </div>
    </div>
  );
}
