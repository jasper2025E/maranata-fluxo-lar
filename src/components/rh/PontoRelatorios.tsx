import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFuncionarios, usePontoRegistros } from "@/hooks/useRH";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { BarChart, Clock, AlertTriangle, TrendingUp, Download, Users, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FuncionarioResumo {
  id: string;
  nome: string;
  diasTrabalhados: number;
  horasTrabalhadas: number;
  horasExtras: number;
  atrasos: number;
  minutosAtraso: number;
  faltas: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HORA_ENTRADA_ESPERADA = 8 * 60;
const CARGA_HORARIA_DIARIA = 8 * 60;

function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}m`;
}

export function PontoRelatorios() {
  const { t } = useTranslation();
  const currentMonth = new Date();
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("all");
  const [startDate, setStartDate] = useState(format(startOfMonth(currentMonth), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(currentMonth), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("resumo");

  const navItems: NavItem[] = [
    { id: "resumo", label: "Resumo por Funcionário", icon: Users },
    { id: "atrasos", label: "Ranking de Atrasos", icon: AlertTriangle },
    { id: "extras", label: "Ranking Horas Extras", icon: TrendingUp },
  ];

  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: registros, isLoading: loadingRegistros } = usePontoRegistros(
    selectedFuncionario === "all" ? undefined : selectedFuncionario,
    startDate,
    endDate
  );

  const funcionariosAtivos = funcionarios?.filter(f => f.status === 'ativo') || [];

  const resumosPorFuncionario = useMemo(() => {
    if (!registros || !funcionarios) return [];

    const resumoMap = new Map<string, FuncionarioResumo>();

    funcionariosAtivos.forEach(f => {
      resumoMap.set(f.id, {
        id: f.id,
        nome: f.nome_completo,
        diasTrabalhados: 0,
        horasTrabalhadas: 0,
        horasExtras: 0,
        atrasos: 0,
        minutosAtraso: 0,
        faltas: 0,
      });
    });

    registros.forEach(registro => {
      const resumo = resumoMap.get(registro.funcionario_id);
      if (!resumo) return;

      if (registro.entrada) {
        resumo.diasTrabalhados++;

        const entradaMinutos = parseTimeToMinutes(registro.entrada);
        if (entradaMinutos && entradaMinutos > HORA_ENTRADA_ESPERADA + 10) {
          resumo.atrasos++;
          resumo.minutosAtraso += entradaMinutos - HORA_ENTRADA_ESPERADA;
        }
      }

      if (registro.entrada && registro.saida) {
        const entrada = parseTimeToMinutes(registro.entrada) || 0;
        const saida = parseTimeToMinutes(registro.saida) || 0;
        const saidaAlmoco = parseTimeToMinutes(registro.saida_almoco);
        const retornoAlmoco = parseTimeToMinutes(registro.retorno_almoco);

        let horasTrabalhadas = saida - entrada;
        
        if (saidaAlmoco && retornoAlmoco) {
          horasTrabalhadas -= (retornoAlmoco - saidaAlmoco);
        }

        resumo.horasTrabalhadas += horasTrabalhadas;

        if (horasTrabalhadas > CARGA_HORARIA_DIARIA) {
          resumo.horasExtras += horasTrabalhadas - CARGA_HORARIA_DIARIA;
        }
      }
    });

    return Array.from(resumoMap.values());
  }, [registros, funcionarios, funcionariosAtivos]);

  const totais = useMemo(() => {
    return resumosPorFuncionario.reduce(
      (acc, r) => ({
        diasTrabalhados: acc.diasTrabalhados + r.diasTrabalhados,
        horasTrabalhadas: acc.horasTrabalhadas + r.horasTrabalhadas,
        horasExtras: acc.horasExtras + r.horasExtras,
        atrasos: acc.atrasos + r.atrasos,
        minutosAtraso: acc.minutosAtraso + r.minutosAtraso,
      }),
      { diasTrabalhados: 0, horasTrabalhadas: 0, horasExtras: 0, atrasos: 0, minutosAtraso: 0 }
    );
  }, [resumosPorFuncionario]);

  const rankingAtrasos = useMemo(() => {
    return [...resumosPorFuncionario]
      .filter(r => r.atrasos > 0)
      .sort((a, b) => b.minutosAtraso - a.minutosAtraso)
      .slice(0, 10);
  }, [resumosPorFuncionario]);

  const rankingHorasExtras = useMemo(() => {
    return [...resumosPorFuncionario]
      .filter(r => r.horasExtras > 0)
      .sort((a, b) => b.horasExtras - a.horasExtras)
      .slice(0, 10);
  }, [resumosPorFuncionario]);

  const exportToCSV = () => {
    const headers = ['Funcionário', 'Dias Trabalhados', 'Horas Trabalhadas', 'Horas Extras', 'Atrasos', 'Minutos de Atraso'];
    const rows = resumosPorFuncionario.map(r => [
      r.nome,
      r.diasTrabalhados,
      formatMinutesToHours(r.horasTrabalhadas),
      formatMinutesToHours(r.horasExtras),
      r.atrasos,
      r.minutosAtraso,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-ponto-${startDate}-${endDate}.csv`;
    link.click();
  };

  if (loadingFuncionarios) {
    return <LoadingState />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "resumo":
        return (
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
              <CardTitle className="text-lg font-semibold">Resumo por Funcionário</CardTitle>
              <CardDescription>{resumosPorFuncionario.length} funcionário(s)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRegistros ? (
                <div className="py-16"><LoadingState /></div>
              ) : resumosPorFuncionario.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={BarChart}
                    title="Nenhum dado encontrado"
                    description="Não há registros de ponto no período selecionado"
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Dias</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Horas</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Extras</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Atrasos</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Tempo Atraso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumosPorFuncionario.map((resumo, index) => (
                      <motion.tr
                        key={resumo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-muted/50 transition-colors border-b border-border/50"
                      >
                        <TableCell className="font-medium text-foreground">{resumo.nome}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{resumo.diasTrabalhados}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatMinutesToHours(resumo.horasTrabalhadas)}
                        </TableCell>
                        <TableCell className="text-center">
                          {resumo.horasExtras > 0 ? (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono">
                              {formatMinutesToHours(resumo.horasExtras)}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {resumo.atrasos > 0 ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              {resumo.atrasos}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {resumo.minutosAtraso > 0 ? formatMinutesToHours(resumo.minutosAtraso) : "-"}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case "atrasos":
        return (
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
              <CardTitle className="text-lg font-semibold">Ranking de Atrasos</CardTitle>
              <CardDescription>Top 10 funcionários com mais atrasos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rankingAtrasos.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={AlertTriangle}
                    title="Nenhum atraso"
                    description="Não há registros de atrasos no período selecionado"
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground w-16">#</TableHead>
                      <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Quantidade</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Tempo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingAtrasos.map((resumo, index) => (
                      <motion.tr
                        key={resumo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-colors border-b border-border/50"
                      >
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium",
                              index < 3 && "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{resumo.nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            {resumo.atrasos} atrasos
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {formatMinutesToHours(resumo.minutosAtraso)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case "extras":
        return (
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
              <CardTitle className="text-lg font-semibold">Ranking de Horas Extras</CardTitle>
              <CardDescription>Top 10 funcionários com mais horas extras</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rankingHorasExtras.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={TrendingUp}
                    title="Sem horas extras"
                    description="Não há registros de horas extras no período selecionado"
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-foreground w-16">#</TableHead>
                      <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Horas Extras</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingHorasExtras.map((resumo, index) => (
                      <motion.tr
                        key={resumo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-colors border-b border-border/50"
                      >
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "font-medium",
                              index < 3 && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )}
                          >
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{resumo.nome}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono">
                            {formatMinutesToHours(resumo.horasExtras)}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Filters */}
      <Card className="border-border/50 shadow-sm rounded-2xl">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Relatórios de Ponto</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger className="w-full sm:w-[250px] h-10">
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {funcionariosAtivos.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto h-10"
              />
              <span className="text-muted-foreground text-sm">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto h-10"
              />
            </div>

            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funcionários</p>
                <p className="text-2xl font-bold text-foreground">{funcionariosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-2xl font-bold text-foreground">{formatMinutesToHours(totais.horasTrabalhadas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Extras</p>
                <p className="text-2xl font-bold text-foreground">{formatMinutesToHours(totais.horasExtras)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Atrasos</p>
                <p className="text-2xl font-bold text-foreground">{totais.atrasos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </motion.div>
  );
}
