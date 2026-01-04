import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useSetores, Cargo } from "@/hooks/useRH";
import { Loader2 } from "lucide-react";

const cargoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  setor_id: z.string().optional(),
  salario_base: z.coerce.number().min(0, "Salário deve ser positivo"),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type CargoFormData = z.infer<typeof cargoSchema>;

interface CargoFormProps {
  cargo?: Cargo | null;
  onSubmit: (data: CargoFormData) => void;
  isLoading?: boolean;
}

export function CargoForm({ cargo, onSubmit, isLoading }: CargoFormProps) {
  const { data: setores } = useSetores();

  const form = useForm<CargoFormData>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      nome: cargo?.nome || "",
      setor_id: cargo?.setor_id || "",
      salario_base: cargo?.salario_base || 0,
      descricao: cargo?.descricao || "",
      ativo: cargo?.ativo ?? true,
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
              <FormLabel>Nome do Cargo *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Professor de Matemática" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="setor_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setor</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {setores?.map((setor) => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
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
          name="salario_base"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salário Base *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} />
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
                <Textarea placeholder="Descrição do cargo" {...field} />
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
                <FormLabel>Cargo Ativo</FormLabel>
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
            {cargo ? "Atualizar" : "Criar Cargo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
