import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEscola } from "./useEscola";
import { toast } from "sonner";

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

interface UploadResult {
  url: string;
  path: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

interface UseImageUploadReturn {
  upload: (file: File, options: UploadOptions) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[], options: UploadOptions) => Promise<UploadResult[]>;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// Compress and resize image using canvas
async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try WebP first, fallback to JPEG
      const mimeType = "image/webp";
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to JPEG if WebP fails
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error("Failed to compress image"));
                }
              },
              "image/jpeg",
              quality
            );
          }
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function useImageUpload(): UseImageUploadReturn {
  const { data: escola } = useEscola();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Use escola id or a default folder for single-tenant
  const uploadFolderId = escola?.id || "escola-maranata";

  const upload = useCallback(
    async (file: File, options: UploadOptions): Promise<UploadResult | null> => {
      const {
        bucket,
        folder = "",
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.8,
        maxSizeMB = 50,
      } = options;

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const originalSize = file.size;
        
        // Check file size limit
        if (originalSize > maxSizeMB * 1024 * 1024) {
          throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        }

        setProgress(10);

        // Compress if it's an image
        let processedFile: Blob | File = file;
        let finalMimeType = file.type;
        
        if (file.type.startsWith("image/") && !file.type.includes("svg")) {
          processedFile = await compressImage(file, maxWidth, maxHeight, quality);
          finalMimeType = processedFile.type;
          setProgress(50);
        } else {
          setProgress(50);
        }

        // Generate unique file path
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const extension = finalMimeType === "image/webp" ? "webp" : 
                         finalMimeType === "image/jpeg" ? "jpg" : 
                         file.name.split(".").pop() || "bin";
        const fileName = `${timestamp}-${randomId}.${extension}`;
        const filePath = folder 
          ? `${uploadFolderId}/${folder}/${fileName}`
          : `${uploadFolderId}/${fileName}`;

        setProgress(60);

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, processedFile, {
            contentType: finalMimeType,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        setProgress(90);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        setProgress(100);

        const result: UploadResult = {
          url: urlData.publicUrl,
          path: data.path,
          size: processedFile.size,
          originalSize,
          compressionRatio: Math.round((1 - processedFile.size / originalSize) * 100),
        };

        // Show compression stats if significant
        if (result.compressionRatio > 10 && file.type.startsWith("image/")) {
          toast.success(
            `Imagem otimizada! Redução de ${result.compressionRatio}% no tamanho`
          );
        } else {
          toast.success("Upload concluído!");
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro no upload";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFolderId]
  );

  const uploadMultiple = useCallback(
    async (files: File[], options: UploadOptions): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const result = await upload(files[i], options);
        if (result) {
          results.push(result);
        }
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      return results;
    },
    [upload]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
  };
}
