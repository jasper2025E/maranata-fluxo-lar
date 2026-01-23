import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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

      if (responsavelId && data.alunos_ids) {
        await supabase
          .from("alunos")
          .update({ responsavel_id: null })
          .eq("responsavel_id", responsavelId);

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
      toast.success(selectedResponsavel ? t("guardians.updateSuccess") : t("guardians.createSuccess"));
      resetForm();
    },
    onError: (error: any) => {
      toast.error(t("guardians.saveError") + ": " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("responsaveis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      queryClient.invalidateQueries({ queryKey: ["responsaveis-stats"] });
      toast.success(t("guardians.deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(t("guardians.deleteError") + ": " + error.message);
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
      toast.error(t("guardians.requiredFields"));
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.financial")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("guardians.title")}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("guardians.title")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("guardians.description")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("guardians.newGuardian")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedResponsavel ? t("guardians.editGuardian") : t("guardians.quickRegister")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {t("guardians.requiredFieldsLabel")}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="nome">{t("guardians.name")} *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder={t("guardians.namePlaceholder")}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">{t("guardians.phone")} *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {t("guardians.optionalFields")}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cpf">{t("guardians.cpf")}</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf || ""}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("guardians.email")}</Label>
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
                    <Label htmlFor="observacoes">{t("guardians.observations")}</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ""}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder={t("guardians.observationsPlaceholder")}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("guardians.linkStudents")}
                    </Label>
                    <div className="border rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                      {alunosDisponiveis.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">{t("guardians.noStudentsRegistered")}</p>
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
                                  <span className="text-xs text-amber-600 ml-2">({t("guardians.otherGuardian")})</span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.alunos_ids && formData.alunos_ids.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {formData.alunos_ids.length} {t("guardians.studentsSelected")}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? t("common.saving") : t("common.save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <FinancialKPICard
            icon={Users}
            title={t("guardians.activeGuardians")}
            value={stats?.ativos || 0}
            variant="info"
            size="sm"
          />
          <FinancialKPICard
            icon={FileText}
            title={t("guardians.openInvoices")}
            value={formatCurrency(stats?.valorReceber || 0)}
            variant="warning"
            size="sm"
          />
          <FinancialKPICard
            icon={Wallet}
            title={t("guardians.toReceive")}
            value={formatCurrency(stats?.valorReceber || 0)}
            variant="success"
            size="sm"
          />
          <FinancialKPICard
            icon={AlertCircle}
            title={t("guardians.delinquency")}
            value={`${stats?.inadimplencia || 0}%`}
            variant={stats?.inadimplencia && stats.inadimplencia > 10 ? "danger" : "default"}
            size="sm"
          />
        </div>

        {/* Table */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                {t("guardians.guardianList")}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <TableSkeleton />
            ) : !filteredResponsaveis?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {t("guardians.noGuardiansFound")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {t("guardians.noGuardiansDescription")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">{t("guardians.name")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("guardians.contact")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("guardians.students")}</TableHead>
                    <TableHead className="font-semibold text-foreground">{t("guardians.status")}</TableHead>
                    <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponsaveis.map((responsavel) => (
                    <TableRow key={responsavel.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium text-foreground">{responsavel.nome}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {formatPhone(responsavel.telefone)}
                          </div>
                          {responsavel.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {responsavel.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {responsavel.alunos?.length || 0} {t("guardians.studentsLinked")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={responsavel.ativo 
                          ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
                          : "bg-muted text-muted-foreground hover:bg-muted"
                        }>
                          {responsavel.ativo ? t("guardians.active") : t("guardians.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(responsavel)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t("common.view")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(responsavel)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (confirm(t("guardians.confirmDelete"))) {
                                  deleteMutation.mutate(responsavel.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("guardians.details")}</DialogTitle>
            </DialogHeader>
            {selectedResponsavel && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedResponsavel.nome}</h3>
                    <p className="text-sm text-muted-foreground">{formatPhone(selectedResponsavel.telefone)}</p>
                  </div>
                </div>
                {selectedResponsavel.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedResponsavel.email}
                  </div>
                )}
                {selectedResponsavel.alunos && selectedResponsavel.alunos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">{t("guardians.linkedStudents")}:</p>
                    <div className="space-y-1">
                      {selectedResponsavel.alunos.map((aluno) => (
                        <div key={aluno.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{aluno.nome_completo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
