import { cn } from "@/lib/utils";

interface VideoBlockProps {
  content: {
    title?: string;
    video_url?: string;
  };
  settings: {
    aspect_ratio?: "16:9" | "4:3" | "1:1";
    autoplay?: boolean;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Already an embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo')) {
    return url;
  }
  
  return null;
}

export function VideoBlock({ content, settings, colors }: VideoBlockProps) {
  const embedUrl = getEmbedUrl(content.video_url || "");
  
  if (!embedUrl) {
    return null;
  }
  
  const aspectClass = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
  }[settings.aspect_ratio || "16:9"];
  
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-4xl mx-auto px-4">
        {content.title && (
          <h2 
            className="text-2xl md:text-4xl font-bold text-center mb-12"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title}
          </h2>
        )}
        
        <div className={cn("rounded-xl overflow-hidden shadow-lg", aspectClass)}>
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={content.title || "Vídeo"}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
