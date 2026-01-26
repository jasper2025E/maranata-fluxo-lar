interface MapBlockProps {
  content: {
    title?: string;
    embed_url?: string;
  };
  settings: {
    height?: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function MapBlock({ content, settings, colors }: MapBlockProps) {
  const height = settings.height || 400;
  
  if (!content.embed_url) {
    return null;
  }
  
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-6xl mx-auto px-4">
        {content.title && (
          <h2 
            className="text-2xl md:text-4xl font-bold text-center mb-12"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title}
          </h2>
        )}
        
        <div 
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ height: `${height}px` }}
        >
          <iframe
            src={content.embed_url}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da escola"
          />
        </div>
      </div>
    </section>
  );
}
