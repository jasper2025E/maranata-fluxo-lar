import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Palette } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { cn } from "@/lib/utils";

interface WebsiteTheme {
  id: string;
  name: string;
  description: string;
  category: "moderno" | "classico" | "colorido" | "minimalista";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  font: string;
}

const themes: WebsiteTheme[] = [
  {
    id: "craft",
    name: "Craft",
    description: "Clean e moderno com tons azuis",
    category: "moderno",
    colors: {
      primary: "217 91% 60%",
      secondary: "210 40% 96%",
      accent: "217 91% 50%",
    },
    font: "Inter",
  },
  {
    id: "dawn",
    name: "Dawn",
    description: "Minimalista com verde suave",
    category: "minimalista",
    colors: {
      primary: "142 76% 36%",
      secondary: "142 40% 96%",
      accent: "142 76% 30%",
    },
    font: "Inter",
  },
  {
    id: "sense",
    name: "Sense",
    description: "Elegante com tons neutros",
    category: "classico",
    colors: {
      primary: "220 14% 35%",
      secondary: "220 14% 96%",
      accent: "220 14% 25%",
    },
    font: "Inter",
  },
  {
    id: "crave",
    name: "Crave",
    description: "Vibrante com laranja energético",
    category: "colorido",
    colors: {
      primary: "25 95% 53%",
      secondary: "25 40% 96%",
      accent: "25 95% 45%",
    },
    font: "Inter",
  },
  {
    id: "origin",
    name: "Origin",
    description: "Sofisticado com roxo moderno",
    category: "moderno",
    colors: {
      primary: "262 83% 58%",
      secondary: "262 40% 96%",
      accent: "262 83% 50%",
    },
    font: "Inter",
  },
  {
    id: "taste",
    name: "Taste",
    description: "Acolhedor com rosa delicado",
    category: "colorido",
    colors: {
      primary: "330 80% 60%",
      secondary: "330 40% 96%",
      accent: "330 80% 52%",
    },
    font: "Inter",
  },
  {
    id: "studio",
    name: "Studio",
    description: "Premium com dourado elegante",
    category: "classico",
    colors: {
      primary: "38 92% 40%",
      secondary: "38 40% 96%",
      accent: "38 92% 32%",
    },
    font: "Inter",
  },
  {
    id: "refresh",
    name: "Refresh",
    description: "Fresco com turquesa tropical",
    category: "moderno",
    colors: {
      primary: "174 72% 40%",
      secondary: "174 40% 96%",
      accent: "174 72% 32%",
    },
    font: "Inter",
  },
  {
    id: "colorblock",
    name: "Colorblock",
    description: "Divertido e multicolorido",
    category: "colorido",
    colors: {
      primary: "340 82% 52%",
      secondary: "180 70% 95%",
      accent: "45 93% 47%",
    },
    font: "Inter",
  },
];

const categories = [
  { id: "todos", label: "Todos os temas" },
  { id: "moderno", label: "Moderno" },
  { id: "classico", label: "Clássico" },
  { id: "colorido", label: "Colorido" },
  { id: "minimalista", label: "Minimalista" },
];

interface WebsiteThemeSelectorProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteThemeSelector({ config }: WebsiteThemeSelectorProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const filteredThemes = selectedCategory === "todos" 
    ? themes 
    : themes.filter(t => t.category === selectedCategory);

  const getCurrentThemeId = () => {
    const currentPrimary = config.primary_color;
    const match = themes.find(t => t.colors.primary === currentPrimary);
    return match?.id || null;
  };

  const handleApplyTheme = (theme: WebsiteTheme) => {
    updateWebsite.mutate({
      primary_color: theme.colors.primary,
      secondary_color: theme.colors.secondary,
      accent_color: theme.colors.accent,
      font_family: theme.font,
    });
  };

  const currentThemeId = getCurrentThemeId();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Palette className="h-4 w-4" />
          Temas
        </CardTitle>
        <CardDescription className="text-sm">
          Escolha um tema pronto para começar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Category Filter - Shopify style tabs */}
        <div className="flex gap-1 border-b">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors relative",
                selectedCategory === cat.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
              {selectedCategory === cat.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Themes Grid - Shopify style */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map((theme) => {
            const isActive = currentThemeId === theme.id;
            
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleApplyTheme(theme)}
                disabled={updateWebsite.isPending}
                className={cn(
                  "group relative rounded-lg border bg-card text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isActive && "ring-2 ring-primary"
                )}
              >
                {/* Theme Preview */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                  {/* Header bar */}
                  <div 
                    className="h-10 flex items-center justify-between px-3"
                    style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-white/20" />
                      <div className="h-2 w-12 rounded-full bg-white/40" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-2 w-8 rounded-full bg-white/30" />
                      <div className="h-2 w-8 rounded-full bg-white/30" />
                    </div>
                  </div>
                  
                  {/* Hero section */}
                  <div 
                    className="h-16 flex flex-col items-center justify-center px-4"
                    style={{ 
                      backgroundColor: `hsl(${theme.colors.secondary})`,
                    }}
                  >
                    <div 
                      className="h-2.5 w-24 rounded-full mb-1.5"
                      style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                    />
                    <div className="h-1.5 w-32 rounded-full bg-muted-foreground/20" />
                  </div>
                  
                  {/* Content cards */}
                  <div className="h-12 bg-background flex items-center justify-center gap-2 px-3">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i}
                        className="flex-1 h-7 rounded border"
                        style={{ 
                          backgroundColor: `hsl(${theme.colors.secondary})`,
                          borderColor: `hsl(${theme.colors.primary} / 0.2)`
                        }}
                      />
                    ))}
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        <Check className="h-3 w-3" />
                        Ativo
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{theme.name}</span>
                    {/* Color dots */}
                    <div className="flex -space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {updateWebsite.isPending && (
          <p className="text-center text-sm text-muted-foreground">
            Aplicando tema...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
