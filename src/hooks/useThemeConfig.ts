import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Cache to avoid repeated DB calls
let configCache: ThemeConfig | null = null;
let lastUserId: string | null = null;

export function applyThemeConfig(cfg: ThemeConfig, isDark: boolean) {
  if (!cfg || !cfg.lightColors || !cfg.darkColors || !cfg.layout || !cfg.typography) return;
  const root = document.documentElement;
  const colors = isDark ? cfg.darkColors : cfg.lightColors;

  const getLightness = (hsl: string): number => {
    const match = hsl.match(/\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+(\d+(?:\.\d+)?)%/);
    return match ? Number(match[1]) : 50;
  };

  const sidebarIsLight = getLightness(colors.sidebarBackground) >= 45;
  const sidebarForeground = sidebarIsLight ? "222 47% 11%" : "210 40% 98%";
  const sidebarAccent = sidebarIsLight ? "220 14% 90%" : "222 35% 18%";
  const sidebarAccentForeground = sidebarIsLight ? "222 47% 11%" : "210 40% 98%";
  const sidebarBorder = sidebarIsLight ? "220 13% 84%" : "222 35% 18%";

  // Apply colors
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--success", colors.success);
  root.style.setProperty("--warning", colors.warning);
  root.style.setProperty("--destructive", colors.destructive);
  root.style.setProperty("--sidebar-background", colors.sidebarBackground);
  root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
  root.style.setProperty("--sidebar-foreground", sidebarForeground);
  root.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-accent", sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", sidebarBorder);
  root.style.setProperty("--ring", colors.primary);

  // Apply layout
  root.style.setProperty("--radius", `${cfg.layout.borderRadius / 16}rem`);

  // Apply shadow based on intensity
  const shadowOpacity = cfg.layout.shadowIntensity / 100;
  root.style.setProperty(
    "--shadow-sm",
    `0 1px 2px 0 rgb(0 0 0 / ${shadowOpacity * 0.05})`
  );
  root.style.setProperty(
    "--shadow",
    `0 1px 3px 0 rgb(0 0 0 / ${shadowOpacity * 0.1}), 0 1px 2px -1px rgb(0 0 0 / ${shadowOpacity * 0.1})`
  );
  root.style.setProperty(
    "--shadow-md",
    `0 4px 6px -1px rgb(0 0 0 / ${shadowOpacity * 0.1}), 0 2px 4px -2px rgb(0 0 0 / ${shadowOpacity * 0.1})`
  );
  root.style.setProperty(
    "--shadow-lg",
    `0 10px 15px -3px rgb(0 0 0 / ${shadowOpacity * 0.1}), 0 4px 6px -4px rgb(0 0 0 / ${shadowOpacity * 0.1})`
  );

  // Apply typography
  root.style.setProperty("--font-sans", cfg.typography.fontFamily);
  root.style.fontSize = `${cfg.typography.fontSize}px`;
}

export function clearThemeConfigCache() {
  configCache = null;
  lastUserId = null;
}

export function updateThemeConfigCache(config: ThemeConfig) {
  configCache = config;
}

export function useThemeConfig(userId: string | null) {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      // Reset to defaults when logged out
      appliedRef.current = false;
      return;
    }

    // Skip if already applied for this user
    if (appliedRef.current && lastUserId === userId && configCache) {
      const isDark = document.documentElement.classList.contains("dark");
      applyThemeConfig(configCache, isDark);
      return;
    }

    const loadAndApply = async () => {
      // Use cache if available
      if (configCache && lastUserId === userId) {
        const isDark = document.documentElement.classList.contains("dark");
        applyThemeConfig(configCache, isDark);
        appliedRef.current = true;
        return;
      }

      try {
        const { data } = await supabase
          .from("user_preferences")
          .select("custom_colors")
          .eq("user_id", userId)
          .maybeSingle();

        let config: ThemeConfig = {
          lightColors: defaultLightColors,
          darkColors: defaultDarkColors,
          layout: defaultLayout,
          typography: defaultTypography,
        };

        if (data?.custom_colors && typeof data.custom_colors === "object") {
          const saved = data.custom_colors as Record<string, unknown>;
          const savedLight = (saved.lightColors as Partial<ColorConfig>) || {};
          const savedDark = (saved.darkColors as Partial<ColorConfig>) || {};
          const savedLayout = (saved.layout as Partial<LayoutConfig>) || {};
          const savedTypography = (saved.typography as Partial<TypographyConfig>) || {};

          config = {
            lightColors: { ...defaultLightColors, ...savedLight },
            darkColors: { ...defaultDarkColors, ...savedDark },
            layout: { ...defaultLayout, ...savedLayout },
            typography: { ...defaultTypography, ...savedTypography },
          };
        }

        configCache = config;
        lastUserId = userId;

        const isDark = document.documentElement.classList.contains("dark");
        applyThemeConfig(config, isDark);
        appliedRef.current = true;
      } catch (error) {
        console.error("Error loading theme config:", error);
      }
    };

    loadAndApply();
  }, [userId]);

  // Re-apply when dark mode changes
  useEffect(() => {
    if (!configCache) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const isDark = document.documentElement.classList.contains("dark");
          applyThemeConfig(configCache!, isDark);
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);
}
