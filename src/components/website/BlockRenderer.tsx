import { WebsiteBlock } from "@/hooks/useWebsiteBuilder";
import {
  HeroBlock,
  FeaturesBlock,
  TestimonialsBlock,
  FAQBlock,
  GalleryBlock,
  StatsBlock,
  CTABlock,
  TimelineBlock,
  ContactBlock,
  MapBlock,
  VideoBlock,
  TeamBlock,
  TextBlock,
  BannerBlock,
  DividerBlock,
  PreMatriculaBlock,
} from "./blocks";

interface BlockRendererProps {
  block: WebsiteBlock;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tenantId: string;
  onNavigate?: (target: string) => void;
}

export function BlockRenderer({ block, colors, tenantId, onNavigate }: BlockRendererProps) {
  if (!block.is_visible) {
    return null;
  }
  
  const content = block.content as Record<string, unknown>;
  const settings = block.settings as Record<string, unknown>;
  
  switch (block.block_type) {
    case "hero":
      return (
        <HeroBlock
          content={content as Parameters<typeof HeroBlock>[0]["content"]}
          settings={settings as Parameters<typeof HeroBlock>[0]["settings"]}
          colors={colors}
          onCtaClick={(type) => {
            if (type === "primary") {
              onNavigate?.("#prematricula");
            } else {
              onNavigate?.("#sobre");
            }
          }}
        />
      );
      
    case "features":
      return (
        <FeaturesBlock
          content={content as Parameters<typeof FeaturesBlock>[0]["content"]}
          settings={settings as Parameters<typeof FeaturesBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "testimonials":
      return (
        <TestimonialsBlock
          content={content as Parameters<typeof TestimonialsBlock>[0]["content"]}
          settings={settings as Parameters<typeof TestimonialsBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "faq":
      return (
        <FAQBlock
          content={content as Parameters<typeof FAQBlock>[0]["content"]}
          settings={settings as Parameters<typeof FAQBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "gallery":
      return (
        <GalleryBlock
          content={content as Parameters<typeof GalleryBlock>[0]["content"]}
          settings={settings as Parameters<typeof GalleryBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "stats":
      return (
        <StatsBlock
          content={content as Parameters<typeof StatsBlock>[0]["content"]}
          settings={settings as Parameters<typeof StatsBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "cta":
      return (
        <CTABlock
          content={content as Parameters<typeof CTABlock>[0]["content"]}
          settings={settings as Parameters<typeof CTABlock>[0]["settings"]}
          colors={colors}
          onButtonClick={() => onNavigate?.("#prematricula")}
        />
      );
      
    case "timeline":
      return (
        <TimelineBlock
          content={content as Parameters<typeof TimelineBlock>[0]["content"]}
          settings={settings as Parameters<typeof TimelineBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "contact":
      return (
        <ContactBlock
          content={content as Parameters<typeof ContactBlock>[0]["content"]}
          settings={settings as Parameters<typeof ContactBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "map":
      return (
        <MapBlock
          content={content as Parameters<typeof MapBlock>[0]["content"]}
          settings={settings as Parameters<typeof MapBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "video":
      return (
        <VideoBlock
          content={content as Parameters<typeof VideoBlock>[0]["content"]}
          settings={settings as Parameters<typeof VideoBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "team":
      return (
        <TeamBlock
          content={content as Parameters<typeof TeamBlock>[0]["content"]}
          settings={settings as Parameters<typeof TeamBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "text":
      return (
        <TextBlock
          content={content as Parameters<typeof TextBlock>[0]["content"]}
          settings={settings as Parameters<typeof TextBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "banner":
      return (
        <BannerBlock
          content={content as Parameters<typeof BannerBlock>[0]["content"]}
          settings={settings as Parameters<typeof BannerBlock>[0]["settings"]}
          colors={colors}
        />
      );
      
    case "divider":
      return (
        <DividerBlock
          settings={settings as Parameters<typeof DividerBlock>[0]["settings"]}
          colors={{ primary: colors.primary }}
        />
      );
      
    case "prematricula":
      return (
        <PreMatriculaBlock
          content={content as Parameters<typeof PreMatriculaBlock>[0]["content"]}
          settings={settings as Parameters<typeof PreMatriculaBlock>[0]["settings"]}
          colors={colors}
          tenantId={tenantId}
        />
      );
      
    default:
      return null;
  }
}
