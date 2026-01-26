import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Palette, Sun, Moon, Leaf, Heart, Zap, BookOpen, GraduationCap, Baby } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { cn } from "@/lib/utils";

interface WebsiteTheme {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "moderno" | "classico" | "colorido" | "minimalista";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  font: string;
  preview: {
    headerBg: string;
    heroBg: string;
    cardBg: string;
    buttonBg: string;
    textColor: string;
  };
}

const themes: WebsiteTheme[] = [
  {
    id: "azul-profissional",
    name: "Azul Profissional",
    description: "Visual corporativo e confiável, ideal para escolas tradicionais",
    icon: <BookOpen className="h-5 w-5" />,
    category: "classico",
    colors: {
      primary: "217 91% 60%",
      secondary: "210 40% 96%",
      accent: "45 93% 47%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
    },
    font: "Inter",
    preview: {
      headerBg: "hsl(217, 91%, 60%)",
      heroBg: "linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(217, 91%, 45%) 100%)",
      cardBg: "hsl(210, 40%, 96%)",
      buttonBg: "hsl(217, 91%, 60%)",
      textColor: "hsl(222, 47%, 11%)",
    },
  },
  {
    id: "verde-natureza",
    name: "Verde Natureza",
    description: "Transmite crescimento e sustentabilidade",
    icon: <Leaf className="h-5 w-5" />,
    category: "moderno",
    colors: {
      primary: "142 76% 36%",
      secondary: "142 40% 96%",
      accent: "38 92% 50%",
      background: "0 0% 100%",
      foreground: "142 40% 15%",
    },
    font: "Poppins",
    preview: {
      headerBg: "hsl(142, 76%, 36%)",
      heroBg: "linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 28%) 100%)",
      cardBg: "hsl(142, 40%, 96%)",
      buttonBg: "hsl(142, 76%, 36%)",
      textColor: "hsl(142, 40%, 15%)",
    },
  },
  {
    id: "roxo-moderno",
    name: "Roxo Moderno",
    description: "Criativo e inovador, perfeito para escolas de tecnologia",
    icon: <Sparkles className="h-5 w-5" />,
    category: "moderno",
    colors: {
      primary: "262 83% 58%",
      secondary: "262 40% 96%",
      accent: "330 80% 60%",
      background: "0 0% 100%",
      foreground: "262 40% 15%",
    },
    font: "Montserrat",
    preview: {
      headerBg: "hsl(262, 83%, 58%)",
      heroBg: "linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(280, 70%, 45%) 100%)",
      cardBg: "hsl(262, 40%, 96%)",
      buttonBg: "hsl(262, 83%, 58%)",
      textColor: "hsl(262, 40%, 15%)",
    },
  },
  {
    id: "laranja-energia",
    name: "Laranja Energia",
    description: "Vibrante e acolhedor, ótimo para escolas infantis",
    icon: <Zap className="h-5 w-5" />,
    category: "colorido",
    colors: {
      primary: "25 95% 53%",
      secondary: "25 40% 96%",
      accent: "45 93% 47%",
      background: "0 0% 100%",
      foreground: "25 40% 15%",
    },
    font: "Lato",
    preview: {
      headerBg: "hsl(25, 95%, 53%)",
      heroBg: "linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(35, 95%, 50%) 100%)",
      cardBg: "hsl(25, 40%, 96%)",
      buttonBg: "hsl(25, 95%, 53%)",
      textColor: "hsl(25, 40%, 15%)",
    },
  },
  {
    id: "rosa-carinho",
    name: "Rosa Carinho",
    description: "Delicado e afetuoso, ideal para creches e berçários",
    icon: <Heart className="h-5 w-5" />,
    category: "colorido",
    colors: {
      primary: "330 80% 60%",
      secondary: "330 40% 96%",
      accent: "262 83% 58%",
      background: "0 0% 100%",
      foreground: "330 40% 15%",
    },
    font: "Poppins",
    preview: {
      headerBg: "hsl(330, 80%, 60%)",
      heroBg: "linear-gradient(135deg, hsl(330, 80%, 60%) 0%, hsl(300, 70%, 55%) 100%)",
      cardBg: "hsl(330, 40%, 96%)",
      buttonBg: "hsl(330, 80%, 60%)",
      textColor: "hsl(330, 40%, 15%)",
    },
  },
  {
    id: "dourado-premium",
    name: "Dourado Premium",
    description: "Elegante e sofisticado para escolas de alto padrão",
    icon: <GraduationCap className="h-5 w-5" />,
    category: "classico",
    colors: {
      primary: "38 92% 40%",
      secondary: "38 40% 96%",
      accent: "222 47% 20%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
    },
    font: "Montserrat",
    preview: {
      headerBg: "hsl(38, 92%, 40%)",
      heroBg: "linear-gradient(135deg, hsl(38, 92%, 40%) 0%, hsl(35, 85%, 35%) 100%)",
      cardBg: "hsl(38, 40%, 96%)",
      buttonBg: "hsl(38, 92%, 40%)",
      textColor: "hsl(222, 47%, 11%)",
    },
  },
  {
    id: "turquesa-tropical",
    name: "Turquesa Tropical",
    description: "Refrescante e moderno, transmite tranquilidade",
    icon: <Sun className="h-5 w-5" />,
    category: "moderno",
    colors: {
      primary: "174 72% 40%",
      secondary: "174 40% 96%",
      accent: "38 92% 50%",
      background: "0 0% 100%",
      foreground: "174 40% 15%",
    },
    font: "Open Sans",
    preview: {
      headerBg: "hsl(174, 72%, 40%)",
      heroBg: "linear-gradient(135deg, hsl(174, 72%, 40%) 0%, hsl(190, 70%, 35%) 100%)",
      cardBg: "hsl(174, 40%, 96%)",
      buttonBg: "hsl(174, 72%, 40%)",
      textColor: "hsl(174, 40%, 15%)",
    },
  },
  {
    id: "cinza-minimalista",
    name: "Cinza Minimalista",
    description: "Clean e elegante, foco total no conteúdo",
    icon: <Moon className="h-5 w-5" />,
    category: "minimalista",
    colors: {
      primary: "220 14% 35%",
      secondary: "220 14% 96%",
      accent: "217 91% 60%",
      background: "0 0% 100%",
      foreground: "220 14% 10%",
    },
    font: "Inter",
    preview: {
      headerBg: "hsl(220, 14%, 35%)",
      heroBg: "linear-gradient(135deg, hsl(220, 14%, 35%) 0%, hsl(220, 14%, 25%) 100%)",
      cardBg: "hsl(220, 14%, 96%)",
      buttonBg: "hsl(220, 14%, 35%)",
      textColor: "hsl(220, 14%, 10%)",
    },
  },
  {
    id: "arco-iris-infantil",
    name: "Arco-Íris Infantil",
    description: "Multicolorido e divertido para educação infantil",
    icon: <Baby className="h-5 w-5" />,
    category: "colorido",
    colors: {
      primary: "340 82% 52%",
      secondary: "180 70% 95%",
      accent: "45 93% 47%",
      background: "0 0% 100%",
      foreground: "222 47% 11%",
    },
    font: "Poppins",
    preview: {
      headerBg: "linear-gradient(90deg, hsl(340, 82%, 52%), hsl(25, 95%, 53%), hsl(45, 93%, 47%), hsl(142, 76%, 36%), hsl(217, 91%, 60%), hsl(262, 83%, 58%))",
      heroBg: "linear-gradient(135deg, hsl(340, 82%, 52%) 0%, hsl(25, 95%, 53%) 100%)",
      cardBg: "hsl(180, 70%, 95%)",
      buttonBg: "hsl(340, 82%, 52%)",
      textColor: "hsl(222, 47%, 11%)",
    },
  },
];

