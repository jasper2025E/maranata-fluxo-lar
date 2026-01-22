import { z } from "zod";

export const alunoSchema = z.object({
  nome_completo: z.string().trim().min(1, "Nome é obrigatório").max(200, "Máximo 200 caracteres"),
  data_nascimento: z.string().optional().or(z.literal("")),
  curso_id: z.string().uuid("Selecione um curso válido"),
  turma_id: z.string().optional().or(z.literal("")),
  responsavel_id: z.string().optional().or(z.literal("")),
  telefone_responsavel: z.string().trim().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  email_responsavel: z.string().trim().max(255, "Máximo 255 caracteres").optional().or(z.literal("")).refine(
    (val) => !val || val === "" || z.string().email().safeParse(val).success,
    "E-mail inválido"
  ),
  endereco: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
});

export const cursoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200, "Máximo 200 caracteres"),
  nivel: z.string().min(1, "Nível é obrigatório"),
  mensalidade: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor inválido"),
  duracao_meses: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, "Duração inválida"),
});

export const despesaSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200, "Máximo 200 caracteres"),
  categoria: z.enum(["Fixa", "Variável", "Única"], { errorMap: () => ({ message: "Categoria inválida. Use: Fixa, Variável ou Única" }) }),
  valor: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor deve ser maior que zero"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  recorrente: z.boolean(),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type AlunoFormData = z.infer<typeof alunoSchema>;
export type CursoFormData = z.infer<typeof cursoSchema>;
export type DespesaFormData = z.infer<typeof despesaSchema>;
