import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { updateThemeConfigCache } from "@/hooks/useThemeConfig";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const colorPresets = [
  { name: "Azul", primary: "221 83% 53%" },
  { name: "Verde", primary: "152 69% 40%" },
  { name: "Roxo", primary: "262 83% 58%" },
  { name: "Laranja", primary: "25 95% 53%" },
  { name: "Rosa", primary: "340 82% 52%" },
  { name: "Ciano", primary: "185 94% 35%" },
];

interface SidebarColorPickerProps {
  isCollapsed: boolean;
}

export function SidebarColorPicker({ isCollapsed }: SidebarColorPickerProps) {
  const { user } = useAuth();
  const [currentPrimary, setCurrentPrimary] = useState("221 83% 53%");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentColor();
    }
  }, [user]);

  const loadCurrentColor = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("user_preferences")
        .select("custom_colors")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.custom_colors && typeof data.custom_colors === 'object') {
        const saved = data.custom_colors as Record<string, unknown>;
        const lightColors = saved.lightColors as Record<string, string> | undefined;
        if (lightColors?.primary) {
          setCurrentPrimary(lightColors.primary);
        }
      }
    } catch (error) {
      console.error("Error loading color:", error);
    }
  };

  const handleColorSelect = async (primary: string) => {
    if (!user) return;
    
    setSaving(true);
    setCurrentPrimary(primary);

    // Apply immediately to CSS
    const root = document.documentElement;
    const accent = primary.replace(/(\d+)%$/, (_, l) => `${Math.min(96, parseInt(l) + 40)}%`);
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--ring", primary);

    try {
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("custom_colors")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentConfig = (existing?.custom_colors as Record<string, unknown>) || {};
      const lightColors = (currentConfig.lightColors as Record<string, string>) || {};
      const darkColors = (currentConfig.darkColors as Record<string, string>) || {};

      const newConfig = {
        ...currentConfig,
        lightColors: { ...lightColors, primary, accent, sidebarPrimary: primary },
        darkColors: { ...darkColors, primary, accent, sidebarPrimary: primary },
      };

      if (existing) {
        await supabase
          .from("user_preferences")
          .update({ custom_colors: newConfig })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_preferences")
          .insert([{ user_id: user.id, custom_colors: newConfig }]);
      }

      updateThemeConfigCache(newConfig as any);
      toast.success("Cor aplicada!");
    } catch (error) {
      console.error("Error saving color:", error);
      toast.error("Erro ao salvar cor");
    } finally {
      setSaving(false);
    }
  };

  const TriggerButton = (
    <button
      type="button"
      className={cn(
        isCollapsed 
          ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" 
          : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
        "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        "transition-colors duration-150"
      )}
    >
      <Palette className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
      {!isCollapsed && <span className="text-sm">Cor do tema</span>}
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild>
                {TriggerButton}
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Cor do tema
            </TooltipContent>
          </Tooltip>
        ) : (
          <SidebarMenuButton asChild>
            {TriggerButton}
          </SidebarMenuButton>
        )}
      </PopoverTrigger>
      <PopoverContent 
        side={isCollapsed ? "right" : "top"} 
        align="start"
        className="w-auto p-3 bg-popover border-border"
      >
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Escolha uma cor</p>
          <div className="flex gap-2">
            {colorPresets.map((preset) => (
              <Tooltip key={preset.name}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleColorSelect(preset.primary)}
                    disabled={saving}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center",
                      currentPrimary === preset.primary 
                        ? "border-foreground ring-2 ring-foreground/20" 
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: `hsl(${preset.primary})` }}
                  >
                    {currentPrimary === preset.primary && (
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {preset.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
