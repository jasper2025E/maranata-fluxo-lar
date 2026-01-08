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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEscola } from "@/hooks/useEscola";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Financeiro", url: "/dashboard/financeiro", icon: Wallet },
  { title: "Escola", url: "/escola", icon: Building2, roles: ["admin"] },
  { title: "Responsáveis", url: "/responsaveis", icon: UserCheck },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Turmas", url: "/turmas", icon: GraduationCap },
  { title: "Cursos", url: "/cursos", icon: BookOpen },
  { title: "RH", url: "/rh", icon: Briefcase, roles: ["admin", "staff"] },
];

const financeItems = [
  { title: "Faturas", url: "/faturas", icon: FileText },
  { title: "Pagamentos", url: "/pagamentos", icon: CreditCard },
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const settingsItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings, roles: ["admin"] },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { signOut, hasRole } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Use React Query para cachear os dados da escola
  const { data: escola } = useEscola();
  const escolaNome = escola?.nome || "Maranata";
  const logoUrl = escola?.logo_url;
  const escolaCnpj = escola?.cnpj;
  const escolaEndereco = escola?.endereco;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const filterByRole = (items: typeof menuItems) => {
    return items.filter((item) => {
      if (!item.roles) return true;
      return item.roles.some((role) => hasRole(role as any));
    });
  };

  const renderMenuItem = (item: typeof menuItems[0]) => (
    <SidebarMenuItem key={item.title}>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
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
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      ) : (
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
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
            <span className="text-sm">{item.title}</span>
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
                <p className="text-xs text-muted-foreground">Sistema Financeiro</p>
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
                <p className="text-xs text-sidebar-foreground/50 font-medium">Sistema Financeiro</p>
              </div>
            </>
          )}
        </div>

        {/* Main Menu */}
        <SidebarGroup className="px-3 mt-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filterByRole(menuItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Menu */}
        <SidebarGroup className="px-3 mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Financeiro
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {filterByRole(financeItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Menu */}
        <SidebarGroup className="px-3 mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
              Sistema
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
                  Sair do Sistema
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
                <span className="text-sm">Sair do Sistema</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
