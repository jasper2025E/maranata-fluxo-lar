import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface Setor {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

export interface Cargo {
  id: string;
  nome: string;
  setor_id: string | null;
  salario_base: number;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  setores?: Setor | null;
}

export interface Funcionario {
  id: string;
  nome_completo: string;
  cpf: string | null;
  rg: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cargo_id: string | null;
  tipo: 'professor' | 'administrativo' | 'outro';
  status: 'ativo' | 'inativo' | 'afastado' | 'ferias';
  salario_base: number;
  data_admissao: string;
  data_demissao: string | null;
  foto_url: string | null;
  observacoes: string | null;
  created_at: string;
  cargos?: Cargo | null;
}

export interface Contrato {
  id: string;
  funcionario_id: string;
  tipo: 'clt' | 'pj' | 'temporario' | 'estagio';
  data_inicio: string;
  data_fim: string | null;
  salario: number;
  carga_horaria: number;
  documento_url: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  funcionarios?: { nome_completo: string } | null;
}

export interface PontoRegistro {
  id: string;
  funcionario_id: string;
  data: string;
  entrada: string | null;
  saida_almoco: string | null;
  retorno_almoco: string | null;
  saida: string | null;
  horas_trabalhadas: string | null;
  horas_extras: string | null;
  observacoes: string | null;
  editado_por: string | null;
  created_at: string;
  funcionarios?: { nome_completo: string } | null;
}

export interface FolhaPagamento {
  id: string;
  funcionario_id: string;
  mes_referencia: number;
  ano_referencia: number;
  salario_base: number;
  horas_extras_valor: number;
  bonificacoes: number;
  adicional_noturno: number;
  adicional_periculosidade: number;
  outros_adicionais: number;
  descontos: number;
  faltas_atrasos: number;
  inss: number;
  fgts: number;
  irrf: number;
  total_bruto: number;
  total_liquido: number;
  pago: boolean;
  data_pagamento: string | null;
  despesa_id: string | null;
  observacoes: string | null;
  created_at: string;
  funcionarios?: { nome_completo: string; cargo_id?: string; cargos?: { nome: string } } | null;
}

// Query Keys
export const rhQueryKeys = {
  setores: ['setores'] as const,
  cargos: ['cargos'] as const,
  funcionarios: ['funcionarios'] as const,
  contratos: ['contratos'] as const,
  ponto: ['ponto'] as const,
  folha: ['folha'] as const,
  stats: ['rh-stats'] as const,
};

// Hooks for Setores
export function useSetores() {
  return useQuery({
    queryKey: rhQueryKeys.setores,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Setor[];
    },
  });
}

export function useCreateSetor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (setor: Omit<Setor, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('setores')
        .insert(setor)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.setores });
      toast.success('Setor criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar setor'),
  });
}

export function useUpdateSetor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...setor }: Partial<Setor> & { id: string }) => {
      const { data, error } = await supabase
        .from('setores')
        .update(setor)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.setores });
      toast.success('Setor atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar setor'),
  });
}

export function useDeleteSetor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('setores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.setores });
      toast.success('Setor excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir setor'),
  });
}

// Hooks for Cargos
export function useCargos() {
  return useQuery({
    queryKey: rhQueryKeys.cargos,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cargos')
        .select('*, setores(*)')
        .order('nome');
      if (error) throw error;
      return data as Cargo[];
    },
  });
}

export function useCreateCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cargo: Omit<Cargo, 'id' | 'created_at' | 'setores'>) => {
      const { data, error } = await supabase
        .from('cargos')
        .insert(cargo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.cargos });
      toast.success('Cargo criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar cargo'),
  });
}

export function useUpdateCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...cargo }: Partial<Cargo> & { id: string }) => {
      const { setores, ...updateData } = cargo as any;
      const { data, error } = await supabase
        .from('cargos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.cargos });
      toast.success('Cargo atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar cargo'),
  });
}

export function useDeleteCargo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cargos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.cargos });
      toast.success('Cargo excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir cargo'),
  });
}

// Hooks for Funcionarios
export function useFuncionarios() {
  return useQuery({
    queryKey: rhQueryKeys.funcionarios,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*, cargos(*, setores(*))')
        .order('nome_completo');
      if (error) throw error;
      return data as Funcionario[];
    },
  });
}

export function useFuncionario(id: string) {
  return useQuery({
    queryKey: [...rhQueryKeys.funcionarios, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*, cargos(*, setores(*))')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Funcionario | null;
    },
    enabled: !!id,
  });
}

export function useCreateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (funcionario: Omit<Funcionario, 'id' | 'created_at' | 'cargos'>) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(funcionario)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Funcionário cadastrado com sucesso!');
    },
    onError: () => toast.error('Erro ao cadastrar funcionário'),
  });
}

export function useUpdateFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...funcionario }: Partial<Funcionario> & { id: string }) => {
      const { cargos, ...updateData } = funcionario as any;
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Funcionário atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar funcionário'),
  });
}

export function useDeleteFuncionario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('funcionarios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir funcionário'),
  });
}

