import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Fatura {
  id: string;
  aluno_id: string;
  curso_id: string;
  valor: number;
  mes_referencia: number;
  ano_referencia: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
  alunos?: { nome_completo: string; email_responsavel: string };
  cursos?: { nome: string };
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Faturas = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [paymentData, setPaymentData] = useState({
    metodo: "",
    referencia: "",
  });

  const { data: faturas = [], isLoading } = useQuery({
    queryKey: ["faturas"],
    queryFn: async () => {
      // Atualizar status de faturas vencidas
      await supabase.rpc("atualizar_status_faturas");
      
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo, email_responsavel), cursos(nome)")
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      return data as Fatura[];
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { fatura: Fatura; metodo: string; referencia: string }) => {
      // Registrar pagamento
      const { error: paymentError } = await supabase.from("pagamentos").insert({
        fatura_id: data.fatura.id,
        valor: data.fatura.valor,
        metodo: data.metodo,
        referencia: data.referencia || null,
      });
      if (paymentError) throw paymentError;

      // Atualizar status da fatura
      const { error: faturaError } = await supabase
        .from("faturas")
        .update({ status: "Paga" })
        .eq("id", data.fatura.id);
      if (faturaError) throw faturaError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
      toast.success("Pagamento registrado com sucesso!");
      setIsPaymentOpen(false);
      setPaymentData({ metodo: "", referencia: "" });
    },
    onError: () => toast.error("Erro ao registrar pagamento"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faturas").update({ status: "Cancelada" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      toast.success("Fatura cancelada");
    },
    onError: () => toast.error("Erro ao cancelar fatura"),
  });

  const handleOpenPayment = (fatura: Fatura) => {
    setSelectedFatura(fatura);
    setIsPaymentOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFatura) {
      paymentMutation.mutate({
        fatura: selectedFatura,
        metodo: paymentData.metodo,
        referencia: paymentData.referencia,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paga":
        return <Badge className="bg-green-500 hover:bg-green-600">Paga</Badge>;
      case "Vencida":
        return <Badge variant="destructive">Vencida</Badge>;
      case "Cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Aberta</Badge>;
    }
  };

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesSearch =
      fatura.alunos?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fatura.cursos?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todas" || fatura.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    abertas: faturas.filter((f) => f.status === "Aberta").length,
    pagas: faturas.filter((f) => f.status === "Paga").length,
    vencidas: faturas.filter((f) => f.status === "Vencida").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faturas</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as faturas dos alunos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Abertas</CardDescription>
              <CardTitle className="text-2xl">{stats.abertas}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pagas</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.pagas}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Vencidas</CardDescription>
              <CardTitle className="text-2xl text-destructive">{stats.vencidas}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Lista de Faturas</CardTitle>
                <CardDescription>{filteredFaturas.length} fatura(s)</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="aberta">Abertas</SelectItem>
                    <SelectItem value="paga">Pagas</SelectItem>
                    <SelectItem value="vencida">Vencidas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredFaturas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaturas.map((fatura) => (
                    <TableRow key={fatura.id}>
                      <TableCell className="font-medium">{fatura.alunos?.nome_completo}</TableCell>
                      <TableCell>{fatura.cursos?.nome}</TableCell>
                      <TableCell>{meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fatura.valor)}
                      </TableCell>
                      <TableCell>{format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                      <TableCell className="text-right">
                        {fatura.status === "Aberta" || fatura.status === "Vencida" ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenPayment(fatura)}>
                              <CreditCard className="mr-1 h-4 w-4" />
                              Pagar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelMutation.mutate(fatura.id)}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <FileText className="mr-1 h-4 w-4" />
                            Recibo
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitPayment}>
              <DialogHeader>
                <DialogTitle>Registrar Pagamento</DialogTitle>
                <DialogDescription>
                  {selectedFatura && (
                    <>
                      Aluno: {selectedFatura.alunos?.nome_completo}<br />
                      Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedFatura.valor)}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Método de Pagamento</Label>
                  <Select value={paymentData.metodo} onValueChange={(value) => setPaymentData({ ...paymentData, metodo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Referência/Código (opcional)</Label>
                  <Input
                    value={paymentData.referencia}
                    onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
                    placeholder="Código do comprovante"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!paymentData.metodo || paymentMutation.isPending}>
                  Confirmar Pagamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Faturas;
