import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { FinancialKPICard } from "@/components/dashboard";
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
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
// PremiumGate removido - sistema single-tenant

export default function RH() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { data: stats, isLoading } = useRHStats();

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
            {/* Main KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialKPICard
                title={t("hr.totalEmployees")}
                value={stats?.totalFuncionarios || 0}
                subtitle={`${stats?.funcionariosAtivos || 0} ${t("hr.active")}`}
                icon={Users}
                variant="info"
                index={0}
              />
              <FinancialKPICard
                title={t("hr.teachers")}
                value={stats?.professores || 0}
                subtitle={t("hr.inTeam")}
                icon={GraduationCap}
                variant="premium"
                index={1}
              />
              <FinancialKPICard
                title={t("hr.administrative")}
                value={stats?.administrativos || 0}
                subtitle={t("hr.inTeam")}
                icon={Building2}
                variant="default"
                index={2}
              />
              <FinancialKPICard
                title={t("hr.monthlyPayroll")}
                value={formatCurrency(stats?.totalSalarios || 0)}
                subtitle={t("hr.totalSalaries")}
                icon={Wallet}
                variant="success"
                index={3}
              />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialKPICard
                title={t("hr.paidPayrolls")}
                value={stats?.folhasPagas || 0}
                subtitle={t("hr.thisMonth")}
                icon={CheckCircle}
                variant="success"
                size="sm"
                index={4}
              />
              <FinancialKPICard
                title={t("hr.pendingPayrolls")}
                value={stats?.folhasPendentes || 0}
                subtitle={t("hr.thisMonth")}
                icon={Clock}
                variant="warning"
                size="sm"
                index={5}
              />
              <FinancialKPICard
                title={t("hr.hrExpenses")}
                value={formatCurrency(stats?.gastoMesAtual || 0)}
                subtitle={t("hr.currentMonth")}
                icon={Briefcase}
                variant="danger"
                size="sm"
                index={6}
              />
              
              {/* Action Card - Novo Funcionário */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 7 * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  y: -4,
                  scale: 1.01,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                onClick={() => navigate("/rh?tab=funcionarios")}
                className={cn(
                  "group relative overflow-hidden cursor-pointer",
                  "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                  "backdrop-blur-sm rounded-2xl p-4",
                  "border-2 border-dashed border-primary/30 hover:border-primary/50",
                  "transition-all duration-300 ease-out",
                  "hover:shadow-xl hover:shadow-primary/10"
                )}
              >
                {/* Subtle Pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }}
                />
                
                <div className="relative flex flex-col items-center justify-center text-center gap-3 py-2">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center"
                  >
                    <UserPlus className="h-6 w-6 text-primary" strokeWidth={1.75} />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("hr.newEmployee")}</p>
                    <p className="text-xs text-muted-foreground">{t("hr.register")}</p>
                  </div>
                </div>
              </motion.div>
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
        return (
          <div className="space-y-6">
            {/* Main KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialKPICard
                title={t("hr.totalEmployees")}
                value={stats?.totalFuncionarios || 0}
                subtitle={`${stats?.funcionariosAtivos || 0} ${t("hr.active")}`}
                icon={Users}
                variant="info"
                index={0}
              />
              <FinancialKPICard
                title={t("hr.teachers")}
                value={stats?.professores || 0}
                subtitle={t("hr.inTeam")}
                icon={GraduationCap}
                variant="premium"
                index={1}
              />
              <FinancialKPICard
                title={t("hr.administrative")}
                value={stats?.administrativos || 0}
                subtitle={t("hr.inTeam")}
                icon={Building2}
                variant="default"
                index={2}
              />
              <FinancialKPICard
                title={t("hr.monthlyPayroll")}
                value={formatCurrency(stats?.totalSalarios || 0)}
                subtitle={t("hr.totalSalaries")}
                icon={Wallet}
                variant="success"
                index={3}
              />
            </div>
          </div>
        );
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

          {/* Content Area - Full Width */}
          <div className="min-w-0">
            {renderContent()}
          </div>
        </div>
    </DashboardLayout>
  );
}
