import { useState } from "react";
import doodlePatternBg from "@/assets/doodle-pattern-bg.png";
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
  ChevronDown,
  Globe,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEscola } from "@/hooks/useEscola";
import { useTranslation } from "react-i18next";
import { SidebarColorPicker } from "@/components/sidebar/SidebarColorPicker";
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
];

// Cadastros Sub-items
const cadastrosItems = [
  { titleKey: "nav.students", url: "/alunos", icon: Users },
  { titleKey: "nav.guardians", url: "/responsaveis", icon: UserCheck },
  { titleKey: "nav.courses", url: "/cursos", icon: BookOpen },
  { titleKey: "nav.classes", url: "/turmas", icon: GraduationCap },
];

// Escola Sub-items
const escolaItems = [
  { titleKey: "nav.escola.dados", url: "/escola", tab: "dados" },
];

// HR Sub-items
const hrItems = [
  { titleKey: "nav.hrDashboard", url: "/rh", tab: "dashboard" },
  { titleKey: "nav.hrEmployees", url: "/rh?tab=funcionarios", tab: "funcionarios" },
  { titleKey: "nav.hrPositions", url: "/rh?tab=cargos", tab: "cargos" },
  { titleKey: "nav.hrTimeTracking", url: "/rh?tab=ponto", tab: "ponto" },
  { titleKey: "nav.hrLocations", url: "/rh?tab=locais", tab: "locais" },
  { titleKey: "nav.hrReports", url: "/rh?tab=relatorios", tab: "relatorios" },
  { titleKey: "nav.hrPayroll", url: "/rh?tab=folha", tab: "folha" },
  { titleKey: "nav.hrContracts", url: "/rh?tab=contratos", tab: "contratos" },
];

// Financial Operations
const operationsItems = [
  { titleKey: "nav.invoices", url: "/faturas", icon: FileText },
  { titleKey: "nav.expenses", url: "/despesas", icon: Receipt },
];

// Financial Analysis
const analysisItems = [
  { titleKey: "nav.financialDashboard", url: "/dashboard/financeiro", icon: Wallet },
  { titleKey: "nav.reports", url: "/relatorios", icon: BarChart3 },
  { titleKey: "nav.financialHealth", url: "/saude-financeira", icon: Activity, roles: ["admin"] },
  { titleKey: "nav.accounting", url: "/contabilidade", icon: BookOpen, roles: ["admin"] },
];

