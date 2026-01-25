import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  BookOpen,
  Activity,
  Wallet,
  Crown,
  ChevronDown,
  Calculator,
  Package,
  Target,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  titleKey: string;
  url: string;
  icon: React.ElementType;
  roles?: string[];
  premium?: boolean;
  excludePlatformAdmin?: boolean;
  subItems?: { titleKey: string; tab: string; icon: React.ElementType }[];
}

const financialNavItems: NavItem[] = [
  { titleKey: "nav.invoices", url: "/faturas", icon: FileText },
  { titleKey: "nav.payments", url: "/pagamentos", icon: CreditCard },
  { titleKey: "nav.expenses", url: "/despesas", icon: Receipt },
  { titleKey: "nav.reports", url: "/relatorios", icon: BarChart3 },
  { 
    titleKey: "nav.accounting", 
    url: "/contabilidade", 
    icon: BookOpen, 
    roles: ["admin", "financeiro"], 
    premium: true,
    subItems: [
      { titleKey: "accounting.tabs.overview", tab: "overview", icon: BarChart3 },
      { titleKey: "accounting.tabs.entries", tab: "lancamentos", icon: Receipt },
      { titleKey: "accounting.tabs.dre", tab: "dre", icon: FileText },
      { titleKey: "accounting.tabs.assets", tab: "patrimonio", icon: Package },
      { titleKey: "accounting.tabs.taxes", tab: "impostos", icon: Calculator },
    ]
  },
  { 
    titleKey: "nav.financialHealth", 
    url: "/saude-financeira", 
    icon: Activity, 
    roles: ["admin", "financeiro"], 
    premium: true,
    subItems: [
      { titleKey: "financialHealth.tabs.overview", tab: "overview", icon: Activity },
      { titleKey: "financialHealth.tabs.scenarios", tab: "scenarios", icon: Target },
      { titleKey: "financialHealth.tabs.alerts", tab: "alerts", icon: AlertCircle },
      { titleKey: "financialHealth.tabs.recommendations", tab: "recommendations", icon: Lightbulb },
    ]
  },
  { titleKey: "nav.subscription", url: "/assinatura", icon: Wallet, roles: ["admin"], excludePlatformAdmin: true },
];

export function FinancialSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasRole, isPlatformAdmin } = useAuth();
  const { currentPlan } = usePremiumFeatures();

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.excludePlatformAdmin && isPlatformAdmin()) return false;
      if (!item.roles) return true;
      return item.roles.some((role) => hasRole(role as any));
    });
  };

  const isActive = (url: string) => location.pathname === url;
  const currentTab = searchParams.get("tab");

  const filteredItems = filterByRole(financialNavItems);

  return (
    <aside className="w-56 shrink-0 border-r bg-muted/30 hidden lg:block">
      <div className="sticky top-0 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-3">
          {t("nav.finance")}
        </p>
        
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.url);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            if (hasSubItems) {
              return (
                <Collapsible key={item.url} defaultOpen={active}>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        active
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{t(item.titleKey)}</span>
                      {item.premium && currentPlan !== "enterprise" && (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 mt-1 space-y-0.5">
                    {item.subItems?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = active && currentTab === subItem.tab;
                      
                      return (
                        <button
                          key={subItem.tab}
                          onClick={() => navigate(`${item.url}?tab=${subItem.tab}`)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-200",
                            isSubActive
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>{t(subItem.titleKey)}</span>
                        </button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
            
            return (
              <button
                key={item.url}
                onClick={() => navigate(item.url)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{t(item.titleKey)}</span>
                {item.premium && currentPlan !== "enterprise" && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
