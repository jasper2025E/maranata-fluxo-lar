import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useCreatePage, 
  useUpdatePage, 
  useMarketingDomains, 
  useMarketingPixels,
  type MarketingLandingPage 
} from "@/hooks/useMarketing";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "URL é obrigatória").regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  domain_id: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  pixel_ids: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface LandingPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: MarketingLandingPage | null;
}

export function LandingPageDialog({ open, onOpenChange, page }: LandingPageDialogProps) {
  const { data: domains } = useMarketingDomains();
  const { data: pixels } = useMarketingPixels();
  const createMutation = useCreatePage();
  const updateMutation = useUpdatePage();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      slug: "",
      domain_id: "",
      meta_title: "",
      meta_description: "",
      pixel_ids: [],
    },
  });

  useEffect(() => {
    if (page) {
      form.reset({
        nome: page.nome,
        slug: page.slug,
        domain_id: page.domain_id || "",
        meta_title: page.meta_title || "",
        meta_description: page.meta_description || "",
        pixel_ids: page.pixels?.map(p => p.id) || [],
      });
    } else {
      form.reset({
        nome: "",
        slug: "",
        domain_id: "",
        meta_title: "",
        meta_description: "",
        pixel_ids: [],
      });
    }
  }, [page, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (page) {
        await updateMutation.mutateAsync({
          id: page.id,
          ...values,
          domain_id: values.domain_id || null,
        });
      } else {
        await createMutation.mutateAsync({
          ...values,
          domain_id: values.domain_id || null,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {page ? "Editar Página" : "Nova Página"}
          </DialogTitle>
          <DialogDescription>
            {page ? "Atualize as informações da página" : "Crie uma nova landing page"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Página</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Página de Captura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (slug)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ex: pagina-captura" 
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '');
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Apenas letras minúsculas, números e hífens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="domain_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um domínio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {domains?.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.dominio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">SEO</h4>
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título (Meta Title)</FormLabel>
                    <FormControl>
                      <Input placeholder="Título para SEO" {...field} />
                    </FormControl>
                    <FormDescription>
                      Máximo recomendado: 60 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Meta Description)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição para SEO" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Máximo recomendado: 160 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pixel_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Pixels de Rastreamento</FormLabel>
                  <div className="space-y-2">
                    {pixels?.filter(p => p.ativo).map((pixel) => (
                      <FormField
                        key={pixel.id}
                        control={form.control}
                        name="pixel_ids"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(pixel.id)}
                                onCheckedChange={(checked) => {
                                  const value = field.value || [];
                                  if (checked) {
                                    field.onChange([...value, pixel.id]);
                                  } else {
                                    field.onChange(value.filter(id => id !== pixel.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {pixel.nome} ({pixel.tipo})
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                    {pixels?.filter(p => p.ativo).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum pixel ativo. Crie pixels na aba "Pixels".
                      </p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : page ? "Salvar" : "Criar Página"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