// System Sub-items
const configItems = [
  { titleKey: "nav.config.profile", url: "/configuracoes", tab: "perfil" },
  { titleKey: "nav.config.security", url: "/configuracoes?tab=seguranca", tab: "seguranca" },
  { titleKey: "nav.config.preferences", url: "/configuracoes?tab=preferencias", tab: "preferencias" },
  { titleKey: "nav.config.billing", url: "/configuracoes?tab=cobranca", tab: "cobranca", adminOnly: true },
  { titleKey: "nav.config.users", url: "/configuracoes?tab=usuarios", tab: "usuarios", adminOnly: true },
  { titleKey: "nav.config.gateways", url: "/configuracoes?tab=gateways", tab: "gateways", adminOnly: true },
  { titleKey: "nav.config.system", url: "/configuracoes?tab=sistema", tab: "sistema", adminOnly: true },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, hasRole } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { t } = useTranslation();
  
  // Check if any cadastros route is active
  const cadastrosRoutes = ["/alunos", "/responsaveis", "/cursos", "/turmas"];
  const isCadastrosActive = cadastrosRoutes.some(route => location.pathname.startsWith(route));
  const [isCadastrosOpen, setIsCadastrosOpen] = useState(isCadastrosActive);
  
  // Check if any operations route is active
  const operationsRoutes = ["/faturas", "/despesas"];
  const isOperationsActive = operationsRoutes.some(route => location.pathname.startsWith(route));
  const [isOperationsOpen, setIsOperationsOpen] = useState(isOperationsActive);
  
  // Check if any analysis route is active
  const analysisRoutes = ["/dashboard/financeiro", "/relatorios", "/saude-financeira", "/contabilidade"];
  const isAnalysisActive = analysisRoutes.some(route => location.pathname.startsWith(route));
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(isAnalysisActive);
  
  // Check if HR route is active
  const isHRActive = location.pathname.startsWith("/rh");
  const [isHROpen, setIsHROpen] = useState(isHRActive);
  const rhTab = new URLSearchParams(location.search).get("tab") || "dashboard";
  
  // Check if Config route is active
  const configRoutes = ["/configuracoes"];
  const isConfigActive = configRoutes.some(route => location.pathname.startsWith(route));
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigActive);
  const configTab = new URLSearchParams(location.search).get("tab") || "perfil";
  
  // Check if Escola route is active
  const isEscolaActive = location.pathname.startsWith("/escola");
  const [isEscolaOpen, setIsEscolaOpen] = useState(isEscolaActive);
  const escolaTab = "dados";

  // Use React Query para cachear os dados da escola
  const { data: escola } = useEscola();
  const escolaNome = escola?.nome || "Escola Maranata";
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

  const filterByRole = (items: Array<{ titleKey: string; url: string; icon?: any; roles?: string[] }>) => {
    return items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => hasRole(role as any));
    });
  };

  const renderMenuItem = (item: typeof menuItems[0]) => (
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
                  "transition-colors duration-150"
                )}
                activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium"
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              </NavLink>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {t(item.titleKey)}
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
              "transition-colors duration-150"
            )}
            activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium border-l-2 border-sidebar-primary -ml-[2px]"
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span className="text-sm flex-1">{t(item.titleKey)}</span>
          </NavLink>
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );

  // Logo component
  const LogoContent = logoUrl ? (
    <img 
      src={logoUrl} 
      alt={escolaNome} 
      className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-lg"
      loading="eager"
    />
  ) : (
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-sidebar-primary/20">
      <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
    </div>
  );

  return (
    <Sidebar className="border-r-0 [&_[data-sidebar=sidebar]]:relative [&_[data-sidebar=sidebar]]:overflow-hidden" collapsible="icon">
      {/* Doodle pattern overlay on top of default sidebar background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${doodlePatternBg})`,
          backgroundSize: "400px",
          backgroundRepeat: "repeat",
          opacity: 0.08,
        }}
      />
      
      <SidebarContent className="relative z-10">
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-6",
          isCollapsed && "justify-center px-3"
        )}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  {LogoContent}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>{escolaNome}</p>
                <p className="text-xs text-muted-foreground">{t("nav.financialSystem")}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              {LogoContent}
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

              {/* Collapsible Cadastros */}
              <SidebarMenuItem>
                <Collapsible open={isCadastrosOpen} onOpenChange={setIsCadastrosOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild tooltip={t("nav.registrations")}>
                      <button
                        type="button"
                        className={cn(
                          isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "transition-colors duration-150",
                          isCadastrosActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                          !isCollapsed && isCadastrosActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                        )}
                      >
                        <Users className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
                        {!isCollapsed && (
                          <>
                            <span className="text-sm flex-1 text-left">{t("nav.registrations")}</span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isCadastrosOpen && "rotate-180"
                              )}
                            />
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    {!isCollapsed && (
                      <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                        {filterByRole(cadastrosItems).map((item) => (
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

              {/* Collapsible Operations - after Cadastros */}
              <SidebarMenuItem>
                <Collapsible open={isOperationsOpen} onOpenChange={setIsOperationsOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild tooltip={t("nav.operations")}>
                      <button
                        type="button"
                        className={cn(
                          isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "transition-colors duration-150",
                          isOperationsActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                          !isCollapsed && isOperationsActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                        )}
                      >
                        <Wallet className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
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
                      </button>
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
                    <SidebarMenuButton asChild tooltip={t("nav.analysis")}>
                      <button
                        type="button"
                        className={cn(
                          isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                          "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "transition-colors duration-150",
                          isAnalysisActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                          !isCollapsed && isAnalysisActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                        )}
                      >
                        <BarChart3 className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
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
                      </button>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    {!isCollapsed && (
                      <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                        {filterByRole(analysisItems).map((item) => {
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
                                  <span>{t(item.titleKey)}</span>
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

              {/* Collapsible Escola */}
              {hasRole("admin") && (
                <SidebarMenuItem>
                  <Collapsible open={isEscolaOpen} onOpenChange={setIsEscolaOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={t("nav.school")}>
                        <button
                          type="button"
                          className={cn(
                            isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                            "transition-colors duration-150",
                            isEscolaActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                            !isCollapsed && isEscolaActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                          )}
                        >
                          <Building2 className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
                          {!isCollapsed && (
                            <>
                              <span className="text-sm flex-1 text-left">{t("nav.school")}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isEscolaOpen && "rotate-180"
                                )}
                              />
                            </>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      {!isCollapsed && (
                        <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                          {escolaItems.map((item) => {
                            const isTabActive = isEscolaActive && escolaTab === item.tab;
                            return (
                              <SidebarMenuItem key={item.titleKey}>
                                <SidebarMenuButton asChild>
                                  <NavLink
                                    to={item.url}
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                      isTabActive
                                        ? "text-sidebar-primary font-medium bg-sidebar-primary/5"
                                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                      "transition-all duration-150"
                                    )}
                                    activeClassName=""
                                  >
                                    <span className="flex-1">{t(item.titleKey)}</span>
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
              )}

              {/* Collapsible HR - after Escola */}
              {(hasRole("admin") || hasRole("staff")) && (
                <SidebarMenuItem>
                  <Collapsible open={isHROpen} onOpenChange={setIsHROpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={t("nav.hr")}>
                        <button
                          type="button"
                          className={cn(
                            isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                            "transition-colors duration-150",
                            isHRActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                            !isCollapsed && isHRActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                          )}
                        >
                          <Briefcase className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
                          {!isCollapsed && (
                            <>
                              <span className="text-sm flex-1 text-left">{t("nav.hr")}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isHROpen && "rotate-180"
                                )}
                              />
                            </>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      {!isCollapsed && (
                        <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                          {hrItems.map((item) => {
                            const isTabActive = isHRActive && rhTab === item.tab;
                            return (
                            <SidebarMenuItem key={item.titleKey}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={item.url}
                                  className={cn(
                                    "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                    isTabActive
                                      ? "text-sidebar-primary font-medium bg-sidebar-primary/5"
                                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                    "transition-all duration-150"
                                  )}
                                  activeClassName=""
                                >
                                  <span className="flex-1">{t(item.titleKey)}</span>
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
              )}

              {/* Collapsible Configurações */}
              {hasRole("admin") && (
                <SidebarMenuItem>
                  <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild tooltip={t("nav.system")}>
                        <button
                          type="button"
                          className={cn(
                            isCollapsed ? "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full" : "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full",
                            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                            "transition-colors duration-150",
                            isConfigActive && "bg-sidebar-primary/10 text-sidebar-primary font-medium",
                            !isCollapsed && isConfigActive && "border-l-2 border-sidebar-primary -ml-[2px]",
                          )}
                        >
                          <Settings className={cn(isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]", "shrink-0")} strokeWidth={1.75} />
                          {!isCollapsed && (
                            <>
                              <span className="text-sm flex-1 text-left">{t("nav.system")}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isConfigOpen && "rotate-180"
                                )}
                              />
                            </>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                      {!isCollapsed && (
                        <SidebarMenu className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                          {configItems
                            .filter(item => {
                              if (item.adminOnly) return hasRole("admin");
                              return true;
                            })
                            .map((item) => {
                              const isTabActive = item.tab 
                                ? (location.pathname === "/configuracoes" && configTab === item.tab)
                                : false;
                              return (
                                <SidebarMenuItem key={item.titleKey}>
                                  <SidebarMenuButton asChild>
                                    <NavLink
                                      to={item.url}
                                      className={cn(
                                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
                                        "transition-all duration-150",
                                        isTabActive 
                                          ? "text-sidebar-primary font-medium bg-sidebar-primary/5" 
                                          : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                      )}
                                      activeClassName=""
                                    >
                                      <span className="flex-1">{t(item.titleKey)}</span>
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
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative z-10 border-t border-sidebar-border/50 p-3">
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
        
        <SidebarMenu className="space-y-1">

          {/* Logout */}
          <SidebarMenuItem>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className={cn(
                      "flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 w-full",
                      "text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10",
                      "transition-colors duration-150"
                    )}
                  >
                    <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
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
                  "text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10",
                  "transition-colors duration-150"
                )}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                <span className="text-sm">{t("nav.exitSystem")}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
