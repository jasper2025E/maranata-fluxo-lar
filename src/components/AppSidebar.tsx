import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Building2,
  UserCheck,
  Wallet,
  Briefcase,
  Activity,
  Crown,
  ChevronDown,
  TrendingUp,
  Calculator,
  PieChart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEscola } from "@/hooks/useEscola";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const menuItems = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titleKey: "nav.financialDashboard", url: "/dashboard/financeiro", icon: Wallet },
  { titleKey: "nav.school", url: "/escola", icon: Building2, roles: ["admin"] },
  { titleKey: "nav.guardians", url: "/responsaveis", icon: UserCheck },
  { titleKey: "nav.students", url: "/alunos", icon: Users },
  { titleKey: "nav.classes", url: "/turmas", icon: GraduationCap },
  { titleKey: "nav.courses", url: "/cursos", icon: BookOpen },
  { titleKey: "nav.hr", url: "/rh", icon: Briefcase, roles: ["admin", "staff"] },
];

// Financial Operations
const operationsItems = [
  { titleKey: "nav.invoices", url: "/faturas", icon: FileText },
  { titleKey: "nav.payments", url: "/pagamentos", icon: CreditCard },
  { titleKey: "nav.expenses", url: "/despesas", icon: Receipt },
];

// Financial Analysis
const analysisItems = [
  { titleKey: "nav.reports", url: "/relatorios", icon: BarChart3 },
  { titleKey: "nav.financialHealth", url: "/saude-financeira", icon: Activity, roles: ["admin"], premium: true },
  { titleKey: "nav.accounting", url: "/contabilidade", icon: BookOpen, roles: ["admin"], premium: true },
];

