export interface Aluno {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  curso_id: string;
  turma_id: string | null;
  responsavel_id: string | null;
  telefone_responsavel: string;
  email_responsavel: string;
  endereco: string;
  data_matricula: string;
  status_matricula: 'ativo' | 'trancado' | 'cancelado' | 'transferido';
  desconto_percentual: number;
  observacoes: string | null;
  dia_vencimento: number | null;
  data_inicio_cobranca: string | null;
  quantidade_parcelas: number | null;
  cursos?: { nome: string; mensalidade: number };
  turmas?: { nome: string; serie: string } | null;
  responsaveis?: { id: string; nome: string } | null;
}

export interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
}

export interface Curso {
  id: string;
  nome: string;
  mensalidade: number;
}

export interface Turma {
  id: string;
  nome: string;
  serie: string;
}

export type StatusFilter = 'todos' | 'ativo' | 'trancado' | 'cancelado' | 'sem_turma';

export const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "bg-emerald-100 text-emerald-700" },
  trancado: { label: "Trancado", color: "bg-amber-100 text-amber-700" },
  cancelado: { label: "Cancelado", color: "bg-rose-100 text-rose-700" },
  transferido: { label: "Transferido", color: "bg-gray-100 text-gray-700" },
} as const;
