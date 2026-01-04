import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Setor } from "@/hooks/useRH";
import { Loader2 } from "lucide-react";

const setorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type SetorFormData = z.infer<typeof setorSchema>;

interface SetorFormProps {
  setor?: Setor | null;
  onSubmit: (data: SetorFormData) => void;
  isLoading?: boolean;
}

export function SetorForm({ setor, onSubmit, isLoading }: SetorFormProps) {
  const form = useForm<SetorFormData>({
    resolver: zodResolver(setorSchema),
    defaultValues: {
      nome: setor?.nome || "",
      descricao: setor?.descricao || "",
      ativo: setor?.ativo ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Setor *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Pedagógico" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição do setor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Setor Ativo</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {setor ? "Atualizar" : "Criar Setor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
