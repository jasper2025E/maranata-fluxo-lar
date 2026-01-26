import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformBranding {
  platformName: string;
  platformLogo: string | null;
  heroTitle: string;
  heroSubtitle: string;
  features: Array<{ icon: string; text: string }>;
  ctaPrimary: string;
  ctaSecondary: string;
  loginTitle: string;
  loginSubtitle: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  faviconUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "promo";
  link_url: string | null;
  link_text: string | null;
  show_on_login: boolean;
  show_on_landing: boolean;
}

const defaultBranding: PlatformBranding = {
  platformName: "Sistema de Gestão",
  platformLogo: null,
  heroTitle: "Gerencie sua escola com simplicidade",
  heroSubtitle: "Plataforma completa para gestão escolar. Alunos, financeiro, RH e muito mais em um só lugar.",
  features: [
    { icon: "GraduationCap", text: "Gestão completa de alunos e matrículas" },
    { icon: "CreditCard", text: "Financeiro integrado com múltiplos gateways" },
    { icon: "Users", text: "RH e controle de funcionários" },
    { icon: "BarChart3", text: "Relatórios e dashboards avançados" },
    { icon: "Shield", text: "Segurança e controle de acesso" },
    { icon: "Zap", text: "Automações e integrações" },
  ],
  ctaPrimary: "Entrar na Plataforma",
  ctaSecondary: "Cadastre sua escola",
  loginTitle: "Acesse sua conta",
  loginSubtitle: "Entre com seu email e senha para continuar",
  gradientFrom: "262 83% 58%",
  gradientVia: "292 84% 61%",
  gradientTo: "24 95% 53%",
  faviconUrl: null,
  metaTitle: null,
  metaDescription: null,
};

function extractValue<T>(data: { value: T } | null | undefined, fallback: T): T {
  if (!data || typeof data !== "object" || !("value" in data)) return fallback;
  return data.value ?? fallback;
}

export function usePlatformBranding() {
  return useQuery({
    queryKey: ["platform-branding"],
    queryFn: async (): Promise<PlatformBranding> => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching platform branding:", error);
        return defaultBranding;
      }

      if (!data || data.length === 0) {
        return defaultBranding;
      }

      const settings: Record<string, unknown> = {};
      data.forEach((row) => {
        const val = row.value as { value: unknown } | null;
        if (val && typeof val === "object" && "value" in val) {
          settings[row.key] = val.value;
        }
      });

      return {
        platformName: (settings.platform_name as string) || defaultBranding.platformName,
        platformLogo: (settings.platform_logo as string) || defaultBranding.platformLogo,
        heroTitle: (settings.landing_hero_title as string) || defaultBranding.heroTitle,
        heroSubtitle: (settings.landing_hero_subtitle as string) || defaultBranding.heroSubtitle,
        features: (settings.landing_features as PlatformBranding["features"]) || defaultBranding.features,
        ctaPrimary: (settings.landing_cta_primary as string) || defaultBranding.ctaPrimary,
        ctaSecondary: (settings.landing_cta_secondary as string) || defaultBranding.ctaSecondary,
        loginTitle: (settings.login_title as string) || defaultBranding.loginTitle,
        loginSubtitle: (settings.login_subtitle as string) || defaultBranding.loginSubtitle,
        gradientFrom: (settings.gradient_from as string) || defaultBranding.gradientFrom,
        gradientVia: (settings.gradient_via as string) || defaultBranding.gradientVia,
        gradientTo: (settings.gradient_to as string) || defaultBranding.gradientTo,
        faviconUrl: (settings.favicon_url as string) || defaultBranding.faviconUrl,
        metaTitle: (settings.meta_title as string) || defaultBranding.metaTitle,
        metaDescription: (settings.meta_description as string) || defaultBranding.metaDescription,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePlatformAnnouncements(location: "login" | "landing") {
  return useQuery({
    queryKey: ["platform-announcements", location],
    queryFn: async (): Promise<Announcement[]> => {
      const column = location === "login" ? "show_on_login" : "show_on_landing";
      
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("id, title, message, type, link_url, link_text, show_on_login, show_on_landing")
        .eq("active", true)
        .eq(column, true)
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .lte("starts_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        return [];
      }

      return (data || []) as Announcement[];
    },
    staleTime: 1000 * 60 * 2,
  });
}
