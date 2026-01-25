import { memo } from "react";
import { cn } from "@/lib/utils";

interface StableImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * A stable image component that prevents flickering during navigation.
 * Uses memo to prevent unnecessary re-renders and handles loading gracefully.
 */
export const StableImage = memo(function StableImage({
  src,
  alt,
  className,
  fallback,
}: StableImageProps) {
  if (!src) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      loading="eager"
      decoding="async"
    />
  );
});
