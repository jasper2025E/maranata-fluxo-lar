import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFuncionarios, usePontoRegistros, useRegistrarPonto } from "@/hooks/useRH";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, Coffee, Play, MapPin } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PontoTab() {
  const { t } = useTranslation();
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: registros, isLoading: loadingRegistros } = usePontoRegistros(
    selectedFuncionario || undefined,
    startDate,
    endDate
  );
  const registrarPonto = useRegistrarPonto();

  const funcionariosAtivos = funcionarios?.filter(f => f.status === 'ativo') || [];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegistrarPonto = async (tipo: 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida') => {
    if (!selectedFuncionario) {
      toast.error("Selecione um funcionário");
      return;
    }

    const now = format(new Date(), "HH:mm:ss");
    const hoje = format(new Date(), "yyyy-MM-dd");

    await registrarPonto.mutateAsync({
      funcionario_id: selectedFuncionario,
      data: hoje,
      [tipo]: now,
    });
  };

  const pontoHoje = registros?.find(r => r.data === format(new Date(), "yyyy-MM-dd") && r.funcionario_id === selectedFuncionario);

  if (loadingFuncionarios) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Registro de Ponto */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            Registrar Ponto
          </CardTitle>
          <CardDescription>
            Registre a entrada e saída dos funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger className="w-full sm:w-[300px] h-11">
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionariosAtivos.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-lg font-medium flex items-center gap-2 font-mono bg-muted/50 px-4 py-2 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {format(currentTime, "dd 'de' MMMM, HH:mm:ss", { locale: ptBR })}
            </div>
          </div>

          {selectedFuncionario && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant={pontoHoje?.entrada ? "secondary" : "default"}
                  className={cn(
                    "h-24 w-full flex-col gap-2 rounded-xl",
                    !pontoHoje?.entrada && "bg-blue-600 hover:bg-blue-700"
                  )}
                  onClick={() => handleRegistrarPonto('entrada')}
                  disabled={registrarPonto.isPending || !!pontoHoje?.entrada}
                >
                  <LogIn className="h-6 w-6" />
                  <span className="font-medium">Entrada</span>
                  {pontoHoje?.entrada && (
                    <span className="text-xs opacity-80">{pontoHoje.entrada}</span>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant={pontoHoje?.saida_almoco ? "secondary" : "outline"}
                  className="h-24 w-full flex-col gap-2 rounded-xl"
                  onClick={() => handleRegistrarPonto('saida_almoco')}
                  disabled={registrarPonto.isPending || !pontoHoje?.entrada || !!pontoHoje?.saida_almoco}
                >
                  <Coffee className="h-6 w-6" />
                  <span className="font-medium">Saída Almoço</span>
                  {pontoHoje?.saida_almoco && (
                    <span className="text-xs opacity-80">{pontoHoje.saida_almoco}</span>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant={pontoHoje?.retorno_almoco ? "secondary" : "outline"}
                  className="h-24 w-full flex-col gap-2 rounded-xl"
                  onClick={() => handleRegistrarPonto('retorno_almoco')}
                  disabled={registrarPonto.isPending || !pontoHoje?.saida_almoco || !!pontoHoje?.retorno_almoco}
                >
                  <Play className="h-6 w-6" />
                  <span className="font-medium">Retorno</span>
                  {pontoHoje?.retorno_almoco && (
                    <span className="text-xs opacity-80">{pontoHoje.retorno_almoco}</span>
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant={pontoHoje?.saida ? "secondary" : "destructive"}
                  className="h-24 w-full flex-col gap-2 rounded-xl"
                  onClick={() => handleRegistrarPonto('saida')}
                  disabled={registrarPonto.isPending || !pontoHoje?.entrada || !!pontoHoje?.saida}
                >
                  <LogOut className="h-6 w-6" />
                  <span className="font-medium">Saída</span>
                  {pontoHoje?.saida && (
                    <span className="text-xs opacity-80">{pontoHoje.saida}</span>
                  )}
                </Button>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Ponto */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-lg font-semibold">Histórico de Ponto</CardTitle>
          <CardDescription>Consulte os registros de ponto por período</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">De:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Até:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto h-10"
              />
            </div>
          </div>

          {loadingRegistros ? (
            <LoadingState />
          ) : registros?.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Nenhum registro encontrado"
              description="Não há registros de ponto no período selecionado"
            />
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Data</TableHead>
                    <TableHead className="font-semibold text-foreground">Funcionário</TableHead>
                    <TableHead className="font-semibold text-foreground">Entrada</TableHead>
                    <TableHead className="font-semibold text-foreground">Saída Almoço</TableHead>
                    <TableHead className="font-semibold text-foreground">Retorno</TableHead>
                    <TableHead className="font-semibold text-foreground">Saída</TableHead>
                    <TableHead className="font-semibold text-foreground">Horas</TableHead>
                    <TableHead className="font-semibold text-foreground">Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros?.map((registro, index) => (
                    <motion.tr
                      key={registro.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/50 transition-colors border-b border-border/50"
                    >
                      <TableCell className="font-medium">
                        {format(new Date(registro.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {registro.funcionarios?.nome_completo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.entrada || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.saida_almoco || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.retorno_almoco || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {registro.saida || "-"}
                      </TableCell>
                      <TableCell>
                        {registro.horas_trabalhadas ? (
                          <Badge variant="outline" className="font-mono">
                            {String(registro.horas_trabalhadas).slice(0, 5)}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {(registro as any).localizacao_valida ? (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                            <MapPin className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
