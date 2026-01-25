import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Receipt, DollarSign, QrCode, CreditCard as CardIcon, FileBarChart, ChevronRight } from "lucide-react";
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

const Pagamentos = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [gatewayFilter, setGatewayFilter] = useState("todos");

  const meses = [
    t("common.january"), t("common.february"), t("common.march"), t("common.april"),
    t("common.may"), t("common.june"), t("common.july"), t("common.august"),
    t("common.september"), t("common.october"), t("common.november"), t("common.december")
  ];

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
      if (metodo === "Cartão") return <Badge className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20">{t("payments.card")} Asaas</Badge>;
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{metodo} Asaas</Badge>;
    }
    if (gateway === "stripe") {
      return <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-500/20">Stripe</Badge>;
    }
    switch (metodo) {
      case "PIX":
        return <Badge className="bg-success/10 text-success hover:bg-success/20">PIX</Badge>;
      case "Cartão":
        return <Badge className="bg-info/10 text-info hover:bg-info/20">{t("payments.card")}</Badge>;
      case "Boleto":
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Boleto</Badge>;
      default:
        return <Badge variant="outline">{t("payments.cash")}</Badge>;
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.financial")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("payments.title")}</span>
        </nav>

        {/* Header */}
        <div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <FinancialKPICard
            title={t("payments.totalPayments")}
            value={pagamentos.length}
            icon={Receipt}
            variant="info"
          />
          <FinancialKPICard
            title={t("payments.totalReceived")}
            value={formatCurrency(totalRecebido)}
            icon={DollarSign}
            variant="success"
          />
          <FinancialKPICard
            title={t("payments.viaAsaas")}
            value={pagamentosAsaas.length}
            icon={QrCode}
            variant="default"
          />
          <FinancialKPICard
            title={t("payments.manual")}
            value={pagamentosManuais.length}
            icon={FileBarChart}
            variant="warning"
          />
        </div>

        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">{t("payments.history")}</CardTitle>
                <CardDescription className="text-muted-foreground">{filteredPagamentos.length} {t("payments.paymentsCount")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Tabs value={gatewayFilter} onValueChange={setGatewayFilter} className="w-auto">
                  <TabsList className="h-9">
                    <TabsTrigger value="todos" className="text-xs">{t("common.all")}</TabsTrigger>
                    <TabsTrigger value="asaas" className="text-xs">Asaas</TabsTrigger>
                    <TabsTrigger value="stripe" className="text-xs">Stripe</TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs">{t("payments.manual")}</TabsTrigger>
                  </TabsList>
                </Tabs>
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">{t("common.loading")}</p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="text-muted-foreground">{t("payments.noPaymentsFound")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t("payments.date")}</TableHead>
                    <TableHead>{t("payments.student")}</TableHead>
                    <TableHead>{t("payments.reference")}</TableHead>
                    <TableHead>{t("payments.value")}</TableHead>
                    <TableHead>{t("payments.method")}</TableHead>
                    <TableHead>{t("payments.gateway")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                          <span className="text-muted-foreground text-xs">{t("payments.manual")}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-1 h-4 w-4" />
                          {t("payments.receipt")}
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
