import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Building2, 
  GraduationCap,
  Users,
  Receipt,
  DollarSign,
  BookOpen,
  Layers,
  Eye,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { formatCurrency } from "@/lib/formatters";

interface TenantStats {
  totalAlunos: number;
  alunosAtivos: number;
  totalCursos: number;
  totalTurmas: number;
  totalFaturas: number;
  faturasAbertas: number;
  faturasVencidas: number;
  faturasPagas: number;
  receitaTotal: number;
  receitaMes: number;
  totalDespesas: number;
  despesasMes: number;
}

interface Aluno {
  id: string;
  nome_completo: string;
  email_responsavel: string | null;
  status_matricula: string | null;
  data_matricula: string;
  curso: { nome: string } | null;
}

interface Fatura {
  id: string;
  codigo_sequencial: string | null;
  valor_total: number | null;
  status: string;
  data_vencimento: string;
  aluno: { nome_completo: string } | null;
}

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
  ativo: boolean | null;
  _count?: { alunos: number };
}

interface Despesa {
  id: string;
  titulo: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  paga: boolean | null;
}

export default function TenantData() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const { isPlatformAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [stats, setStats] = useState<TenantStats>({
    totalAlunos: 0,
    alunosAtivos: 0,
    totalCursos: 0,
    totalTurmas: 0,
    totalFaturas: 0,
    faturasAbertas: 0,
    faturasVencidas: 0,
    faturasPagas: 0,
    receitaTotal: 0,
    receitaMes: 0,
    totalDespesas: 0,
    despesasMes: 0,
  });
  
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    if (id) {
      fetchData();
    }
  }, [isPlatformAdmin, navigate, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tenant info
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // Fetch all data in parallel
      const [
        alunosRes,
        cursosRes,
        turmasRes,
        faturasRes,
        despesasRes
      ] = await Promise.all([
        supabase.from("alunos").select("*, curso:cursos(nome)").eq("tenant_id", id).order("nome_completo"),
        supabase.from("cursos").select("*").eq("tenant_id", id),
        supabase.from("turmas").select("*").eq("tenant_id", id),
        supabase.from("faturas").select("*, aluno:alunos(nome_completo)").eq("tenant_id", id).order("data_vencimento", { ascending: false }).limit(100),
        supabase.from("despesas").select("*").eq("tenant_id", id).order("data_vencimento", { ascending: false }).limit(100),
      ]);

      const alunosData = alunosRes.data || [];
      const cursosData = cursosRes.data || [];
      const turmasData = turmasRes.data || [];
      const faturasData = faturasRes.data || [];
      const despesasData = despesasRes.data || [];

      setAlunos(alunosData);
      setCursos(cursosData);
      setFaturas(faturasData);
      setDespesas(despesasData);

      // Calculate stats
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const faturasAbertas = faturasData.filter(f => f.status === "Aberta" || f.status === "Pendente");
      const faturasVencidas = faturasData.filter(f => 
        (f.status === "Aberta" || f.status === "Vencida") && 
        new Date(f.data_vencimento) < now
      );
      const faturasPagas = faturasData.filter(f => f.status === "Paga");

      const receitaTotal = faturasPagas.reduce((sum, f) => sum + (f.valor_total || 0), 0);
      const receitaMes = faturasPagas
        .filter(f => {
          const d = new Date(f.data_vencimento);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, f) => sum + (f.valor_total || 0), 0);

      const totalDespesas = despesasData.reduce((sum, d) => sum + d.valor, 0);
      const despesasMes = despesasData
        .filter(d => {
          const date = new Date(d.data_vencimento);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, d) => sum + d.valor, 0);

      setStats({
        totalAlunos: alunosData.length,
        alunosAtivos: alunosData.filter(a => a.status_matricula === "ativo").length,
        totalCursos: cursosData.length,
        totalTurmas: turmasData.length,
        totalFaturas: faturasData.length,
        faturasAbertas: faturasAbertas.length,
        faturasVencidas: faturasVencidas.length,
        faturasPagas: faturasPagas.length,
        receitaTotal,
        receitaMes,
        totalDespesas,
        despesasMes,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados da escola");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    navigate(`/platform/tenants/${id}/data?tab=${value}`);
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ativo: { variant: "default", label: "Ativo" },
      inativo: { variant: "secondary", label: "Inativo" },
      trancado: { variant: "outline", label: "Trancado" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status || "ativo"] || variants.ativo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getFaturaStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      Paga: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      Aberta: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
      Pendente: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      Vencida: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
      Cancelada: { variant: "outline", icon: <Ban className="h-3 w-3" /> },
    };
    const config = variants[status] || variants.Aberta;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const filteredAlunos = alunos.filter(a => 
    a.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFaturas = faturas.filter(f => 
    f.aluno?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigo_sequencial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </PlatformLayout>
    );
  }

  if (!tenant) {
    return (
      <PlatformLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Escola não encontrada</h2>
          <Button onClick={() => navigate("/platform/tenants")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/platform/tenants/${id}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Dados de {tenant.nome}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Visualização completa dos dados da escola
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alunos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAlunos}</p>
                  <p className="text-xs text-green-600">{stats.alunosAtivos} ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita do mês</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.receitaMes)}</p>
                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(stats.receitaTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas do mês</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.despesasMes)}</p>
                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(stats.totalDespesas)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturas vencidas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.faturasVencidas}</p>
                  <p className="text-xs text-muted-foreground">{stats.faturasAbertas} abertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="alunos" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Alunos
              </TabsTrigger>
              <TabsTrigger value="faturas" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Faturas
              </TabsTrigger>
              <TabsTrigger value="cursos" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="despesas" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Despesas
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Cursos e Turmas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total de cursos</span>
                        <span className="font-semibold">{stats.totalCursos}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Total de turmas</span>
                        <span className="font-semibold">{stats.totalTurmas}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Alunos por turma (média)</span>
                        <span className="font-semibold">
                          {stats.totalTurmas > 0 ? Math.round(stats.totalAlunos / stats.totalTurmas) : 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Faturas pagas</span>
                        <span className="font-semibold text-green-600">{stats.faturasPagas}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground">Faturas abertas</span>
                        <span className="font-semibold text-blue-600">{stats.faturasAbertas}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Saldo do mês</span>
                        <span className={`font-semibold ${stats.receitaMes - stats.despesasMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.receitaMes - stats.despesasMes)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Alunos Tab */}
            <TabsContent value="alunos" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Alunos ({alunos.length})</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar aluno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlunos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum aluno encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAlunos.slice(0, 50).map((aluno) => (
                          <TableRow key={aluno.id}>
                            <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                            <TableCell>{aluno.curso?.nome || "—"}</TableCell>
                            <TableCell>{aluno.email_responsavel || "—"}</TableCell>
                            <TableCell>
                              {format(new Date(aluno.data_matricula), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{getStatusBadge(aluno.status_matricula)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {filteredAlunos.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Exibindo 50 de {filteredAlunos.length} alunos
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Faturas Tab */}
            <TabsContent value="faturas" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Faturas ({faturas.length})</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar fatura..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFaturas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma fatura encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFaturas.slice(0, 50).map((fatura) => (
                          <TableRow key={fatura.id}>
                            <TableCell className="font-mono text-sm">{fatura.codigo_sequencial || fatura.id.slice(0, 8)}</TableCell>
                            <TableCell>{fatura.aluno?.nome_completo || "—"}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(fatura.valor_total || 0)}</TableCell>
                            <TableCell>
                              {format(new Date(fatura.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{getFaturaStatusBadge(fatura.status)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cursos Tab */}
            <TabsContent value="cursos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cursos ({cursos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead>Mensalidade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cursos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Nenhum curso cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        cursos.map((curso) => (
                          <TableRow key={curso.id}>
                            <TableCell className="font-medium">{curso.nome}</TableCell>
                            <TableCell>{curso.nivel}</TableCell>
                            <TableCell>{formatCurrency(curso.mensalidade)}</TableCell>
                            <TableCell>
                              <Badge variant={curso.ativo !== false ? "default" : "secondary"}>
                                {curso.ativo !== false ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Despesas Tab */}
            <TabsContent value="despesas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Despesas ({despesas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {despesas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhuma despesa cadastrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        despesas.slice(0, 50).map((despesa) => (
                          <TableRow key={despesa.id}>
                            <TableCell className="font-medium">{despesa.titulo}</TableCell>
                            <TableCell>{despesa.categoria}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(despesa.valor)}</TableCell>
                            <TableCell>
                              {format(new Date(despesa.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant={despesa.paga ? "default" : "outline"}>
                                {despesa.paga ? "Paga" : "Pendente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
