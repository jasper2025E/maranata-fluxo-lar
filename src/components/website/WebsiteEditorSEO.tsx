import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Search, Image } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";

const formSchema = z.object({
  seo_title: z.string().max(70, "Máximo 70 caracteres").optional().nullable(),
  seo_description: z.string().max(160, "Máximo 160 caracteres").optional().nullable(),
  seo_keywords: z.string().max(500).optional().nullable(),
  og_image_url: z.string().url().optional().or(z.literal("")).nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteEditorSEOProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteEditorSEO({ config }: WebsiteEditorSEOProps) {
  const updateWebsite = useUpdateSchoolWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seo_title: config.seo_title || "",
      seo_description: config.seo_description || "",
      seo_keywords: config.seo_keywords || "",
      og_image_url: config.og_image_url || "",
    },
  });

  const seoTitle = form.watch("seo_title") || "";
  const seoDescription = form.watch("seo_description") || "";

  const onSubmit = (data: FormData) => {
    updateWebsite.mutate({
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
      seo_keywords: data.seo_keywords || null,
      og_image_url: data.og_image_url || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Meta Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Meta Tags
            </CardTitle>
            <CardDescription>
              Otimize seu site para mecanismos de busca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="seo_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título SEO</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Nome da Escola - Educação de Qualidade" />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Aparece nos resultados do Google</span>
                    <span className={seoTitle.length > 60 ? "text-destructive" : ""}>
                      {seoTitle.length}/70 caracteres
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição SEO</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Descrição breve da sua escola para aparecer nos resultados de busca..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Descrição nos resultados de busca</span>
                    <span className={seoDescription.length > 155 ? "text-destructive" : ""}>
                      {seoDescription.length}/160 caracteres
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seo_keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palavras-chave</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="escola, educação, matrícula, cidade" />
                  </FormControl>
                  <FormDescription>
                    Separadas por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Prévia do Google</CardTitle>
            <CardDescription>
              Como seu site aparecerá nos resultados de busca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-lg border max-w-xl">
              <p className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                {seoTitle || "Nome da Escola - Educação de Qualidade"}
              </p>
              <p className="text-green-700 text-sm truncate">
                {window.location.origin}/escola/{config.slug || "sua-escola"}
              </p>
              <p className="text-gray-600 text-sm line-clamp-2">
                {seoDescription || "Descrição da sua escola aparecerá aqui. Adicione uma descrição atraente para melhorar o CTR."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Open Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Compartilhamento Social
            </CardTitle>
            <CardDescription>
              Como seu site aparece quando compartilhado nas redes sociais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="og_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem de Compartilhamento</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="https://exemplo.com/imagem-og.jpg" />
                  </FormControl>
                  <FormDescription>
                    Tamanho recomendado: 1200x630 pixels
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("og_image_url") && (
              <div className="rounded-lg border overflow-hidden max-w-md">
                <img 
                  src={form.watch("og_image_url") || ""} 
                  alt="Prévia OG"
                  className="w-full h-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateWebsite.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateWebsite.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
