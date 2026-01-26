import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformSettings {
  platform_name: string;
  platform_slug: string;
  platform_url: string;
  support_email: string;
  max_schools: number;
  max_users_per_school: number;
  max_students_per_school: number;
  enable_new_registrations: boolean;
  enable_email_notifications: boolean;
  enable_maintenance_mode: boolean;
  stripe_enabled: boolean;
  asaas_enabled: boolean;
}

const defaultSettings: PlatformSettings = {
  platform_name: "Sistema de Gestão",
  platform_slug: "sistema-gestao",
  platform_url: "",
  support_email: "",
  max_schools: 100,
  max_users_per_school: 10,
  max_students_per_school: 500,
  enable_new_registrations: true,
  enable_email_notifications: true,
  enable_maintenance_mode: false,
  stripe_enabled: true,
  asaas_enabled: true,
};

// Generate a URL-safe slug from the platform name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/-+/g, "-") // Replace multiple dashes with single
    .trim();
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async (): Promise<PlatformSettings> => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching platform settings:", error);
        return defaultSettings;
      }

      if (!data || data.length === 0) {
        return defaultSettings;
      }

      const settings: Partial<PlatformSettings> = {};
      
      data.forEach((setting) => {
        const value = setting.value;
        if (typeof value === "object" && value !== null && "value" in value) {
          (settings as Record<string, unknown>)[setting.key] = (value as { value: unknown }).value;
        }
      });

      const platformName = (settings.platform_name as string) || defaultSettings.platform_name;
      const platformSlug = generateSlug(platformName);

      return {
        ...defaultSettings,
        ...settings,
        platform_name: platformName,
        platform_slug: platformSlug,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function usePlatformName() {
  const { data } = usePlatformSettings();
  return {
    name: data?.platform_name || defaultSettings.platform_name,
    slug: data?.platform_slug || defaultSettings.platform_slug,
    url: data?.platform_url || "",
  };
}
