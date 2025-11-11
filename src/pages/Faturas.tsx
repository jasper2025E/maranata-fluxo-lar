import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Faturas = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faturas</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as faturas dos alunos
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lista de Faturas</CardTitle>
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

export default Faturas;
