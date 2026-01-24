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
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
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

interface MenuItem {
  titleKey: string;
  url: string;
  icon: LucideIcon;
  roles?: string[];
  excludePlatformAdmin?: boolean;
  iconColor?: string;
  iconBg?: string;
}

const menuItems: MenuItem[] = [
  { titleKey: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard, iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
  { titleKey: "nav.school", url: "/escola", icon: Building2, roles: ["admin"], iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
  { titleKey: "nav.guardians", url: "/responsaveis", icon: UserCheck, iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
  { titleKey: "nav.students", url: "/alunos", icon: Users, iconColor: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-900/40" },
  { titleKey: "nav.classes", url: "/turmas", icon: GraduationCap, iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
  { titleKey: "nav.courses", url: "/cursos", icon: BookOpen, iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
  { titleKey: "nav.hr", url: "/rh", icon: Briefcase, roles: ["admin", "staff"], iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
];

const financeItems: MenuItem[] = [
  { titleKey: "nav.invoices", url: "/faturas", icon: FileText, iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
  { titleKey: "nav.payments", url: "/pagamentos", icon: CreditCard, iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
  { titleKey: "nav.expenses", url: "/despesas", icon: Receipt, iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
  { titleKey: "nav.reports", url: "/relatorios", icon: BarChart3, iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
  { titleKey: "nav.subscription", url: "/assinatura", icon: Wallet, roles: ["admin"], excludePlatformAdmin: true, iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
];

const settingsItems: MenuItem[] = [
  { titleKey: "nav.settings", url: "/configuracoes", icon: Settings, roles: ["admin"], iconColor: "text-slate-600 dark:text-slate-400", iconBg: "bg-slate-100 dark:bg-slate-800/60" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut, hasRole, isPlatformAdmin } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { t } = useTranslation();
  
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

  const renderMenuItem = (item: MenuItem) => {
    const IconComponent = item.icon;
    
    return (
      <SidebarMenuItem key={item.titleKey}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className={cn(
                    "flex items-center justify-center rounded-xl p-2",
                    "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                    "transition-all duration-200 ease-out",
                    "hover:scale-110",
                    "active:scale-95"
                  )}
                  activeClassName="text-sidebar-primary"
                >
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    item.iconBg
                  )}>
                    <IconComponent className={cn("h-[18px] w-[18px] shrink-0", item.iconColor)} strokeWidth={1.75} />
                  </div>
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
                "group flex items-center gap-3 rounded-xl px-2 py-2",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                "transition-all duration-200 ease-out",
                "active:scale-[0.98]"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
            >
              <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
                "group-hover:scale-105",
                item.iconBg
              )}>
                <IconComponent className={cn("h-[18px] w-[18px] shrink-0", item.iconColor)} strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium">{t(item.titleKey)}</span>
            </NavLink>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    );
  };

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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-3 mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              {t("nav.finance")}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filterByRole(financeItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-3 mt-6">
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
                      "flex items-center justify-center rounded-xl p-2 w-full",
                      "text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10",
                      "transition-all duration-200 ease-out",
                      "hover:scale-110",
                      "active:scale-95"
                    )}
                  >
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-destructive/10">
                      <LogOut className="h-[18px] w-[18px] shrink-0 text-destructive" strokeWidth={1.75} />
                    </div>
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
                  "group flex items-center gap-3 rounded-xl px-2 py-2 w-full",
                  "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/5",
                  "transition-all duration-200 ease-out",
                  "active:scale-[0.98]"
                )}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-destructive/10 transition-all duration-200 group-hover:scale-105">
                  <LogOut className="h-[18px] w-[18px] shrink-0 text-destructive" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-medium">{t("nav.exitSystem")}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
