import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface MarketingDomain {
  id: string;
  nome: string;
  dominio: string;
  status: 'pending' | 'active' | 'error';
  ssl_ativo: boolean;
  verificado: boolean;
  verificacao_token: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  notas: string | null;
}

export interface MarketingPixel {
  id: string;
  nome: string;
  tipo: 'meta' | 'google_ads' | 'google_analytics' | 'tiktok' | 'custom';
  pixel_id: string;
  ativo: boolean;
  configuracao: unknown;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface MarketingLandingPage {
  id: string;
  nome: string;
  slug: string;
  domain_id: string | null;
  status: 'draft' | 'published' | 'archived';
  conteudo: unknown;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  versao: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  domain?: MarketingDomain;
  pixels?: MarketingPixel[];
}

export interface MarketingPixelEvent {
  id: string;
  pixel_id: string;
  nome: string;
  tipo: string;
  parametros: unknown;
  ativo: boolean;
  created_at: string;
}

export interface MarketingPageView {
  id: string;
  page_id: string;
  visitor_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  created_at: string;
}

export interface MarketingConversion {
  id: string;
  page_id: string;
  pixel_id: string | null;
  event_name: string;
  visitor_id: string | null;
  valor: number | null;
  dados: unknown;
  created_at: string;
}

export interface MarketingConfig {
  id: string;
  chave: string;
  valor: unknown;
  descricao: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Query Keys
export const marketingKeys = {
  all: ['marketing'] as const,
  domains: () => [...marketingKeys.all, 'domains'] as const,
  domain: (id: string) => [...marketingKeys.domains(), id] as const,
  pixels: () => [...marketingKeys.all, 'pixels'] as const,
  pixel: (id: string) => [...marketingKeys.pixels(), id] as const,
  pages: () => [...marketingKeys.all, 'pages'] as const,
  page: (id: string) => [...marketingKeys.pages(), id] as const,
  pageViews: (pageId?: string) => [...marketingKeys.all, 'pageViews', pageId] as const,
  conversions: (pageId?: string) => [...marketingKeys.all, 'conversions', pageId] as const,
  config: () => [...marketingKeys.all, 'config'] as const,
  stats: () => [...marketingKeys.all, 'stats'] as const,
};

// Domains Hooks
export function useMarketingDomains() {
  return useQuery({
    queryKey: marketingKeys.domains(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_domains')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingDomain[];
    },
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (domain: Partial<MarketingDomain>) => {
      const { data, error } = await supabase
        .from('marketing_domains')
        .insert({
          nome: domain.nome,
          dominio: domain.dominio,
          notas: domain.notas,
          verificacao_token: crypto.randomUUID(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.domains() });
      toast.success('Domínio adicionado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao adicionar domínio: ' + error.message);
    },
  });
}

export function useUpdateDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketingDomain> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_domains')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.domains() });
      toast.success('Domínio atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar domínio: ' + error.message);
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_domains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.domains() });
      toast.success('Domínio removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover domínio: ' + error.message);
    },
  });
}

// Pixels Hooks
export function useMarketingPixels() {
  return useQuery({
    queryKey: marketingKeys.pixels(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_pixels')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingPixel[];
    },
  });
}

export function useCreatePixel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pixel: Partial<MarketingPixel>) => {
      const { data, error } = await supabase
        .from('marketing_pixels')
        .insert({
          nome: pixel.nome!,
          tipo: pixel.tipo!,
          pixel_id: pixel.pixel_id!,
          configuracao: (pixel.configuracao || {}) as object,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pixels() });
      toast.success('Pixel criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar pixel: ' + error.message);
    },
  });
}

export function useUpdatePixel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketingPixel> & { id: string }) => {
      const updateData = { ...updates } as Record<string, unknown>;
      if (updateData.configuracao) {
        updateData.configuracao = updateData.configuracao as object;
      }
      const { data, error } = await supabase
        .from('marketing_pixels')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pixels() });
      toast.success('Pixel atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar pixel: ' + error.message);
    },
  });
}

