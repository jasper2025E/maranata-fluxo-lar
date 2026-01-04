import { useState, useMemo } from "react";
import { useFuncionarios, usePontoRegistros } from "@/hooks/useRH";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { BarChart, Clock, AlertTriangle, TrendingUp, Download, Users, Calendar } from "lucide-react";
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

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

const HORA_ENTRADA_ESPERADA = 8 * 60; // 8:00 em minutos
const CARGA_HORARIA_DIARIA = 8 * 60; // 8 horas em minutos

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
  const currentMonth = new Date();
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("all");
  const [startDate, setStartDate] = useState(format(startOfMonth(currentMonth), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(currentMonth), "yyyy-MM-dd"));

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

    // Inicializa todos os funcionários ativos
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

    // Processa registros
    registros.forEach(registro => {
      const resumo = resumoMap.get(registro.funcionario_id);
      if (!resumo) return;

      // Conta dia trabalhado se tem entrada
      if (registro.entrada) {
        resumo.diasTrabalhados++;

        // Calcula atraso
        const entradaMinutos = parseTimeToMinutes(registro.entrada);
        if (entradaMinutos && entradaMinutos > HORA_ENTRADA_ESPERADA + 10) { // 10 min tolerância
          resumo.atrasos++;
          resumo.minutosAtraso += entradaMinutos - HORA_ENTRADA_ESPERADA;
        }
      }

      // Calcula horas trabalhadas
      if (registro.entrada && registro.saida) {
        const entrada = parseTimeToMinutes(registro.entrada) || 0;
        const saida = parseTimeToMinutes(registro.saida) || 0;
        const saidaAlmoco = parseTimeToMinutes(registro.saida_almoco);
        const retornoAlmoco = parseTimeToMinutes(registro.retorno_almoco);

        let horasTrabalhadas = saida - entrada;
        
        // Desconta almoço se registrado
        if (saidaAlmoco && retornoAlmoco) {
          horasTrabalhadas -= (retornoAlmoco - saidaAlmoco);
        }

        resumo.horasTrabalhadas += horasTrabalhadas;

        // Calcula horas extras
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Relatórios de Ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger className="w-full sm:w-[250px]">
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
                className="w-auto"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funcionários</p>
                <p className="text-2xl font-bold">{funcionariosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Trabalhadas</p>
                <p className="text-2xl font-bold">{formatMinutesToHours(totais.horasTrabalhadas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas Extras</p>
                <p className="text-2xl font-bold">{formatMinutesToHours(totais.horasExtras)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Atrasos</p>
                <p className="text-2xl font-bold">{totais.atrasos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Tabelas */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resumo">Resumo por Funcionário</TabsTrigger>
          <TabsTrigger value="atrasos">Ranking de Atrasos</TabsTrigger>
          <TabsTrigger value="extras">Ranking Horas Extras</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo">
          <Card>
            <CardContent className="pt-6">
              {loadingRegistros ? (
                <LoadingState />
              ) : resumosPorFuncionario.length === 0 ? (
                <EmptyState
                  icon={BarChart}
                  title="Nenhum dado encontrado"
                  description="Não há registros de ponto no período selecionado"
                />
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Dias</TableHead>
                        <TableHead className="text-center">Horas Trabalhadas</TableHead>
                        <TableHead className="text-center">Horas Extras</TableHead>
                        <TableHead className="text-center">Atrasos</TableHead>
                        <TableHead className="text-center">Tempo Atraso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumosPorFuncionario.map((resumo) => (
                        <TableRow key={resumo.id}>
                          <TableCell className="font-medium">{resumo.nome}</TableCell>
                          <TableCell className="text-center">{resumo.diasTrabalhados}</TableCell>
                          <TableCell className="text-center">
                            {formatMinutesToHours(resumo.horasTrabalhadas)}
                          </TableCell>
                          <TableCell className="text-center">
                            {resumo.horasExtras > 0 ? (
                              <Badge variant="default" className="bg-blue-500">
                                {formatMinutesToHours(resumo.horasExtras)}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {resumo.atrasos > 0 ? (
                              <Badge variant="destructive">{resumo.atrasos}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600">0</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {resumo.minutosAtraso > 0 ? formatMinutesToHours(resumo.minutosAtraso) : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atrasos">
          <Card>
            <CardContent className="pt-6">
              {rankingAtrasos.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Nenhum atraso"
                  description="Não há registros de atrasos no período selecionado"
                />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-center">Tempo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingAtrasos.map((resumo, index) => (
                        <TableRow key={resumo.id}>
                          <TableCell>
                            <Badge variant={index < 3 ? "destructive" : "outline"}>
                              {index + 1}º
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{resumo.nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="destructive">{resumo.atrasos} atrasos</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {formatMinutesToHours(resumo.minutosAtraso)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extras">
          <Card>
            <CardContent className="pt-6">
              {rankingHorasExtras.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="Sem horas extras"
                  description="Não há registros de horas extras no período selecionado"
                />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Horas Extras</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingHorasExtras.map((resumo, index) => (
                        <TableRow key={resumo.id}>
                          <TableCell>
                            <Badge variant={index < 3 ? "default" : "outline"} className={index < 3 ? "bg-blue-500" : ""}>
                              {index + 1}º
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{resumo.nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="default" className="bg-blue-500">
                              {formatMinutesToHours(resumo.horasExtras)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
