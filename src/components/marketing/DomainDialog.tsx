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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCreateDomain, useUpdateDomain, type MarketingDomain } from "@/hooks/useMarketing";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  dominio: z.string()
    .min(1, "Domínio é obrigatório")
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]+[a-zA-Z0-9]$/, "Formato de domínio inválido"),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: MarketingDomain | null;
}

export function DomainDialog({ open, onOpenChange, domain }: DomainDialogProps) {
  const createMutation = useCreateDomain();
  const updateMutation = useUpdateDomain();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      dominio: "",
      notas: "",
    },
  });

  useEffect(() => {
    if (domain) {
      form.reset({
        nome: domain.nome,
        dominio: domain.dominio,
        notas: domain.notas || "",
      });
    } else {
      form.reset({
        nome: "",
        dominio: "",
        notas: "",
      });
    }
  }, [domain, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (domain) {
        await updateMutation.mutateAsync({
          id: domain.id,
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

  const copyToken = () => {
    if (domain?.verificacao_token) {
      navigator.clipboard.writeText(domain.verificacao_token);
      toast.success("Token copiado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {domain ? "Editar Domínio" : "Novo Domínio"}
          </DialogTitle>
          <DialogDescription>
            {domain ? "Atualize as informações do domínio" : "Adicione um novo domínio para suas páginas"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Domínio Principal" {...field} />
                  </FormControl>
                  <FormDescription>
                    Um nome para identificar este domínio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dominio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domínio</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: lp.seusite.com.br" 
                      {...field}
                      disabled={!!domain}
                    />
                  </FormControl>
                  <FormDescription>
                    O domínio completo (sem http:// ou https://)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {domain && domain.verificacao_token && !domain.verificado && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Para verificar o domínio:</p>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Adicione um registro TXT no DNS do seu domínio</li>
                    <li>Nome: <code className="bg-muted px-1 rounded">_verify</code></li>
                    <li>Valor: <code className="bg-muted px-1 rounded">{domain.verificacao_token}</code></li>
                  </ol>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={copyToken}
                  >
                    <Copy className="mr-2 h-3 w-3" />
                    Copiar Token
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações sobre este domínio" 
                      {...field} 
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : domain ? "Salvar" : "Adicionar Domínio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
