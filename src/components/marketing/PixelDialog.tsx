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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePixel, useUpdatePixel, type MarketingPixel } from "@/hooks/useMarketing";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(['meta', 'google_ads', 'google_analytics', 'tiktok', 'custom']),
  pixel_id: z.string().min(1, "ID do pixel é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

const pixelTypes = [
  { value: 'meta', label: 'Meta (Facebook/Instagram)' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'google_analytics', label: 'Google Analytics (GA4)' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'custom', label: 'Customizado' },
];

interface PixelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixel: MarketingPixel | null;
}

export function PixelDialog({ open, onOpenChange, pixel }: PixelDialogProps) {
  const createMutation = useCreatePixel();
  const updateMutation = useUpdatePixel();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "meta",
      pixel_id: "",
    },
  });

  useEffect(() => {
    if (pixel) {
      form.reset({
        nome: pixel.nome,
        tipo: pixel.tipo,
        pixel_id: pixel.pixel_id,
      });
    } else {
      form.reset({
        nome: "",
        tipo: "meta",
        pixel_id: "",
      });
    }
  }, [pixel, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (pixel) {
        await updateMutation.mutateAsync({
          id: pixel.id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getPixelIdPlaceholder = (tipo: string) => {
    switch (tipo) {
      case 'meta':
        return 'Ex: 123456789012345';
      case 'google_ads':
        return 'Ex: AW-123456789';
      case 'google_analytics':
        return 'Ex: G-XXXXXXXXXX';
      case 'tiktok':
        return 'Ex: CXXXXXXXXXXXXXXXXXX';
      default:
        return 'ID do pixel';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {pixel ? "Editar Pixel" : "Novo Pixel"}
          </DialogTitle>
          <DialogDescription>
            {pixel ? "Atualize as informações do pixel" : "Configure um novo pixel de rastreamento"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Pixel</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pixel Principal" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um nome para identificar este pixel
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo do Pixel</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pixelTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="pixel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Pixel</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={getPixelIdPlaceholder(form.watch('tipo'))} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    O identificador único fornecido pela plataforma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : pixel ? "Salvar" : "Criar Pixel"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
