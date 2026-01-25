import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "react-router-dom";
import { 
  FileText, 
  CreditCard, 
  Receipt, 
  BarChart3, 
  Activity, 
  BookOpen,
  Wallet,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  titleKey: string;
  url: string;
  icon: React.ElementType;
  roles?: string[];
  premium?: boolean;
  excludePlatformAdmin?: boolean;
}

const operationsItems: NavItem[] = [
  { titleKey: "nav.invoices", url: "/faturas", icon: FileText },
  { titleKey: "nav.payments", url: "/pagamentos", icon: CreditCard },
  { titleKey: "nav.expenses", url: "/despesas", icon: Receipt },
];

const analysisItems: NavItem[] = [
  { titleKey: "nav.reports", url: "/relatorios", icon: BarChart3 },
  { titleKey: "nav.accounting", url: "/contabilidade", icon: BookOpen, roles: ["admin", "financeiro"], premium: true },
  { titleKey: "nav.financialHealth", url: "/saude-financeira", icon: Activity, roles: ["admin", "financeiro"], premium: true },
];

const accountItems: NavItem[] = [
  { titleKey: "nav.subscription", url: "/assinatura", icon: Wallet, roles: ["admin"], excludePlatformAdmin: true },
];

interface FinancialLayoutProps {
  children: ReactNode;
}

export function FinancialLayout({ children }: FinancialLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasRole, isPlatformAdmin } = useAuth();

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.excludePlatformAdmin && isPlatformAdmin()) return false;
      if (!item.roles) return true;
      return item.roles.some((role) => hasRole(role as any));
    });
  };

  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + "/");
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.url);

    return (
      <Link
        key={item.url}
        to={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{t(item.titleKey)}</span>
        {item.premium && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-semibold",
                  active 
                    ? "border-primary-foreground/30 text-primary-foreground/80" 
                    : "border-amber-500/50 text-amber-600"
                )}
              >
                PRO
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{t("premium.featureLabel")}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Link>
    );
  };

  const filteredOperations = filterByRole(operationsItems);
  const filteredAnalysis = filterByRole(analysisItems);
  const filteredAccount = filterByRole(accountItems);

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <aside className="w-56 shrink-0 border-r border-border/50 bg-muted/20 hidden lg:block">
          <div className="sticky top-0 p-4 space-y-6">
            {/* Section: Financeiro Header */}
            <div className="px-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("nav.financial")}
              </h2>
            </div>

            {/* Section: Operações */}
            <nav className="space-y-1">
              <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                {t("financial.operations")}
              </p>
              {filteredOperations.map(renderNavItem)}
            </nav>

            {/* Section: Análise */}
            {filteredAnalysis.length > 0 && (
              <nav className="space-y-1">
                <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t("financial.analysis")}
                </p>
                {filteredAnalysis.map(renderNavItem)}
              </nav>
            )}

            {/* Section: Conta */}
            {filteredAccount.length > 0 && (
              <nav className="space-y-1">
                <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t("financial.account")}
                </p>
                {filteredAccount.map(renderNavItem)}
              </nav>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardLayout>
  );
}

export default FinancialLayout;