export function useDeletePixel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_pixels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pixels() });
      toast.success('Pixel removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover pixel: ' + error.message);
    },
  });
}

// Pixel Events Hooks
export function usePixelEvents(pixelId: string) {
  return useQuery({
    queryKey: [...marketingKeys.pixel(pixelId), 'events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_pixel_events')
        .select('*')
        .eq('pixel_id', pixelId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingPixelEvent[];
    },
    enabled: !!pixelId,
  });
}

export function useCreatePixelEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Partial<MarketingPixelEvent>) => {
      const { data, error } = await supabase
        .from('marketing_pixel_events')
        .insert({
          pixel_id: event.pixel_id!,
          nome: event.nome!,
          tipo: event.tipo || 'custom',
          parametros: (event.parametros || {}) as object,
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...marketingKeys.pixel(data.pixel_id), 'events'] });
      toast.success('Evento criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar evento: ' + error.message);
    },
  });
}

// Landing Pages Hooks
export function useMarketingPages() {
  return useQuery({
    queryKey: marketingKeys.pages(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_landing_pages')
        .select(`
          *,
          domain:marketing_domains(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MarketingLandingPage[];
    },
  });
}

export function useMarketingPage(id: string) {
  return useQuery({
    queryKey: marketingKeys.page(id),
    queryFn: async () => {
      const { data: page, error: pageError } = await supabase
        .from('marketing_landing_pages')
        .select(`
          *,
          domain:marketing_domains(*)
        `)
        .eq('id', id)
        .single();
      
      if (pageError) throw pageError;

      const { data: pagePixels } = await supabase
        .from('marketing_page_pixels')
        .select('pixel_id')
        .eq('page_id', id);

      if (pagePixels && pagePixels.length > 0) {
        const pixelIds = pagePixels.map(pp => pp.pixel_id);
        const { data: pixels } = await supabase
          .from('marketing_pixels')
          .select('*')
          .in('id', pixelIds);
        
        return { ...page, pixels: pixels || [] } as MarketingLandingPage;
      }

      return { ...page, pixels: [] } as MarketingLandingPage;
    },
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (page: Partial<MarketingLandingPage> & { pixel_ids?: string[] }) => {
      const { pixel_ids, ...pageData } = page;
      
      const { data, error } = await supabase
        .from('marketing_landing_pages')
        .insert({
          nome: pageData.nome!,
          slug: pageData.slug!,
          domain_id: pageData.domain_id,
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          conteudo: (pageData.conteudo || {}) as object,
        } as never)
        .select()
        .single();
      
      if (error) throw error;

      if (pixel_ids && pixel_ids.length > 0) {
        const { error: pixelError } = await supabase
          .from('marketing_page_pixels')
          .insert(pixel_ids.map(pixel_id => ({
            page_id: data.id,
            pixel_id,
          })));
        
        if (pixelError) throw pixelError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pages() });
      toast.success('Página criada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar página: ' + error.message);
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, pixel_ids, ...updates }: Partial<MarketingLandingPage> & { id: string; pixel_ids?: string[] }) => {
      const updateData = {
        ...updates,
        versao: updates.versao ? updates.versao + 1 : 1,
      } as Record<string, unknown>;
      if (updateData.conteudo) {
        updateData.conteudo = updateData.conteudo as object;
      }
      const { data, error } = await supabase
        .from('marketing_landing_pages')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      if (pixel_ids !== undefined) {
        await supabase
          .from('marketing_page_pixels')
          .delete()
          .eq('page_id', id);

        if (pixel_ids.length > 0) {
          await supabase
            .from('marketing_page_pixels')
            .insert(pixel_ids.map(pixel_id => ({
              page_id: id,
              pixel_id,
            })));
        }
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pages() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.page(data.id) });
      toast.success('Página atualizada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar página: ' + error.message);
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      const { data, error } = await supabase
        .from('marketing_landing_pages')
        .update({
          status: publish ? 'published' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pages() });
      queryClient.invalidateQueries({ queryKey: marketingKeys.page(data.id) });
      toast.success(data.status === 'published' ? 'Página publicada!' : 'Página despublicada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });
}

export function useDuplicatePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from('marketing_landing_pages')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('marketing_landing_pages')
        .insert({
          nome: `${original.nome} (cópia)`,
          slug: `${original.slug}-copy-${Date.now()}`,
          domain_id: original.domain_id,
          conteudo: original.conteudo,
          meta_title: original.meta_title,
          meta_description: original.meta_description,
          og_image: original.og_image,
          status: 'draft',
        })
        .select()
        .single();
      
      if (error) throw error;

      // Copy pixel associations
      const { data: pagePixels } = await supabase
        .from('marketing_page_pixels')
        .select('pixel_id')
        .eq('page_id', id);

      if (pagePixels && pagePixels.length > 0) {
        await supabase
          .from('marketing_page_pixels')
          .insert(pagePixels.map(pp => ({
            page_id: data.id,
            pixel_id: pp.pixel_id,
          })));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pages() });
      toast.success('Página duplicada com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao duplicar página: ' + error.message);
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_landing_pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.pages() });
      toast.success('Página removida com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover página: ' + error.message);
    },
  });
}

// Analytics Hooks
export function usePageViews(pageId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...marketingKeys.pageViews(pageId), startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('marketing_page_views')
        .select('*')
        .order('created_at', { ascending: false });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query.limit(1000);
      
      if (error) throw error;
      return data as MarketingPageView[];
    },
  });
}

export function useConversions(pageId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...marketingKeys.conversions(pageId), startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('marketing_conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query.limit(1000);
      
      if (error) throw error;
      return data as MarketingConversion[];
    },
  });
}

export function useMarketingStats() {
  return useQuery({
    queryKey: marketingKeys.stats(),
    queryFn: async () => {
      const [pagesResult, pixelsResult, domainsResult, viewsResult, conversionsResult] = await Promise.all([
        supabase.from('marketing_landing_pages').select('id, status', { count: 'exact' }),
        supabase.from('marketing_pixels').select('id, ativo', { count: 'exact' }),
        supabase.from('marketing_domains').select('id, status', { count: 'exact' }),
        supabase.from('marketing_page_views').select('id', { count: 'exact' }),
        supabase.from('marketing_conversions').select('id', { count: 'exact' }),
      ]);

      const pages = pagesResult.data || [];
      const pixels = pixelsResult.data || [];
      const domains = domainsResult.data || [];

      return {
        totalPages: pagesResult.count || 0,
        publishedPages: pages.filter(p => p.status === 'published').length,
        draftPages: pages.filter(p => p.status === 'draft').length,
        totalPixels: pixelsResult.count || 0,
        activePixels: pixels.filter(p => p.ativo).length,
        totalDomains: domainsResult.count || 0,
        activeDomains: domains.filter(d => d.status === 'active').length,
        totalViews: viewsResult.count || 0,
        totalConversions: conversionsResult.count || 0,
      };
    },
  });
}

// Config Hooks
export function useMarketingConfig() {
  return useQuery({
    queryKey: marketingKeys.config(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_config')
        .select('*');
      
      if (error) throw error;
      
      const configMap: Record<string, MarketingConfig> = {};
      (data as MarketingConfig[]).forEach(item => {
        configMap[item.chave] = item;
      });
      
      return configMap;
    },
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: unknown }) => {
      const { data, error } = await supabase
        .from('marketing_config')
        .update({ valor: valor as object } as never)
        .eq('chave', chave)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.config() });
      toast.success('Configuração salva');
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar: ' + error.message);
    },
  });
}
