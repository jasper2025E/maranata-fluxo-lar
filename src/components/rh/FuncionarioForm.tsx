import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCargos, Funcionario } from "@/hooks/useRH";
import { FotoUpload } from "./FotoUpload";
import { Loader2 } from "lucide-react";

const funcionarioSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cargo_id: z.string().optional(),
  tipo: z.enum(["professor", "administrativo", "outro"]),
  status: z.enum(["ativo", "inativo", "afastado", "ferias"]),
  salario_base: z.coerce.number().min(0, "Salário deve ser positivo"),
  data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
  observacoes: z.string().optional(),
  foto_url: z.string().optional(),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface FuncionarioFormProps {
  funcionario?: Funcionario | null;
  onSubmit: (data: FuncionarioFormData) => void;
  isLoading?: boolean;
}

export function FuncionarioForm({ funcionario, onSubmit, isLoading }: FuncionarioFormProps) {
  const { data: cargos } = useCargos();
  const [fotoUrl, setFotoUrl] = useState<string | null>(funcionario?.foto_url || null);

  const form = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome_completo: funcionario?.nome_completo || "",
      cpf: funcionario?.cpf || "",
      rg: funcionario?.rg || "",
      data_nascimento: funcionario?.data_nascimento || "",
      telefone: funcionario?.telefone || "",
      email: funcionario?.email || "",
      endereco: funcionario?.endereco || "",
      cargo_id: funcionario?.cargo_id || "",
      tipo: funcionario?.tipo || "administrativo",
      status: funcionario?.status || "ativo",
      salario_base: funcionario?.salario_base || 0,
      data_admissao: funcionario?.data_admissao || new Date().toISOString().split('T')[0],
      observacoes: funcionario?.observacoes || "",
      foto_url: funcionario?.foto_url || "",
    },
  });

  const handleFotoUpload = (url: string) => {
    setFotoUrl(url);
    form.setValue('foto_url', url);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto Upload */}
        <div className="flex justify-center pb-4 border-b">
          <FotoUpload
            funcionarioId={funcionario?.id}
            currentPhotoUrl={fotoUrl}
            onUploadComplete={handleFotoUpload}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome_completo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do funcionário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input placeholder="RG" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_nascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cargo_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cargos?.map((cargo) => (
                      <SelectItem key={cargo.id} value={cargo.id}>
                        {cargo.nome}
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
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
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
            name="data_admissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Admissão *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Observações adicionais" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {funcionario ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
