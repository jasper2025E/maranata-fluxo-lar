import { useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePixelEvents, useCreatePixelEvent, type MarketingPixel } from "@/hooks/useMarketing";
import { Plus, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

const eventTypes = [
  { value: 'PageView', label: 'Page View' },
  { value: 'Lead', label: 'Lead' },
  { value: 'Purchase', label: 'Purchase (Compra)' },
  { value: 'AddToCart', label: 'Add to Cart' },
  { value: 'CompleteRegistration', label: 'Complete Registration' },
  { value: 'InitiateCheckout', label: 'Initiate Checkout' },
  { value: 'ViewContent', label: 'View Content' },
  { value: 'Subscribe', label: 'Subscribe' },
  { value: 'custom', label: 'Evento Customizado' },
];

interface PixelEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixel: MarketingPixel | null;
}

export function PixelEventsDialog({ open, onOpenChange, pixel }: PixelEventsDialogProps) {
  const [showForm, setShowForm] = useState(false);
  
  const { data: events, isLoading } = usePixelEvents(pixel?.id || '');
  const createMutation = useCreatePixelEvent();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "PageView",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!pixel) return;
    
    try {
      await createMutation.mutateAsync({
        pixel_id: pixel.id,
        nome: values.nome,
        tipo: values.tipo,
      });
      form.reset();
      setShowForm(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!pixel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Eventos: {pixel.nome}
          </DialogTitle>
          <DialogDescription>
            Configure os eventos de conversão para este pixel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : events?.length === 0 && !showForm ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum evento configurado</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Evento
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {events?.map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className={`h-4 w-4 ${event.ativo ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{event.nome}</p>
                        <p className="text-sm text-muted-foreground">{event.tipo}</p>
                      </div>
                    </div>
                    <Badge variant={event.ativo ? "default" : "secondary"}>
                      {event.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                ))}
              </div>

              {!showForm && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Evento
                </Button>
              )}
            </>
          )}

          {showForm && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lead Capturado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo do Evento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((type) => (
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

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
