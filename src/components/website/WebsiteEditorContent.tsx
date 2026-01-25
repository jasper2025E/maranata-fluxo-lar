import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Type, Info, Phone, MessageSquare } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";

const formSchema = z.object({
  hero_title: z.string().max(200).optional().nullable(),
  hero_subtitle: z.string().max(500).optional().nullable(),
  hero_cta_primary: z.string().max(100),
  hero_cta_secondary: z.string().max(100),
  hero_badge_text: z.string().max(100),
  about_title: z.string().max(200),
  about_description: z.string().max(1000).optional().nullable(),
  contact_title: z.string().max(200),
  contact_subtitle: z.string().max(500).optional().nullable(),
  prematricula_title: z.string().max(200),
  prematricula_subtitle: z.string().max(500).optional().nullable(),
  footer_text: z.string().max(500).optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteEditorContentProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteEditorContent({ config }: WebsiteEditorContentProps) {
  const updateWebsite = useUpdateSchoolWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero_title: config.hero_title || "",
      hero_subtitle: config.hero_subtitle || "",
      hero_cta_primary: config.hero_cta_primary || "Inscrever Aluno",
      hero_cta_secondary: config.hero_cta_secondary || "Ver Cursos",
      hero_badge_text: config.hero_badge_text || "Matrículas Abertas 2025",
      about_title: config.about_title || "Sobre Nossa Instituição",
      about_description: config.about_description || "",
      contact_title: config.contact_title || "Entre em Contato",
      contact_subtitle: config.contact_subtitle || "",
      prematricula_title: config.prematricula_title || "Inscreva-se Agora",
      prematricula_subtitle: config.prematricula_subtitle || "",
      footer_text: config.footer_text || "",
    },
  });

  const onSubmit = (data: FormData) => {
    updateWebsite.mutate({
      hero_title: data.hero_title || null,
      hero_subtitle: data.hero_subtitle || null,
      hero_cta_primary: data.hero_cta_primary,
      hero_cta_secondary: data.hero_cta_secondary,
      hero_badge_text: data.hero_badge_text,
      about_title: data.about_title,
      about_description: data.about_description || null,
      contact_title: data.contact_title,
      contact_subtitle: data.contact_subtitle || null,
      prematricula_title: data.prematricula_title,
      prematricula_subtitle: data.prematricula_subtitle || null,
      footer_text: data.footer_text || null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Seção Principal (Hero)
            </CardTitle>
            <CardDescription>
              A primeira coisa que os visitantes verão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hero_badge_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge de Destaque</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Matrículas Abertas 2025" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hero_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Principal</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Educação de qualidade para o futuro do seu filho" />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco para usar o nome da escola
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hero_subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Sistema educacional completo com acompanhamento personalizado..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hero_cta_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Botão Principal</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Inscrever Aluno" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hero_cta_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Botão Secundário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ver Cursos" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre a Escola
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="about_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Seção</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sobre Nossa Instituição" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="about_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Somos uma instituição comprometida com a excelência educacional..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Seção de Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contact_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Entre em Contato" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Estamos prontos para atender você" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Formulário de Pré-Matrícula */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Formulário de Pré-Matrícula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="prematricula_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Inscreva-se Agora" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prematricula_subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="Preencha o formulário para iniciar a matrícula" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle>Rodapé</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto do Rodapé</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Texto adicional para o rodapé do site..."
                      rows={2}
                    />
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
