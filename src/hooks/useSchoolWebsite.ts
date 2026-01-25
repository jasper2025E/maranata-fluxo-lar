import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

export interface SchoolWebsiteConfig {
  id: string;
  tenant_id: string;
  enabled: boolean;
  slug: string | null;
  custom_domain: string | null;
  
  // Hero
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_background_url: string | null;
  hero_badge_text: string;
  
  // Sobre
  about_title: string;
  about_description: string | null;
  about_features: Array<{ icone: string; titulo: string; descricao: string }>;
  
  // Diferenciais
  differentials: Array<{ icone: string; titulo: string; descricao: string }>;
  
  // Galeria
  gallery_images: Array<{ url: string; caption: string }>;
  
  // Steps
  steps: Array<{ numero: number; titulo: string; descricao: string }>;
  
  // Depoimentos
  testimonials: Array<{ nome: string; cargo: string; texto: string; foto_url: string | null }>;
  
  // Contato
  contact_title: string;
  contact_subtitle: string | null;
  whatsapp_number: string | null;
  show_map: boolean;
  map_embed_url: string | null;
  
  // Pré-matrícula
  prematricula_enabled: boolean;
  prematricula_title: string;
  prematricula_subtitle: string | null;
  prematricula_fields: string[];
  
  // SEO
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
  
  // Cores
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  
  // Redes sociais
  social_links: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
  };
  
  // Tracking
  facebook_pixel_id: string | null;
  google_analytics_id: string | null;
  google_tag_manager_id: string | null;
  
  // Footer
  footer_text: string | null;
  show_powered_by: boolean;
  
  created_at: string;
  updated_at: string;
}

export function useSchoolWebsite() {
  const { data: tenant } = useTenant();

  return useQuery({
    queryKey: ["school-website", tenant?.id],
    queryFn: async (): Promise<SchoolWebsiteConfig | null> => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from("school_website_config")
        .select("*")
        .eq("tenant_id", tenant.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching school website config:", error);
        throw error;
      }

      return data as SchoolWebsiteConfig | null;
    },
    enabled: !!tenant?.id,
  });
}

export function useSchoolWebsiteBySlug(slug: string) {
  return useQuery({
    queryKey: ["school-website-public", slug],
    queryFn: async (): Promise<SchoolWebsiteConfig | null> => {
      const { data, error } = await supabase
        .from("school_website_config")
        .select("*")
        .eq("slug", slug)
        .eq("enabled", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching public school website:", error);
        throw error;
      }

      return data as SchoolWebsiteConfig | null;
    },
    enabled: !!slug,
  });
}

export function useCreateSchoolWebsite() {
  const queryClient = useQueryClient();
  const { data: tenant } = useTenant();

  return useMutation({
    mutationFn: async () => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("school_website_config")
        .insert({
          tenant_id: tenant.id,
          enabled: false,
          slug: tenant.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-website"] });
      toast.success("Site escolar criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating school website:", error);
      toast.error("Erro ao criar site escolar");
    },
  });
}

export function useUpdateSchoolWebsite() {
  const queryClient = useQueryClient();
  const { data: tenant } = useTenant();

  return useMutation({
    mutationFn: async (updates: Partial<SchoolWebsiteConfig>) => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("school_website_config")
        .update(updates)
        .eq("tenant_id", tenant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-website"] });
      toast.success("Site atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating school website:", error);
      toast.error("Erro ao atualizar site");
    },
  });
}

export function useToggleSchoolWebsite() {
  const queryClient = useQueryClient();
  const { data: tenant } = useTenant();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!tenant?.id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("school_website_config")
        .update({ enabled })
        .eq("tenant_id", tenant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["school-website"] });
      toast.success(data.enabled ? "Site publicado!" : "Site despublicado");
    },
    onError: (error) => {
      console.error("Error toggling school website:", error);
      toast.error("Erro ao alterar status do site");
    },
  });
}
