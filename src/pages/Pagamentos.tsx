import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Receipt, DollarSign, QrCode, CreditCard as CardIcon, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FinancialKPICard } from "@/components/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Pagamento {
  id: string;
  fatura_id: string;
  data_pagamento: string;
  valor: number;
  metodo: string;
  referencia: string | null;
  gateway: string | null;
  gateway_id: string | null;
  gateway_status: string | null;
  faturas?: {
    alunos?: { nome_completo: string };
    cursos?: { nome: string };
    mes_referencia: number;
    ano_referencia: number;
    asaas_payment_id?: string | null;
  };
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Pagamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("todos");

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, faturas(mes_referencia, ano_referencia, asaas_payment_id, alunos(nome_completo), cursos(nome))")
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data as Pagamento[];
    },
  });

  const totalRecebido = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const pagamentosAsaas = pagamentos.filter(p => p.gateway === "asaas");
  const pagamentosStripe = pagamentos.filter(p => p.gateway === "stripe");
  const pagamentosManuais = pagamentos.filter(p => !p.gateway);

  const filteredPagamentos = pagamentos.filter((pagamento) => {
    const matchesSearch = 
      pagamento.faturas?.alunos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.metodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.gateway_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGateway = 
      gatewayFilter === "todos" ||
      (gatewayFilter === "asaas" && pagamento.gateway === "asaas") ||
      (gatewayFilter === "stripe" && pagamento.gateway === "stripe") ||
      (gatewayFilter === "manual" && !pagamento.gateway);
    
    return matchesSearch && matchesGateway;
  });

  const getMetodoBadge = (metodo: string, gateway: string | null) => {
    if (gateway === "asaas") {
      if (metodo === "PIX") return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">PIX Asaas</Badge>;
      if (metodo === "Boleto") return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">Boleto Asaas</Badge>;
      if (metodo === "Cartão") return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20">Cartão Asaas</Badge>;
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{metodo} Asaas</Badge>;
    }
    if (gateway === "stripe") {
      return <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-500/20">Stripe</Badge>;
    }
    switch (metodo) {
      case "PIX":
        return <Badge className="bg-success/10 text-success hover:bg-success/20">PIX</Badge>;
      case "Cartão":
        return <Badge className="bg-info/10 text-info hover:bg-info/20">Cartão</Badge>;
      case "Boleto":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Boleto</Badge>;
      default:
        return <Badge variant="outline">Dinheiro</Badge>;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Pagamentos</h2>
          <p className="text-muted-foreground mt-1">
            Histórico de pagamentos recebidos via Asaas, Stripe e manual
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <FinancialKPICard
            title="Total de Pagamentos"
            value={pagamentos.length}
            icon={Receipt}
            variant="info"
          />
          <FinancialKPICard
            title="Total Recebido"
            value={formatCurrency(totalRecebido)}
            icon={DollarSign}
            variant="success"
          />
          <FinancialKPICard
            title="Via Asaas"
            value={pagamentosAsaas.length}
            icon={QrCode}
            variant="default"
          />
          <FinancialKPICard
            title="Manuais"
            value={pagamentosManuais.length}
            icon={FileBarChart}
            variant="warning"
          />
        </div>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">Histórico de Pagamentos</CardTitle>
                <CardDescription className="text-muted-foreground">{filteredPagamentos.length} pagamento(s)</CardDescription>
              </div>
              <div className="flex gap-2">
                <Tabs value={gatewayFilter} onValueChange={setGatewayFilter} className="w-auto">
                  <TabsList className="h-9">
                    <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
                    <TabsTrigger value="asaas" className="text-xs">Asaas</TabsTrigger>
                    <TabsTrigger value="stripe" className="text-xs">Stripe</TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pagamento) => (
                    <TableRow key={pagamento.id} className="hover:bg-muted/30">
                      <TableCell>{format(new Date(pagamento.data_pagamento), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">{pagamento.faturas?.alunos?.nome_completo}</TableCell>
                      <TableCell>
                        {pagamento.faturas && meses[pagamento.faturas.mes_referencia - 1]}/{pagamento.faturas?.ano_referencia}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        {formatCurrency(pagamento.valor)}
                      </TableCell>
                      <TableCell>{getMetodoBadge(pagamento.metodo, pagamento.gateway)}</TableCell>
                      <TableCell>
                        {pagamento.gateway ? (
                          <Badge variant="outline" className="text-xs">
                            {pagamento.gateway === "asaas" && <QrCode className="h-3 w-3 mr-1" />}
                            {pagamento.gateway === "stripe" && <CardIcon className="h-3 w-3 mr-1" />}
                            {pagamento.gateway_id?.slice(0, 12)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-1 h-4 w-4" />
                          Recibo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Pagamentos;
