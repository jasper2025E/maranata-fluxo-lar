import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Pagamento {
  id: string;
  fatura_id: string;
  data_pagamento: string;
  valor: number;
  metodo: string;
  referencia: string | null;
  faturas?: {
    alunos?: { nome_completo: string };
    cursos?: { nome: string };
    mes_referencia: number;
    ano_referencia: number;
  };
}

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const Pagamentos = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pagamentos = [], isLoading } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*, faturas(mes_referencia, ano_referencia, alunos(nome_completo), cursos(nome))")
        .order("data_pagamento", { ascending: false });
      if (error) throw error;
      return data as Pagamento[];
    },
  });

  const totalRecebido = pagamentos.reduce((sum, p) => sum + p.valor, 0);

  const filteredPagamentos = pagamentos.filter(
    (pagamento) =>
      pagamento.faturas?.alunos?.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.metodo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMetodoBadge = (metodo: string) => {
    switch (metodo) {
      case "PIX":
        return <Badge className="bg-green-500 hover:bg-green-600">PIX</Badge>;
      case "Cartão":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Cartão</Badge>;
      default:
        return <Badge variant="outline">Dinheiro</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagamentos</h2>
          <p className="text-muted-foreground mt-1">
            Histórico de pagamentos recebidos
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Pagamentos</CardDescription>
              <CardTitle className="text-2xl">{pagamentos.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Recebido</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRecebido)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription>{filteredPagamentos.length} pagamento(s)</CardDescription>
              </div>
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
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredPagamentos.length === 0 ? (
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPagamentos.map((pagamento) => (
                    <TableRow key={pagamento.id}>
                      <TableCell>{format(new Date(pagamento.data_pagamento), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">{pagamento.faturas?.alunos?.nome_completo}</TableCell>
                      <TableCell>
                        {pagamento.faturas && meses[pagamento.faturas.mes_referencia - 1]}/{pagamento.faturas?.ano_referencia}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pagamento.valor)}
                      </TableCell>
                      <TableCell>{getMetodoBadge(pagamento.metodo)}</TableCell>
                      <TableCell className="text-muted-foreground">{pagamento.referencia || "-"}</TableCell>
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
