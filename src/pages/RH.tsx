import { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { RHDashboardCard } from "@/components/rh/RHDashboardCard";
import { useRHStats } from "@/hooks/useRH";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Wallet,
  CheckCircle,
  Clock,
  UserPlus,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { FuncionariosTab } from "@/components/rh/FuncionariosTab";
import { CargosTab } from "@/components/rh/CargosTab";
import { PontoTab } from "@/components/rh/PontoTab";
import { PontoRelatorios } from "@/components/rh/PontoRelatorios";
import { PontosAutorizadosManager } from "@/components/rh/PontosAutorizadosManager";
import { FolhaTab } from "@/components/rh/FolhaTab";
import { ContratosTab } from "@/components/rh/ContratosTab";
import { LoadingState } from "@/components/LoadingState";

interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function RH() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: stats, isLoading } = useRHStats();

  const navItems: NavItem[] = [
    { id: "dashboard", label: t("hr.dashboard") },
    { id: "funcionarios", label: t("hr.employees") },
    { id: "cargos", label: t("hr.positions") },
    { id: "ponto", label: t("hr.timeTracking") },
    { id: "locais", label: t("hr.locations") },
    { id: "relatorios", label: t("hr.reports") },
    { id: "folha", label: t("hr.payroll") },
    { id: "contratos", label: t("hr.contracts") },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState />
      </DashboardLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={() => setActiveTab("funcionarios")}
              />
            </div>
          </div>
        );
      case "funcionarios":
        return <FuncionariosTab />;
      case "cargos":
        return <CargosTab />;
      case "ponto":
        return <PontoTab />;
      case "locais":
        return <PontosAutorizadosManager />;
      case "relatorios":
        return <PontoRelatorios />;
      case "folha":
        return <FolhaTab />;
      case "contratos":
        return <ContratosTab />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("nav.management")}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("hr.title")}</span>
        </nav>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="md:w-48 shrink-0">
            <ul className="space-y-0.5">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === item.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
