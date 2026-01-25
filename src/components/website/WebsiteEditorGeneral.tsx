import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, MessageCircle, BarChart3 } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";

const formSchema = z.object({
  slug: z.string().min(3, "Mínimo 3 caracteres").max(100).regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
  custom_domain: z.string().max(255).optional().nullable(),
  whatsapp_number: z.string().max(20).optional().nullable(),
  prematricula_enabled: z.boolean(),
  facebook_pixel_id: z.string().max(50).optional().nullable(),
  google_analytics_id: z.string().max(50).optional().nullable(),
  google_tag_manager_id: z.string().max(50).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteEditorGeneralProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteEditorGeneral({ config }: WebsiteEditorGeneralProps) {
  const updateWebsite = useUpdateSchoolWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: config.slug || "",
      custom_domain: config.custom_domain || "",
      whatsapp_number: config.whatsapp_number || "",
      prematricula_enabled: config.prematricula_enabled,
      facebook_pixel_id: config.facebook_pixel_id || "",
      google_analytics_id: config.google_analytics_id || "",
      google_tag_manager_id: config.google_tag_manager_id || "",
    },
  });

  const onSubmit = (data: FormData) => {
    updateWebsite.mutate({
      slug: data.slug,
      custom_domain: data.custom_domain || null,
      whatsapp_number: data.whatsapp_number || null,
      prematricula_enabled: data.prematricula_enabled,
      facebook_pixel_id: data.facebook_pixel_id || null,
      google_analytics_id: data.google_analytics_id || null,
      google_tag_manager_id: data.google_tag_manager_id || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* URL e Domínio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              URL e Domínio
            </CardTitle>
            <CardDescription>
              Configure o endereço do seu site escolar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Site</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{window.location.origin}/escola/</span>
                      <Input {...field} placeholder="minha-escola" className="max-w-xs" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Este será o endereço público do seu site
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="custom_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio Personalizado (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="www.minhaescola.com.br" />
                  </FormControl>
                  <FormDescription>
                    Configure um domínio próprio (requer configuração DNS)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Funcionalidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Funcionalidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="prematricula_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Formulário de Pré-Matrícula</FormLabel>
                    <FormDescription>
                      Permitir que visitantes preencham uma pré-matrícula diretamente no site
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do WhatsApp</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="5511999999999" />
                  </FormControl>
                  <FormDescription>
                    Número com DDD e código do país (sem espaços ou símbolos)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rastreamento e Analytics
            </CardTitle>
            <CardDescription>
              Conecte ferramentas de análise para acompanhar visitantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="facebook_pixel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Pixel ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="123456789012345" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="google_analytics_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Analytics ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="G-XXXXXXXXXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="google_tag_manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Tag Manager ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="GTM-XXXXXXX" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
