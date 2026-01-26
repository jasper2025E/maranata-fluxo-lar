-- Create table for website pages (múltiplas páginas)
CREATE TABLE public.school_website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES public.school_website_config(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  is_homepage BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  seo_title VARCHAR(200),
  seo_description VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(website_id, slug)
);

-- Create table for page blocks (blocos arrastáveis)
CREATE TABLE public.school_website_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.school_website_pages(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL, -- hero, text, gallery, testimonials, faq, video, cta, pricing, etc.
  block_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- block-specific settings (colors, layout, etc.)
  content JSONB DEFAULT '{}', -- block content (texts, images, items, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_website_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for pages
CREATE POLICY "Users can manage own tenant pages"
  ON public.school_website_pages
  FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- RLS policies for blocks
CREATE POLICY "Users can manage own tenant blocks"
  ON public.school_website_blocks
  FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());

-- Public read for published pages (for public website)
CREATE POLICY "Anyone can view published pages"
  ON public.school_website_pages
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Anyone can view blocks of published pages"
  ON public.school_website_blocks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.school_website_pages p
      WHERE p.id = page_id AND p.is_published = true
    )
  );

-- Create indexes
CREATE INDEX idx_website_pages_website ON public.school_website_pages(website_id);
CREATE INDEX idx_website_pages_slug ON public.school_website_pages(website_id, slug);
CREATE INDEX idx_website_blocks_page ON public.school_website_blocks(page_id);
CREATE INDEX idx_website_blocks_order ON public.school_website_blocks(page_id, block_order);

-- Add custom_domain_verified to website config
ALTER TABLE public.school_website_config 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_domain_ssl_status VARCHAR(50) DEFAULT 'pending';