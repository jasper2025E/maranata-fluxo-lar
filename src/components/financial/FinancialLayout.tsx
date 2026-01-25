import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Receipt, 
  Wallet, 
  BarChart3, 
  BookOpen, 
  Activity,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";

interface FinancialLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  premium?: boolean;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    titleKey: "financial.sections.operations",
    items: [
      { icon: FileText, labelKey: "nav.invoices", path: "/faturas" },
      { icon: Receipt, labelKey: "nav.payments", path: "/pagamentos" },
      { icon: Wallet, labelKey: "nav.expenses", path: "/despesas" },
    ],
  },
  {
    titleKey: "financial.sections.analysis",
    items: [
      { icon: BarChart3, labelKey: "nav.reports", path: "/relatorios" },
      { icon: Activity, labelKey: "nav.financialHealth", path: "/saude-financeira", premium: true },
      { icon: BookOpen, labelKey: "nav.accounting", path: "/contabilidade", premium: true },
    ],
  },
  {
    titleKey: "financial.sections.subscription",
    items: [
      { icon: CreditCard, labelKey: "nav.subscription", path: "/assinatura" },
    ],
  },
];

export default function FinancialLayout({ children }: FinancialLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const Sidebar = ({ className }: { className?: string }) => (
    <aside className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">{t("financial.title")}</p>
          <p className="text-xs text-muted-foreground">{t("financial.subtitle")}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((section) => (
          <div key={section.titleKey} className="mb-6">
            <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t(section.titleKey)}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{t(item.labelKey)}</span>
                    {item.premium && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 rounded">
                        PRO
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 opacity-0 transition-opacity",
                      active && "opacity-40"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-56 lg:flex-col lg:border-r lg:bg-card/50">
          <Sidebar />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-16 left-0 right-0 z-40 flex items-center gap-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-medium text-sm">{t("financial.title")}</span>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="font-semibold text-sm">{t("financial.title")}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:pt-0 pt-12">
          <div className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