const categories = [
  { id: "todos", label: "Todos" },
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
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

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
    setSelectedTheme(theme.id);
  };

  const currentThemeId = getCurrentThemeId();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Temas Prontos
        </CardTitle>
        <CardDescription>
          Escolha um tema pronto e personalize depois se desejar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              type="button"
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Themes Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredThemes.map((theme) => {
            const isActive = currentThemeId === theme.id;
            const isSelected = selectedTheme === theme.id;
            
            return (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden",
                    isActive && "ring-2 ring-primary",
                    isSelected && "ring-2 ring-primary/50"
                  )}
                  onClick={() => handleApplyTheme(theme)}
                >
                  {/* Mini Preview */}
                  <div className="relative h-32 overflow-hidden">
                    {/* Header */}
                    <div 
                      className="h-8 flex items-center px-3"
                      style={{ background: theme.preview.headerBg }}
                    >
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                        <div className="w-2 h-2 rounded-full bg-white/30" />
                      </div>
                    </div>
                    
                    {/* Hero */}
                    <div 
                      className="h-16 flex items-center justify-center"
                      style={{ background: theme.preview.heroBg }}
                    >
                      <div className="text-center">
                        <div className="h-2 w-20 bg-white/90 rounded mx-auto mb-1" />
                        <div className="h-1.5 w-16 bg-white/60 rounded mx-auto" />
                      </div>
                    </div>
                    
                    {/* Cards */}
                    <div className="h-8 bg-white flex items-center justify-center gap-2 px-3">
                      <div 
                        className="w-8 h-5 rounded"
                        style={{ background: theme.preview.cardBg }}
                      />
                      <div 
                        className="w-8 h-5 rounded"
                        style={{ background: theme.preview.cardBg }}
                      />
                      <div 
                        className="w-8 h-5 rounded"
                        style={{ background: theme.preview.cardBg }}
                      />
                    </div>

                    {/* Active Badge */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white text-primary shadow-sm">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="p-1.5 rounded-lg"
                        style={{ 
                          backgroundColor: `hsl(${theme.colors.primary} / 0.1)`,
                          color: `hsl(${theme.colors.primary})`
                        }}
                      >
                        {theme.icon}
                      </div>
                      <h3 className="font-semibold text-sm">{theme.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                    
                    {/* Color Palette */}
                    <div className="flex gap-1 mt-3">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                        title="Primária"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                        title="Secundária"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                        title="Destaque"
                      />
                      <span className="text-xs text-muted-foreground ml-auto self-center">
                        {theme.font}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {updateWebsite.isPending && (
          <div className="text-center text-sm text-muted-foreground">
            Aplicando tema...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