const settingsItems = [
  { titleKey: "nav.settings", url: "/configuracoes", icon: Settings, roles: ["admin"] },
  { titleKey: "nav.subscription", url: "/assinatura", icon: CreditCard, roles: ["admin"] },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, hasRole, isPlatformAdmin } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { t } = useTranslation();
  
  // Check if any operations route is active
  const operationsRoutes = ["/faturas", "/pagamentos", "/despesas"];
  const isOperationsActive = operationsRoutes.some(route => location.pathname.startsWith(route));
  const [isOperationsOpen, setIsOperationsOpen] = useState(isOperationsActive);
  
  // Check if any analysis route is active
  const analysisRoutes = ["/relatorios", "/saude-financeira", "/contabilidade"];
  const isAnalysisActive = analysisRoutes.some(route => location.pathname.startsWith(route));
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(isAnalysisActive);

  // Use React Query para cachear os dados da escola
  const { data: escola } = useEscola();
  const escolaNome = escola?.nome || "Maranata";
  const logoUrl = escola?.logo_url;
  const escolaCnpj = escola?.cnpj;
  const escolaEndereco = escola?.endereco;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t("success.logout"));
      navigate("/auth");
    } catch (error) {
      toast.error(t("errors.generic"));
    }
  };

  const filterByRole = (items: typeof menuItems) => {
    return items.filter((item) => {
      // Exclude items marked as excludePlatformAdmin for platform admins
      if ((item as any).excludePlatformAdmin && isPlatformAdmin()) return false;
      if (!item.roles) return true;
      return item.roles.some((role) => hasRole(role as any));
    });
  };

  const renderMenuItem = (item: typeof menuItems[0] & { premium?: boolean }) => (
    <SidebarMenuItem key={item.titleKey}>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                end={item.url === "/dashboard"}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5",
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  "transition-all duration-200 ease-out",
                  "hover:scale-110 hover:shadow-lg hover:shadow-sidebar-primary/20",
                  "active:scale-95"
                )}
                activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium shadow-md shadow-sidebar-primary/15"
              >
                <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200" strokeWidth={1.75} />
              </NavLink>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-2">
            {t(item.titleKey)}
            {item.premium && <Crown className="h-3 w-3 text-amber-500" />}
          </TooltipContent>
        </Tooltip>
      ) : (
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/dashboard"}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5",
              "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              "transition-all duration-200 ease-out",
              "hover:scale-[1.02] hover:shadow-lg hover:shadow-sidebar-primary/15 hover:translate-x-1",
              "active:scale-[0.98]"
            )}
            activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium border-l-2 border-sidebar-primary -ml-[2px] shadow-md shadow-sidebar-primary/10"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.75} />
            <span className="text-sm flex-1">{t(item.titleKey)}</span>
            {item.premium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
          </NavLink>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" collapsible="icon">
      <SidebarContent className="gradient-sidebar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-6 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed && "justify-center px-3"
        )}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={escolaNome} 
                    className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-lg cursor-pointer"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-sidebar-primary/20 cursor-pointer">
                    <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>{escolaNome}</p>
                <p className="text-xs text-muted-foreground">{t("nav.financialSystem")}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={escolaNome} 
                  className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-lg"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-sidebar-primary/20">
                  <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              )}
              <div>
                <h2 className="font-bold text-sidebar-foreground text-lg tracking-tight leading-tight">{escolaNome}</h2>
                <p className="text-xs text-sidebar-foreground/50 font-medium">{t("nav.financialSystem")}</p>
              </div>
            </>
          )}
        </div>

        <SidebarGroup className="px-3 mt-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              {t("nav.main")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filterByRole(menuItems).map(renderMenuItem)}
              
              {/* Collapsible Operations */}
              <SidebarMenuItem>
                <Collapsible open={isOperationsOpen} onOpenChange={setIsOperationsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                        "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        "transition-all duration-200 ease-out",
                        isOperationsActive && "text-sidebar-primary font-medium"
                      )}
                    >
                      <Wallet className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm flex-1 text-left">{t("nav.operations")}</span>
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isOperationsOpen && "rotate-180"
                            )} 
                          />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    {!isCollapsed && (
                      <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                        {filterByRole(operationsItems).map((item) => (
                          <SidebarMenuItem key={item.titleKey}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                  "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                  "transition-all duration-150"
                                )}
                                activeClassName="text-sidebar-primary font-medium bg-sidebar-primary/5"
                              >
                                <span className="flex-1">{t(item.titleKey)}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Collapsible Analysis */}
              <SidebarMenuItem>
                <Collapsible open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                        "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                        "transition-all duration-200 ease-out",
                        isAnalysisActive && "text-sidebar-primary font-medium"
                      )}
                    >
                      <BarChart3 className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm flex-1 text-left">{t("nav.analysis")}</span>
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              isAnalysisOpen && "rotate-180"
                            )} 
                          />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    {!isCollapsed && (
                      <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                        {filterByRole(analysisItems).map((item) => {
                          const isPremium = (item as any).premium;
                          return (
                            <SidebarMenuItem key={item.titleKey}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={item.url}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                    "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                    "transition-all duration-150"
                                  )}
                                  activeClassName="text-sidebar-primary font-medium bg-sidebar-primary/5"
                                >
                                  <span className="flex-1">{t(item.titleKey)}</span>
                                  {isPremium && <Crown className="h-3 w-3 text-amber-500" />}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="px-3 mt-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              {t("nav.system")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filterByRole(settingsItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gradient-sidebar border-t border-sidebar-border/50 p-3">
        {/* School Info */}
        {!isCollapsed && (escolaCnpj || escolaEndereco) && (
          <div className="mb-3 px-3 py-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/30">
            <p className="font-semibold text-sm text-sidebar-foreground">{escolaNome}</p>
            {escolaCnpj && (
              <p className="text-xs text-sidebar-primary mt-0.5">CNPJ: {escolaCnpj}</p>
            )}
            {escolaEndereco && (
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">{escolaEndereco}</p>
            )}
          </div>
        )}
        
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className={cn(
                      "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full",
                      "text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10",
                      "transition-all duration-200 ease-out",
                      "hover:scale-110 hover:shadow-lg hover:shadow-red-500/20",
                      "active:scale-95"
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200" strokeWidth={1.75} />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {t("nav.exitSystem")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <SidebarMenuButton
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                  "text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10",
                  "transition-all duration-200 ease-out",
                  "hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/15 hover:translate-x-1",
                  "active:scale-[0.98]"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-200" strokeWidth={1.75} />
                <span className="text-sm">{t("nav.exitSystem")}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
