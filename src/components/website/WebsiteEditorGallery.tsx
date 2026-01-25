import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Plus, Trash2, Save, GripVertical } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { toast } from "sonner";

interface GalleryImage {
  url: string;
  caption: string;
}

interface WebsiteEditorGalleryProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteEditorGallery({ config }: WebsiteEditorGalleryProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const [images, setImages] = useState<GalleryImage[]>(
    config.gallery_images || []
  );
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const addImage = () => {
    if (!newUrl) {
      toast.error("URL da imagem é obrigatória");
      return;
    }
    setImages([...images, { url: newUrl, caption: newCaption }]);
    setNewUrl("");
    setNewCaption("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...images];
    updated[index].caption = caption;
    setImages(updated);
  };

  const handleSave = () => {
    updateWebsite.mutate({ gallery_images: images });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Galeria de Fotos
        </CardTitle>
        <CardDescription>
          Adicione fotos da escola, eventos e infraestrutura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Image */}
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <h4 className="font-medium text-sm">Adicionar Nova Imagem</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="new-url">URL da Imagem</Label>
              <Input
                id="new-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
            <div>
              <Label htmlFor="new-caption">Legenda (opcional)</Label>
              <Input
                id="new-caption"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Descrição da imagem"
              />
            </div>
          </div>
          <Button onClick={addImage} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Imagem
          </Button>
        </div>

        {/* Image List */}
        {images.length > 0 ? (
          <div className="space-y-3">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="h-16 w-24 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={image.url}
                    alt={image.caption || `Imagem ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={image.caption}
                    onChange={(e) => updateCaption(index, e.target.value)}
                    placeholder="Legenda da imagem"
                    className="mb-1"
                  />
                  <p className="text-xs text-muted-foreground truncate">{image.url}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma imagem adicionada</p>
            <p className="text-sm">Adicione fotos para exibir na galeria do site</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateWebsite.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateWebsite.isPending ? "Salvando..." : "Salvar Galeria"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
