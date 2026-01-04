import { useState } from "react";
import { useFuncionarios, usePontoRegistros, useRegistrarPonto, PontoRegistro } from "@/hooks/useRH";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, Coffee, Play } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function PontoTab() {
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(1)), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: registros, isLoading: loadingRegistros } = usePontoRegistros(
    selectedFuncionario || undefined,
    startDate,
    endDate
  );
  const registrarPonto = useRegistrarPonto();

  const funcionariosAtivos = funcionarios?.filter(f => f.status === 'ativo') || [];

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Registro de Ponto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registrar Ponto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
              <SelectTrigger className="w-full sm:w-[300px]">
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

            <div className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
            </div>
          </div>

          {selectedFuncionario && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant={pontoHoje?.entrada ? "secondary" : "default"}
                className="h-20 flex-col gap-2"
                onClick={() => handleRegistrarPonto('entrada')}
                disabled={registrarPonto.isPending || !!pontoHoje?.entrada}
              >
                <LogIn className="h-6 w-6" />
                <span>Entrada</span>
                {pontoHoje?.entrada && (
                  <span className="text-xs">{pontoHoje.entrada}</span>
                )}
              </Button>

              <Button
                variant={pontoHoje?.saida_almoco ? "secondary" : "outline"}
                className="h-20 flex-col gap-2"
                onClick={() => handleRegistrarPonto('saida_almoco')}
                disabled={registrarPonto.isPending || !pontoHoje?.entrada || !!pontoHoje?.saida_almoco}
              >
                <Coffee className="h-6 w-6" />
                <span>Saída Almoço</span>
                {pontoHoje?.saida_almoco && (
                  <span className="text-xs">{pontoHoje.saida_almoco}</span>
                )}
              </Button>

              <Button
                variant={pontoHoje?.retorno_almoco ? "secondary" : "outline"}
                className="h-20 flex-col gap-2"
                onClick={() => handleRegistrarPonto('retorno_almoco')}
                disabled={registrarPonto.isPending || !pontoHoje?.saida_almoco || !!pontoHoje?.retorno_almoco}
              >
                <Play className="h-6 w-6" />
                <span>Retorno Almoço</span>
                {pontoHoje?.retorno_almoco && (
                  <span className="text-xs">{pontoHoje.retorno_almoco}</span>
                )}
              </Button>

              <Button
                variant={pontoHoje?.saida ? "secondary" : "destructive"}
                className="h-20 flex-col gap-2"
                onClick={() => handleRegistrarPonto('saida')}
                disabled={registrarPonto.isPending || !pontoHoje?.entrada || !!pontoHoje?.saida}
              >
                <LogOut className="h-6 w-6" />
                <span>Saída</span>
                {pontoHoje?.saida && (
                  <span className="text-xs">{pontoHoje.saida}</span>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Ponto */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ponto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Até:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
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
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída Almoço</TableHead>
                    <TableHead>Retorno</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Horas Trab.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros?.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        {format(new Date(registro.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{registro.funcionarios?.nome_completo}</TableCell>
                      <TableCell>{registro.entrada || "-"}</TableCell>
                      <TableCell>{registro.saida_almoco || "-"}</TableCell>
                      <TableCell>{registro.retorno_almoco || "-"}</TableCell>
                      <TableCell>{registro.saida || "-"}</TableCell>
                      <TableCell>{registro.horas_trabalhadas || "-"}</TableCell>
                    </TableRow>
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
