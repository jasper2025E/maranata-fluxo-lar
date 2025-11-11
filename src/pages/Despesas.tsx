import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Despesas = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
          <p className="text-muted-foreground mt-1">
            Controle as despesas da escola
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Despesas</CardTitle>
            <CardDescription>Em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Página em construção</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Despesas;
