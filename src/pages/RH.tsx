import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  BarChart,
  MapPinned
} from "lucide-react";
import { FuncionariosTab } from "@/components/rh/FuncionariosTab";
import { CargosTab } from "@/components/rh/CargosTab";
import { PontoTab } from "@/components/rh/PontoTab";
import { PontoRelatorios } from "@/components/rh/PontoRelatorios";
import { PontosAutorizadosManager } from "@/components/rh/PontosAutorizadosManager";
import { FolhaTab } from "@/components/rh/FolhaTab";
import { ContratosTab } from "@/components/rh/ContratosTab";
import { LoadingState } from "@/components/LoadingState";

export default function RH() {
  const { t } = useTranslation();
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
          <h1 className="text-3xl font-bold tracking-tight">{t("hr.title")}</h1>
          <p className="text-muted-foreground">
            {t("hr.description")}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap">
            <TabsTrigger value="dashboard">{t("hr.dashboard")}</TabsTrigger>
            <TabsTrigger value="funcionarios">{t("hr.employees")}</TabsTrigger>
            <TabsTrigger value="cargos">{t("hr.positions")}</TabsTrigger>
            <TabsTrigger value="ponto">{t("hr.timeTracking")}</TabsTrigger>
            <TabsTrigger value="locais">
              <MapPinned className="h-4 w-4 mr-1" />
              {t("hr.locations")}
            </TabsTrigger>
            <TabsTrigger value="relatorios">
              <BarChart className="h-4 w-4 mr-1" />
              {t("hr.reports")}
            </TabsTrigger>
            <TabsTrigger value="folha">{t("hr.payroll")}</TabsTrigger>
            <TabsTrigger value="contratos">{t("hr.contracts")}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RHDashboardCard
                title={t("hr.totalEmployees")}
                value={stats?.totalFuncionarios || 0}
                subtitle={`${stats?.funcionariosAtivos || 0} ${t("hr.active")}`}
                icon={Users}
                color="blue"
                index={0}
              />
              <RHDashboardCard
                title={t("hr.teachers")}
                value={stats?.professores || 0}
                icon={GraduationCap}
                color="purple"
                index={1}
              />
              <RHDashboardCard
                title={t("hr.administrative")}
                value={stats?.administrativos || 0}
                icon={Building2}
                color="indigo"
                index={2}
              />
              <RHDashboardCard
                title={t("hr.monthlyPayroll")}
                value={formatCurrency(stats?.totalSalarios || 0)}
                subtitle={t("hr.totalSalaries")}
                icon={Wallet}
                color="green"
                index={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <RHDashboardCard
                title={t("hr.paidPayrolls")}
                value={stats?.folhasPagas || 0}
                subtitle={t("hr.thisMonth")}
                icon={CheckCircle}
                color="green"
                index={4}
              />
              <RHDashboardCard
                title={t("hr.pendingPayrolls")}
                value={stats?.folhasPendentes || 0}
                subtitle={t("hr.thisMonth")}
                icon={Clock}
                color="yellow"
                index={5}
              />
              <RHDashboardCard
                title={t("hr.hrExpenses")}
                value={formatCurrency(stats?.gastoMesAtual || 0)}
                subtitle={t("hr.currentMonth")}
                icon={Briefcase}
                color="red"
                index={6}
              />
              <RHDashboardCard
                title={t("hr.newEmployee")}
                value="+"
                subtitle={t("hr.register")}
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

          <TabsContent value="locais">
            <PontosAutorizadosManager />
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