// Hooks for Contratos
export function useContratos(funcionarioId?: string) {
  return useQuery({
    queryKey: [...rhQueryKeys.contratos, funcionarioId],
    queryFn: async () => {
      let query = supabase
        .from('contratos')
        .select('*, funcionarios(nome_completo)')
        .order('created_at', { ascending: false });
      
      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Contrato[];
    },
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contrato: Omit<Contrato, 'id' | 'created_at' | 'funcionarios'>) => {
      const { data, error } = await supabase
        .from('contratos')
        .insert(contrato)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.contratos });
      toast.success('Contrato criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar contrato'),
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...contrato }: Partial<Contrato> & { id: string }) => {
      const { funcionarios, ...updateData } = contrato as any;
      const { data, error } = await supabase
        .from('contratos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.contratos });
      toast.success('Contrato atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar contrato'),
  });
}

// Hooks for Ponto
export function usePontoRegistros(funcionarioId?: string, dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: [...rhQueryKeys.ponto, funcionarioId, dataInicio, dataFim],
    queryFn: async () => {
      let query = supabase
        .from('ponto_registros')
        .select('*, funcionarios(nome_completo)')
        .order('data', { ascending: false });
      
      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId);
      }
      if (dataInicio) {
        query = query.gte('data', dataInicio);
      }
      if (dataFim) {
        query = query.lte('data', dataFim);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PontoRegistro[];
    },
  });
}

export function useRegistrarPonto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ponto: Partial<PontoRegistro> & { funcionario_id: string; data: string }) => {
      const { data, error } = await supabase
        .from('ponto_registros')
        .upsert(ponto, { onConflict: 'funcionario_id,data' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.ponto });
      toast.success('Ponto registrado com sucesso!');
    },
    onError: () => toast.error('Erro ao registrar ponto'),
  });
}

// Hooks for Folha de Pagamento
export function useFolhaPagamento(mes?: number, ano?: number) {
  return useQuery({
    queryKey: [...rhQueryKeys.folha, mes, ano],
    queryFn: async () => {
      let query = supabase
        .from('folha_pagamento')
        .select('*, funcionarios(nome_completo, cargo_id, cargos(nome))')
        .order('created_at', { ascending: false });
      
      if (mes) {
        query = query.eq('mes_referencia', mes);
      }
      if (ano) {
        query = query.eq('ano_referencia', ano);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FolhaPagamento[];
    },
  });
}

export function useCreateFolhaPagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folha: Omit<FolhaPagamento, 'id' | 'created_at' | 'funcionarios'>) => {
      const { data, error } = await supabase
        .from('folha_pagamento')
        .insert(folha)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.folha });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Folha de pagamento criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar folha de pagamento'),
  });
}

export function useUpdateFolhaPagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...folha }: Partial<FolhaPagamento> & { id: string }) => {
      const { funcionarios, ...updateData } = folha as any;
      const { data, error } = await supabase
        .from('folha_pagamento')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.folha });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Folha de pagamento atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar folha de pagamento'),
  });
}

export function useMarcarFolhaPaga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ folhaId, despesaId }: { folhaId: string; despesaId?: string }) => {
      const { data, error } = await supabase
        .from('folha_pagamento')
        .update({ 
          pago: true, 
          data_pagamento: new Date().toISOString().split('T')[0],
          despesa_id: despesaId 
        })
        .eq('id', folhaId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.folha });
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.stats });
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  });
}

// RH Stats Hook
export function useRHStats() {
  return useQuery({
    queryKey: rhQueryKeys.stats,
    queryFn: async () => {
      const [funcionariosRes, folhaRes] = await Promise.all([
        supabase.from('funcionarios').select('id, status, tipo, salario_base'),
        supabase.from('folha_pagamento').select('total_liquido, pago, mes_referencia, ano_referencia'),
      ]);

      if (funcionariosRes.error) throw funcionariosRes.error;
      if (folhaRes.error) throw folhaRes.error;

      const funcionarios = funcionariosRes.data || [];
      const folhas = folhaRes.data || [];

      const ativos = funcionarios.filter(f => f.status === 'ativo').length;
      const professores = funcionarios.filter(f => f.tipo === 'professor').length;
      const administrativos = funcionarios.filter(f => f.tipo === 'administrativo').length;
      
      const totalSalarios = funcionarios
        .filter(f => f.status === 'ativo')
        .reduce((sum, f) => sum + (f.salario_base || 0), 0);

      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();
      
      const folhasMesAtual = folhas.filter(
        f => f.mes_referencia === mesAtual && f.ano_referencia === anoAtual
      );
      
      const folhasPagas = folhasMesAtual.filter(f => f.pago).length;
      const folhasPendentes = folhasMesAtual.filter(f => !f.pago).length;
      
      const gastoMesAtual = folhasMesAtual
        .filter(f => f.pago)
        .reduce((sum, f) => sum + (f.total_liquido || 0), 0);

      return {
        totalFuncionarios: funcionarios.length,
        funcionariosAtivos: ativos,
        professores,
        administrativos,
        totalSalarios,
        folhasPagas,
        folhasPendentes,
        gastoMesAtual,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
