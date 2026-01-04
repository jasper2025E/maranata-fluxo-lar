import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RHDashboardCard } from "@/components/rh/RHDashboardCard";
import { useRHStats } from "@/hooks/useRH";
import { formatCurrency } from "@/lib/formatters";
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Wallet,
  CheckCircle,
  Clock,
  UserPlus,
  Briefcase,
  BarChart
} from "lucide-react";
import { FuncionariosTab } from "@/components/rh/FuncionariosTab";
import { CargosTab } from "@/components/rh/CargosTab";
import { PontoTab } from "@/components/rh/PontoTab";
import { PontoRelatorios } from "@/components/rh/PontoRelatorios";
import { FolhaTab } from "@/components/rh/FolhaTab";
import { ContratosTab } from "@/components/rh/ContratosTab";
import { LoadingState } from "@/components/LoadingState";

export default function RH() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats, isLoading } = useRHStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos Humanos</h1>
          <p className="text-muted-foreground">
            Gerencie funcionários, contratos, ponto e folha de pagamento
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="cargos">Cargos e Setores</TabsTrigger>
            <TabsTrigger value="ponto">Ponto</TabsTrigger>
            <TabsTrigger value="relatorios">
              <BarChart className="h-4 w-4 mr-1" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="folha">Folha de Pagamento</TabsTrigger>
            <TabsTrigger value="contratos">Contratos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RHDashboardCard
                title="Total de Funcionários"
                value={stats?.totalFuncionarios || 0}
                subtitle={`${stats?.funcionariosAtivos || 0} ativos`}
                icon={Users}
                color="blue"
                index={0}
              />
              <RHDashboardCard
                title="Professores"
                value={stats?.professores || 0}
                icon={GraduationCap}
                color="purple"
                index={1}
              />
              <RHDashboardCard
                title="Administrativos"
                value={stats?.administrativos || 0}
                icon={Building2}
                color="indigo"
                index={2}
              />
              <RHDashboardCard
                title="Folha Mensal"
                value={formatCurrency(stats?.totalSalarios || 0)}
                subtitle="Total em salários"
                icon={Wallet}
                color="green"
                index={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RHDashboardCard
                title="Folhas Pagas"
                value={stats?.folhasPagas || 0}
                subtitle="Este mês"
                icon={CheckCircle}
                color="green"
                index={4}
              />
              <RHDashboardCard
                title="Folhas Pendentes"
                value={stats?.folhasPendentes || 0}
                subtitle="Este mês"
                icon={Clock}
                color="yellow"
                index={5}
              />
              <RHDashboardCard
                title="Gasto com RH"
                value={formatCurrency(stats?.gastoMesAtual || 0)}
                subtitle="Mês atual"
                icon={Briefcase}
                color="red"
                index={6}
              />
              <RHDashboardCard
                title="Novo Funcionário"
                value="+"
                subtitle="Cadastrar"
                icon={UserPlus}
                color="blue"
                index={7}
              />
            </div>
          </TabsContent>

          <TabsContent value="funcionarios">
            <FuncionariosTab />
          </TabsContent>

          <TabsContent value="cargos">
            <CargosTab />
          </TabsContent>

          <TabsContent value="ponto">
            <PontoTab />
          </TabsContent>

          <TabsContent value="relatorios">
            <PontoRelatorios />
          </TabsContent>

          <TabsContent value="folha">
            <FolhaTab />
          </TabsContent>

          <TabsContent value="contratos">
            <ContratosTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
