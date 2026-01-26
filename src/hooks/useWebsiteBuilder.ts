import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEscola } from "./useEscola";
import { toast } from "sonner";

export interface WebsitePage {
  id: string;
  tenant_id: string;
  website_id: string;
  slug: string;
  title: string;
  description: string | null;
  is_homepage: boolean;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteBlock {
  id: string;
  tenant_id: string;
  page_id: string;
  block_type: string;
  block_order: number;
  is_visible: boolean;
  settings: Record<string, unknown>;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BlockType = 
  | "hero"
  | "text"
  | "features"
  | "gallery"
  | "testimonials"
  | "faq"
  | "video"
  | "cta"
  | "pricing"
  | "contact"
  | "map"
  | "timeline"
  | "team"
  | "stats"
  | "banner"
  | "divider"
  | "prematricula";

export interface BlockDefinition {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  category: "layout" | "content" | "media" | "forms";
  defaultContent: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
}

export const blockLibrary: BlockDefinition[] = [
  {
    type: "hero",
    name: "Hero",
    description: "Seção principal com título, subtítulo e botões",
    icon: "Sparkles",
    category: "layout",
    defaultContent: {
      title: "Título Principal",
      subtitle: "Subtítulo descritivo da sua escola",
      badge: "Matrículas Abertas",
      cta_primary: "Matricule-se",
      cta_secondary: "Saiba Mais",
    },
    defaultSettings: {
      background_type: "gradient",
      show_badge: true,
    },
  },
  {
    type: "text",
    name: "Texto",
    description: "Bloco de texto com título e parágrafo",
    icon: "Type",
    category: "content",
    defaultContent: {
      title: "Título da Seção",
      text: "Digite seu texto aqui...",
    },
    defaultSettings: {
      alignment: "center",
      max_width: "3xl",
    },
  },
  {
    type: "features",
    name: "Recursos",
    description: "Grade de cards com ícones e descrições",
    icon: "Grid3x3",
    category: "content",
    defaultContent: {
      title: "Nossos Diferenciais",
      items: [
        { icon: "Star", title: "Qualidade", description: "Ensino de excelência" },
        { icon: "Users", title: "Comunidade", description: "Ambiente acolhedor" },
        { icon: "Award", title: "Resultados", description: "Aprovações comprovadas" },
      ],
    },
    defaultSettings: {
      columns: 3,
      style: "cards",
    },
  },
  {
    type: "gallery",
    name: "Galeria",
    description: "Carrossel ou grade de imagens",
    icon: "Images",
    category: "media",
    defaultContent: {
      title: "Nossa Estrutura",
      images: [],
    },
    defaultSettings: {
      layout: "carousel",
      aspect_ratio: "16:9",
    },
  },
  {
    type: "testimonials",
    name: "Depoimentos",
    description: "Citações de pais e alunos",
    icon: "Quote",
    category: "content",
    defaultContent: {
      title: "O que dizem sobre nós",
      items: [],
    },
    defaultSettings: {
      columns: 3,
      show_photos: true,
    },
  },
  {
    type: "faq",
    name: "FAQ",
    description: "Perguntas frequentes com accordion",
    icon: "HelpCircle",
    category: "content",
    defaultContent: {
      title: "Perguntas Frequentes",
      items: [
        { question: "Qual o horário de funcionamento?", answer: "Das 7h às 18h" },
      ],
    },
    defaultSettings: {
      style: "accordion",
    },
  },
  {
    type: "video",
    name: "Vídeo",
    description: "Embed de vídeo YouTube ou Vimeo",
    icon: "Play",
    category: "media",
    defaultContent: {
      title: "Conheça nossa escola",
      video_url: "",
    },
    defaultSettings: {
      aspect_ratio: "16:9",
      autoplay: false,
    },
  },
  {
    type: "cta",
    name: "Chamada para Ação",
    description: "Banner com botão de ação destacado",
    icon: "MousePointerClick",
    category: "layout",
    defaultContent: {
      title: "Pronto para começar?",
      subtitle: "Entre em contato conosco",
      button_text: "Fale Conosco",
      button_url: "#contato",
    },
    defaultSettings: {
      style: "gradient",
    },
  },
  {
    type: "pricing",
    name: "Preços",
    description: "Tabela de planos e mensalidades",
    icon: "CreditCard",
    category: "content",
    defaultContent: {
      title: "Investimento",
      items: [],
    },
    defaultSettings: {
      columns: 3,
      highlight_popular: true,
    },
  },
  {
    type: "contact",
    name: "Contato",
    description: "Informações de contato e links",
    icon: "Phone",
    category: "forms",
    defaultContent: {
      title: "Entre em Contato",
      subtitle: "Estamos prontos para atender você",
      whatsapp: "",
      email: "",
      address: "",
    },
    defaultSettings: {
      show_map: false,
    },
  },
  {
    type: "map",
    name: "Mapa",
    description: "Localização com Google Maps",
    icon: "MapPin",
    category: "media",
    defaultContent: {
      title: "Nossa Localização",
      embed_url: "",
    },
    defaultSettings: {
      height: 400,
    },
  },
  {
    type: "timeline",
    name: "Timeline",
    description: "Histórico ou processo em etapas",
    icon: "GitBranch",
    category: "content",
    defaultContent: {
      title: "Como Funciona",
      items: [
        { step: 1, title: "Agende uma visita", description: "Conheça nossa estrutura" },
        { step: 2, title: "Faça a matrícula", description: "Processo simples e rápido" },
        { step: 3, title: "Bem-vindo!", description: "Início das aulas" },
      ],
    },
    defaultSettings: {
      style: "vertical",
    },
  },
  {
    type: "team",
    name: "Equipe",
    description: "Apresentação da equipe pedagógica",
    icon: "Users",
    category: "content",
    defaultContent: {
      title: "Nossa Equipe",
      items: [],
    },
    defaultSettings: {
      columns: 4,
      show_role: true,
    },
  },
  {
    type: "stats",
    name: "Estatísticas",
    description: "Números e métricas em destaque",
    icon: "BarChart",
    category: "content",
    defaultContent: {
      items: [
        { value: "500+", label: "Alunos" },
        { value: "15", label: "Anos de Experiência" },
        { value: "98%", label: "Aprovação" },
      ],
    },
    defaultSettings: {
      columns: 3,
      animated: true,
    },
  },
  {
    type: "banner",
    name: "Banner",
    description: "Faixa de destaque com texto",
    icon: "Megaphone",
    category: "layout",
    defaultContent: {
      text: "🎉 Matrículas abertas para 2025!",
      link_text: "Saiba mais",
      link_url: "#",
    },
    defaultSettings: {
      style: "info",
    },
  },
  {
    type: "divider",
    name: "Divisor",
    description: "Separador visual entre seções",
    icon: "Minus",
    category: "layout",
    defaultContent: {},
    defaultSettings: {
      style: "line",
      spacing: "md",
    },
  },
  {
    type: "prematricula",
    name: "Formulário de Pré-Matrícula",
    description: "Captura de leads para matrícula",
    icon: "FileEdit",
    category: "forms",
    defaultContent: {
      title: "Inscreva-se Agora",
      subtitle: "Preencha o formulário para garantir sua vaga",
    },
    defaultSettings: {
      fields: ["nome_aluno", "nome_responsavel", "email", "telefone"],
    },
  },
];

// Hooks
export function useWebsitePages(websiteId: string | undefined) {
  return useQuery({
    queryKey: ["website-pages", websiteId],
    queryFn: async (): Promise<WebsitePage[]> => {
      if (!websiteId) return [];

      const { data, error } = await supabase
        .from("school_website_pages")
        .select("*")
        .eq("website_id", websiteId)
        .order("is_homepage", { ascending: false })
        .order("title");

      if (error) throw error;
      return data as unknown as WebsitePage[];
    },
    enabled: !!websiteId,
  });
}

export function usePageBlocks(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page-blocks", pageId],
    queryFn: async (): Promise<WebsiteBlock[]> => {
      if (!pageId) return [];

      const { data, error } = await supabase
        .from("school_website_blocks")
        .select("*")
        .eq("page_id", pageId)
        .order("block_order");

      if (error) throw error;
      return data as unknown as WebsiteBlock[];
    },
    enabled: !!pageId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  const { data: escola } = useEscola();

  return useMutation({
    mutationFn: async (params: { 
      websiteId: string; 
      title: string; 
      slug: string;
      isHomepage?: boolean;
    }) => {
      if (!escola?.tenant_id) throw new Error("Escola não encontrada");

      const { data, error } = await supabase
        .from("school_website_pages")
        .insert({
          tenant_id: escola.tenant_id,
          website_id: params.websiteId,
          title: params.title,
          slug: params.slug,
          is_homepage: params.isHomepage || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website-pages", variables.websiteId] });
      toast.success("Página criada!");
    },
    onError: (error) => {
      console.error("Error creating page:", error);
      toast.error("Erro ao criar página");
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      pageId: string; 
      websiteId: string;
      updates: Partial<WebsitePage>;
    }) => {
      const { data, error } = await supabase
        .from("school_website_pages")
        .update(params.updates)
        .eq("id", params.pageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website-pages", variables.websiteId] });
      toast.success("Página atualizada!");
    },
    onError: (error) => {
      console.error("Error updating page:", error);
      toast.error("Erro ao atualizar página");
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { pageId: string; websiteId: string }) => {
      const { error } = await supabase
        .from("school_website_pages")
        .delete()
        .eq("id", params.pageId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website-pages", variables.websiteId] });
      toast.success("Página excluída!");
    },
    onError: (error) => {
      console.error("Error deleting page:", error);
      toast.error("Erro ao excluir página");
    },
  });
}

export function useCreateBlock() {
  const queryClient = useQueryClient();
  const { data: escola } = useEscola();

  return useMutation({
    mutationFn: async (params: { 
      pageId: string; 
      blockType: BlockType;
      order?: number;
    }) => {
      if (!escola?.tenant_id) throw new Error("Escola não encontrada");

      const definition = blockLibrary.find(b => b.type === params.blockType);
      if (!definition) throw new Error("Tipo de bloco inválido");

      // Get max order
      const { data: blocks } = await supabase
        .from("school_website_blocks")
        .select("block_order")
        .eq("page_id", params.pageId)
        .order("block_order", { ascending: false })
        .limit(1);

      const maxOrder = blocks?.[0]?.block_order ?? -1;

      const insertData = {
        tenant_id: escola.tenant_id,
        page_id: params.pageId,
        block_type: params.blockType,
        block_order: params.order ?? maxOrder + 1,
        content: definition.defaultContent,
        settings: definition.defaultSettings,
      };

      const { data, error } = await supabase
        .from("school_website_blocks")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["page-blocks", variables.pageId] });
      toast.success("Bloco adicionado!");
    },
    onError: (error) => {
      console.error("Error creating block:", error);
      toast.error("Erro ao adicionar bloco");
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      blockId: string; 
      pageId: string;
      updates: Partial<WebsiteBlock>;
    }) => {
      const { data, error } = await supabase
        .from("school_website_blocks")
        .update(params.updates as unknown as Record<string, unknown>)
        .eq("id", params.blockId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["page-blocks", variables.pageId] });
    },
    onError: (error) => {
      console.error("Error updating block:", error);
      toast.error("Erro ao atualizar bloco");
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { blockId: string; pageId: string }) => {
      const { error } = await supabase
        .from("school_website_blocks")
        .delete()
        .eq("id", params.blockId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["page-blocks", variables.pageId] });
      toast.success("Bloco removido!");
    },
    onError: (error) => {
      console.error("Error deleting block:", error);
      toast.error("Erro ao remover bloco");
    },
  });
}

export function useReorderBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      pageId: string;
      blocks: Array<{ id: string; order: number }>;
    }) => {
      // Update each block's order
      for (const block of params.blocks) {
        const { error } = await supabase
          .from("school_website_blocks")
          .update({ block_order: block.order })
          .eq("id", block.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["page-blocks", variables.pageId] });
    },
    onError: (error) => {
      console.error("Error reordering blocks:", error);
      toast.error("Erro ao reordenar blocos");
    },
  });
}
