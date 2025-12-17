import { z } from "zod";

export const alunoSchema = z.object({
  nome_completo: z.string().trim().min(1, "Nome é obrigatório").max(200, "Máximo 200 caracteres"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  curso_id: z.string().uuid("Selecione um curso válido"),
  telefone_responsavel: z.string().trim().min(8, "Telefone inválido").max(20, "Máximo 20 caracteres"),
  email_responsavel: z.string().trim().email("E-mail inválido").max(255, "Máximo 255 caracteres"),
  endereco: z.string().trim().min(1, "Endereço é obrigatório").max(500, "Máximo 500 caracteres"),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export const cursoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200, "Máximo 200 caracteres"),
  nivel: z.string().min(1, "Nível é obrigatório"),
  mensalidade: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor inválido"),
  duracao_meses: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, "Duração inválida"),
});

export const despesaSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200, "Máximo 200 caracteres"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  valor: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Valor inválido"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  recorrente: z.boolean(),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type AlunoFormData = z.infer<typeof alunoSchema>;
export type CursoFormData = z.infer<typeof cursoSchema>;
export type DespesaFormData = z.infer<typeof despesaSchema>;
