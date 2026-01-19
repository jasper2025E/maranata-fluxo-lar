import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  FileText,
  Wallet,
  AlertCircle,
  Eye,
  ChevronRight,
} from "lucide-react";
import { formatPhone } from "@/lib/formatters";
import { FinancialKPICard } from "@/components/dashboard";

interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
  cpf: string | null;
  email: string | null;
  observacoes: string | null;
  ativo: boolean;
  fatura_consolidada: boolean;
  created_at: string;
  alunos?: { id: string; nome_completo: string; status_matricula: string }[];
}

interface ResponsavelFormData {
  nome: string;
  telefone: string;
  cpf?: string;
  email?: string;
  observacoes?: string;
  fatura_consolidada?: boolean;
  alunos_ids?: string[];
}

interface AlunoSemResponsavel {
  id: string;
  nome_completo: string;
  curso?: { nome: string } | null;
}

// Table Skeleton
const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

export default function Responsaveis() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedResponsavel, setSelectedResponsavel] = useState<Responsavel | null>(null);
  const [formData, setFormData] = useState<ResponsavelFormData>({
    nome: "",
    telefone: "",
    alunos_ids: [],
  });

  // Fetch alunos para vincular
  const { data: alunosDisponiveis = [] } = useQuery({
    queryKey: ["alunos-para-vincular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, responsavel_id, cursos(nome)")
        .order("nome_completo");
      if (error) throw error;
      return data as (AlunoSemResponsavel & { responsavel_id: string | null })[];
    },
  });

  // Fetch responsáveis with their alunos
  const { data: responsaveis, isLoading } = useQuery({
    queryKey: ["responsaveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select(`
          *,
          alunos:alunos(id, nome_completo, status_matricula)
        `)
        .order("nome");

      if (error) throw error;
      return data as Responsavel[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["responsaveis-stats"],
    queryFn: async () => {
      const [responsaveisResult, faturasResult] = await Promise.all([
        supabase.from("responsaveis").select("id, ativo"),
        supabase.from("faturas").select("id, status, valor, responsavel_id"),
      ]);

      const responsaveis = responsaveisResult.data || [];
      const faturas = faturasResult.data || [];

      const ativos = responsaveis.filter((r) => r.ativo).length;
      const faturasAbertas = faturas.filter((f) => f.status === "Aberta");
      const faturasVencidas = faturas.filter((f) => f.status === "Vencida");
      const valorReceber = faturasAbertas.reduce((sum, f) => sum + Number(f.valor), 0);

      // Inadimplência: responsáveis com faturas vencidas
      const responsaveisComVencidas = new Set(faturasVencidas.map((f) => f.responsavel_id)).size;
      const inadimplencia = ativos > 0 ? Math.round((responsaveisComVencidas / ativos) * 100) : 0;

      return {
        total: responsaveis.length,
        ativos,
        valorReceber,
        inadimplencia,
      };
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ResponsavelFormData & { id?: string }) => {
      let responsavelId = data.id;
      
      if (data.id) {
        const { error } = await supabase
          .from("responsaveis")
          .update({
            nome: data.nome,
            telefone: data.telefone,
            cpf: data.cpf || null,
            email: data.email || null,
            observacoes: data.observacoes || null,
            fatura_consolidada: data.fatura_consolidada || false,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { data: newResp, error } = await supabase
          .from("responsaveis")
          .insert({
            nome: data.nome,
            telefone: data.telefone,
            cpf: data.cpf || null,
            email: data.email || null,
            observacoes: data.observacoes || null,
            fatura_consolidada: data.fatura_consolidada || false,
          })
          .select()
          .single();
        if (error) throw error;
        responsavelId = newResp.id;
      }

      // Atualizar vinculação dos alunos
      if (responsavelId && data.alunos_ids) {
        // Primeiro remove o responsável de todos os alunos que tinham esse responsável
        await supabase
          .from("alunos")
          .update({ responsavel_id: null })
          .eq("responsavel_id", responsavelId);

        // Depois vincula os alunos selecionados
        if (data.alunos_ids.length > 0) {
          await supabase
            .from("alunos")
            .update({ responsavel_id: responsavelId })
            .in("id", data.alunos_ids);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis-stats"] });
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["alunos-para-vincular"] });
      toast.success(selectedResponsavel ? "Responsável atualizado!" : "Responsável cadastrado!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("responsaveis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis-stats"] });
      toast.success("Responsável removido!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ nome: "", telefone: "", alunos_ids: [] });
    setSelectedResponsavel(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (responsavel: Responsavel) => {
    setSelectedResponsavel(responsavel);
    setFormData({
      nome: responsavel.nome,
      telefone: responsavel.telefone,
      cpf: responsavel.cpf || "",
      email: responsavel.email || "",
      observacoes: responsavel.observacoes || "",
      fatura_consolidada: responsavel.fatura_consolidada,
      alunos_ids: responsavel.alunos?.map(a => a.id) || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: selectedResponsavel?.id,
    });
  };

  const handleViewDetail = (responsavel: Responsavel) => {
    setSelectedResponsavel(responsavel);
    setIsDetailOpen(true);
  };

  const filteredResponsaveis = responsaveis?.filter(
    (r) =>
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefone.includes(searchTerm) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Responsáveis Financeiros</h1>
            <p className="text-muted-foreground mt-1">Gerencie os responsáveis e suas mensalidades</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Novo Responsável
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedResponsavel ? "Editar Responsável" : "Cadastro Rápido"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Required Fields */}
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Campos Obrigatórios
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do responsável"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="space-y-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Campos Opcionais
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf || ""}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ""}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Anotações sobre o responsável..."
                      rows={2}
                    />
                  </div>

                  {/* Seleção de Alunos */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Vincular Alunos
                    </Label>
                    <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                      {alunosDisponiveis.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">Nenhum aluno cadastrado</p>
                      ) : (
                        alunosDisponiveis.map((aluno) => {
                          const isSelected = formData.alunos_ids?.includes(aluno.id);
                          const hasOtherResponsavel = aluno.responsavel_id && 
                            aluno.responsavel_id !== selectedResponsavel?.id;
                          
                          return (
                            <label 
                              key={aluno.id}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                              } ${hasOtherResponsavel ? 'opacity-50' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...(formData.alunos_ids || []), aluno.id]
                                    : formData.alunos_ids?.filter(id => id !== aluno.id) || [];
                                  setFormData({ ...formData, alunos_ids: newIds });
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{aluno.nome_completo}</span>
                                {aluno.curso && (
                                  <span className="text-xs text-gray-500 ml-2">({aluno.curso.nome})</span>
                                )}
                                {hasOtherResponsavel && (
                                  <span className="text-xs text-amber-600 ml-2">(outro responsável)</span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.alunos_ids && formData.alunos_ids.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {formData.alunos_ids.length} aluno(s) selecionado(s)
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards - Premium Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinancialKPICard
            icon={Users}
            title="Responsáveis Ativos"
            value={stats?.ativos || 0}
            variant="info"
            size="sm"
          />
          <FinancialKPICard
            icon={FileText}
            title="Mensalidades Abertas"
            value={formatCurrency(stats?.valorReceber || 0)}
            variant="warning"
            size="sm"
          />
          <FinancialKPICard
            icon={Wallet}
            title="Valor a Receber"
            value={formatCurrency(stats?.valorReceber || 0)}
            variant="success"
            size="sm"
          />
          <FinancialKPICard
            icon={AlertCircle}
            title="Inadimplência"
            value={`${stats?.inadimplencia || 0}%`}
            variant={(stats?.inadimplencia || 0) > 20 ? "danger" : (stats?.inadimplencia || 0) > 10 ? "warning" : "info"}
            size="sm"
          />
        </div>

        {/* Search and Table */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <CardTitle className="text-lg font-semibold text-foreground">Lista de Responsáveis</CardTitle>
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : filteredResponsaveis && filteredResponsaveis.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold">Contato</TableHead>
                    <TableHead className="font-semibold text-center">Alunos</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponsaveis.map((responsavel) => (
                    <TableRow
                      key={responsavel.id}
                      className="hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => handleViewDetail(responsavel)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {responsavel.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{responsavel.nome}</p>
                            {responsavel.cpf && (
                              <p className="text-xs text-gray-500">{responsavel.cpf}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {responsavel.telefone}
                          </div>
                          {responsavel.email && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {responsavel.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-medium">
                          {responsavel.alunos?.length || 0} aluno(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={responsavel.ativo ? "default" : "secondary"}
                          className={
                            responsavel.ativo
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {responsavel.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetail(responsavel);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(responsavel);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Deseja remover este responsável?")) {
                                  deleteMutation.mutate(responsavel.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Nenhum responsável encontrado
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Cadastre o primeiro responsável para começar
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Responsável
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Responsável</DialogTitle>
            </DialogHeader>
            {selectedResponsavel && (
              <div className="space-y-6">
                {/* Responsável Info */}
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {selectedResponsavel.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedResponsavel.nome}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {selectedResponsavel.telefone}
                      </span>
                      {selectedResponsavel.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {selectedResponsavel.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alunos vinculados */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Alunos Vinculados</h4>
                  {selectedResponsavel.alunos && selectedResponsavel.alunos.length > 0 ? (
                    <div className="space-y-2">
                      {selectedResponsavel.alunos.map((aluno) => (
                        <div
                          key={aluno.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium text-gray-900">{aluno.nome_completo}</span>
                          <Badge
                            variant="secondary"
                            className={
                              aluno.status_matricula === "ativo"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {aluno.status_matricula}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhum aluno vinculado ainda</p>
                  )}
                </div>

                {/* Observações */}
                {selectedResponsavel.observacoes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Observações</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedResponsavel.observacoes}
                    </p>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleEdit(selectedResponsavel);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
