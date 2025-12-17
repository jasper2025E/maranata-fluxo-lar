import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const Relatorios = () => {
  const { data: faturas = [] } = useQuery({
    queryKey: ["faturas-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo)");
      if (error) throw error;
      return data;
    },
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pagamentos").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: alunos = [] } = useQuery({
    queryKey: ["alunos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alunos").select("*").eq("status_matricula", "ativo");
      if (error) throw error;
      return data;
    },
  });

  // Calcular dados mensais
  const currentYear = new Date().getFullYear();
  const monthlyData = meses.map((mes, index) => {
    const mesNum = index + 1;
    const entradas = pagamentos
      .filter((p) => {
        const date = new Date(p.data_pagamento);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + Number(p.valor), 0);

    const saidas = despesas
      .filter((d) => {
        const date = new Date(d.data_vencimento);
        return date.getMonth() === index && date.getFullYear() === currentYear && d.paga;
      })
      .reduce((sum, d) => sum + Number(d.valor), 0);

    return { mes, entradas, saidas, saldo: entradas - saidas };
  });

  // Faturas vencidas (inadimplência)
  const faturasVencidas = faturas.filter((f) => f.status === "Vencida");
  const alunosInadimplentes = [...new Set(faturasVencidas.map((f) => f.aluno_id))];
  const taxaInadimplencia = alunos.length > 0 ? (alunosInadimplentes.length / alunos.length) * 100 : 0;

  // Totais
  const totalEntradas = pagamentos.reduce((sum, p) => sum + Number(p.valor), 0);
  const totalSaidas = despesas.filter((d) => d.paga).reduce((sum, d) => sum + Number(d.valor), 0);
  const saldoAcumulado = totalEntradas - totalSaidas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground mt-1">
            Visualize relatórios financeiros e gerenciais
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Entradas</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalEntradas)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Saídas</CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalSaidas)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saldo Acumulado</CardDescription>
              <CardTitle className={`text-2xl ${saldoAcumulado >= 0 ? "text-green-600" : "text-destructive"}`}>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(saldoAcumulado)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de Inadimplência</CardDescription>
              <CardTitle className="text-2xl">
                {taxaInadimplencia.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entradas x Saídas por Mês ({currentYear})</CardTitle>
            <CardDescription>Evolução financeira mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("pt-BR", { notation: "compact", currency: "BRL" }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) =>
                      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                    }
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório de Inadimplência</CardTitle>
            <CardDescription>
              {faturasVencidas.length} fatura(s) vencida(s) de {alunosInadimplentes.length} aluno(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {faturasVencidas.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma fatura vencida</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturasVencidas.slice(0, 10).map((fatura) => (
                    <TableRow key={fatura.id}>
                      <TableCell className="font-medium">{fatura.alunos?.nome_completo}</TableCell>
                      <TableCell>
                        {meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(fatura.valor)}
                      </TableCell>
                      <TableCell>{new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Vencida</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
              <CardDescription>Distribuição das entradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Mensalidades</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalEntradas)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Distribuição das saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["fixa", "variavel", "unica"].map((cat) => {
                  const total = despesas
                    .filter((d) => d.categoria === cat && d.paga)
                    .reduce((sum, d) => sum + Number(d.valor), 0);
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="capitalize">{cat === "unica" ? "Única" : cat === "variavel" ? "Variável" : "Fixa"}</span>
                      <span className="font-bold">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;
