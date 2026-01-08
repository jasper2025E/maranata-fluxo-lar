import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LandingConfig } from "@/pages/LandingPage";

interface EditorConfig {
  hero: {
    titulo: string;
    subtitulo: string;
    ctaPrimario: string;
    ctaSecundario: string;
    imagemUrl?: string;
  };
  sobre: {
    titulo: string;
    descricao: string;
    cards: Array<{
      icone: string;
      titulo: string;
      descricao: string;
    }>;
  };
  comoFunciona: {
    titulo: string;
    passos: Array<{
      numero: number;
      titulo: string;
      descricao: string;
    }>;
  };
  planos: {
    titulo: string;
    subtitulo: string;
  };
  inscricao: {
    titulo: string;
    subtitulo: string;
  };
  footer: {
    telefone: string;
    email: string;
    endereco: string;
  };
  cores: {
    primaria: string;
    secundaria: string;
    destaque: string;
  };
}

// Convert editor config format to landing page config format
function convertEditorToLandingConfig(editorConfig: EditorConfig): Partial<LandingConfig> {
  return {
    hero: {
      titulo: editorConfig.hero.titulo,
      subtitulo: editorConfig.hero.subtitulo,
      cta_primario: editorConfig.hero.ctaPrimario,
      cta_secundario: editorConfig.hero.ctaSecundario,
      imagem_fundo: editorConfig.hero.imagemUrl,
    },
    sobre: {
      titulo: editorConfig.sobre.titulo,
      descricao: editorConfig.sobre.descricao,
      cards: editorConfig.sobre.cards,
    },
    como_funciona: {
      titulo: editorConfig.comoFunciona.titulo,
      passos: editorConfig.comoFunciona.passos,
    },
    planos: {
      titulo: editorConfig.planos.titulo,
      subtitulo: editorConfig.planos.subtitulo,
    },
    inscricao: {
      titulo: editorConfig.inscricao.titulo,
      subtitulo: editorConfig.inscricao.subtitulo,
    },
    cores: {
      primaria: editorConfig.cores.primaria,
      secundaria: editorConfig.cores.secundaria,
      accent: editorConfig.cores.destaque,
    },
  };
}

export function useLandingConfig() {
  return useQuery({
    queryKey: ["landing-page-config-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_config")
        .select("*")
        .eq("chave", "landing_page_config")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching landing config:", error);
        return null;
      }
      
      if (!data?.valor) return null;
      
      const editorConfig = data.valor as unknown as EditorConfig;
      return convertEditorToLandingConfig(editorConfig);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
