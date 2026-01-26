import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryBlockProps {
  content: {
    title?: string;
    images?: GalleryImage[];
  };
  settings: {
    layout?: "carousel" | "grid";
    aspect_ratio?: "16:9" | "4:3" | "1:1";
    columns?: 2 | 3 | 4;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function GalleryBlock({ content, settings, colors }: GalleryBlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = content.images || [];
  const layout = settings.layout || "carousel";
  
  if (images.length === 0) {
    return null;
  }
  
  const aspectClass = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
  }[settings.aspect_ratio || "16:9"];
  
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };
  
  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        {content.title && (
          <h2 
            className="text-2xl md:text-4xl font-bold text-center mb-12"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title}
          </h2>
        )}
        
        {layout === "carousel" ? (
          <div className="relative max-w-4xl mx-auto">
            <div className={cn("rounded-xl overflow-hidden bg-muted", aspectClass)}>
              <img
                src={images[currentIndex]?.url}
                alt={images[currentIndex]?.caption || ""}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            {images[currentIndex]?.caption && (
              <p className="text-center mt-4 text-muted-foreground">
                {images[currentIndex].caption}
              </p>
            )}
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-background transition"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-background transition"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                
                <div className="flex justify-center gap-2 mt-4">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className="h-2 w-2 rounded-full transition"
                      style={{ 
                        backgroundColor: index === currentIndex 
                          ? `hsl(${colors.primary})` 
                          : 'hsl(var(--muted-foreground) / 0.3)'
                      }}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={cn("grid gap-4", gridCols[settings.columns || 3])}>
            {images.map((image, index) => (
              <div 
                key={index}
                className={cn("rounded-lg overflow-hidden bg-muted", aspectClass)}
              >
                <img
                  src={image.url}
                  alt={image.caption || ""}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
