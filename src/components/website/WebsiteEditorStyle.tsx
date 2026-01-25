import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Palette, Share2 } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";

const formSchema = z.object({
  primary_color: z.string().max(50),
  secondary_color: z.string().max(50),
  accent_color: z.string().max(50),
  font_family: z.string().max(100),
  show_powered_by: z.boolean(),
  facebook: z.string().url().optional().or(z.literal("")),
  instagram: z.string().url().optional().or(z.literal("")),
  youtube: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface WebsiteEditorStyleProps {
  config: SchoolWebsiteConfig;
}

const colorPresets = [
  { name: "Azul Padrão", primary: "217 91% 60%", secondary: "142 76% 36%", accent: "45 93% 47%" },
  { name: "Verde Natureza", primary: "142 76% 36%", secondary: "217 91% 60%", accent: "45 93% 47%" },
  { name: "Roxo Moderno", primary: "262 83% 58%", secondary: "217 91% 60%", accent: "45 93% 47%" },
  { name: "Vermelho Energia", primary: "0 84% 60%", secondary: "217 91% 60%", accent: "45 93% 47%" },
  { name: "Laranja Vibrante", primary: "25 95% 53%", secondary: "217 91% 60%", accent: "45 93% 47%" },
];

const fontOptions = [
  { value: "Inter", label: "Inter (Moderno)" },
  { value: "Poppins", label: "Poppins (Geométrico)" },
  { value: "Roboto", label: "Roboto (Clássico)" },
  { value: "Open Sans", label: "Open Sans (Legível)" },
  { value: "Montserrat", label: "Montserrat (Elegante)" },
  { value: "Lato", label: "Lato (Amigável)" },
];

export function WebsiteEditorStyle({ config }: WebsiteEditorStyleProps) {
  const updateWebsite = useUpdateSchoolWebsite();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primary_color: config.primary_color || "217 91% 60%",
      secondary_color: config.secondary_color || "142 76% 36%",
      accent_color: config.accent_color || "45 93% 47%",
      font_family: config.font_family || "Inter",
      show_powered_by: config.show_powered_by,
      facebook: config.social_links?.facebook || "",
      instagram: config.social_links?.instagram || "",
      youtube: config.social_links?.youtube || "",
      linkedin: config.social_links?.linkedin || "",
      twitter: config.social_links?.twitter || "",
    },
  });

  const onSubmit = (data: FormData) => {
    updateWebsite.mutate({
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      accent_color: data.accent_color,
      font_family: data.font_family,
      show_powered_by: data.show_powered_by,
      social_links: {
        facebook: data.facebook || undefined,
        instagram: data.instagram || undefined,
        youtube: data.youtube || undefined,
        linkedin: data.linkedin || undefined,
        twitter: data.twitter || undefined,
      },
    });
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    form.setValue("primary_color", preset.primary);
    form.setValue("secondary_color", preset.secondary);
    form.setValue("accent_color", preset.accent);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores
            </CardTitle>
            <CardDescription>
              Personalize as cores do seu site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Presets */}
            <div>
              <p className="text-sm font-medium mb-3">Paletas Prontas</p>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: `hsl(${preset.primary})` }}
                    />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Primária</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border"
                          style={{ backgroundColor: `hsl(${field.value})` }}
                        />
                        <Input {...field} placeholder="217 91% 60%" className="font-mono text-sm" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Formato HSL (ex: 217 91% 60%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor Secundária</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border"
                          style={{ backgroundColor: `hsl(${field.value})` }}
                        />
                        <Input {...field} placeholder="142 76% 36%" className="font-mono text-sm" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accent_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor de Destaque</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border"
                          style={{ backgroundColor: `hsl(${field.value})` }}
                        />
                        <Input {...field} placeholder="45 93% 47%" className="font-mono text-sm" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tipografia */}
        <Card>
          <CardHeader>
            <CardTitle>Tipografia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="font_family"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte Principal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Selecione uma fonte" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_powered_by"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Mostrar "Powered by"</FormLabel>
                    <FormDescription>
                      Exibir crédito no rodapé do site
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
          </CardContent>
        </Card>

        {/* Redes Sociais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Redes Sociais
            </CardTitle>
            <CardDescription>
              Links para suas redes sociais (exibidos no rodapé)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://facebook.com/sua-escola" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://instagram.com/sua-escola" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://youtube.com/@sua-escola" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://linkedin.com/company/sua-escola" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
