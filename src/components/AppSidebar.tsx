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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Escola", url: "/escola", icon: Building2, roles: ["admin"] },
  { title: "Responsáveis", url: "/responsaveis", icon: UserCheck },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Turmas", url: "/turmas", icon: GraduationCap },
  { title: "Cursos", url: "/cursos", icon: BookOpen },
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
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
            "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          )}
          activeClassName="bg-sidebar-primary/10 text-sidebar-primary font-medium border-l-2 border-sidebar-primary -ml-[2px]"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          {!isCollapsed && <span className="text-sm">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarContent className="gradient-sidebar">
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-6",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-sidebar-primary/20">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground text-lg tracking-tight">Maranata</h2>
              <p className="text-xs text-sidebar-foreground/50 font-medium">Sistema Financeiro</p>
            </div>
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 w-full",
                "text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!isCollapsed && <span className="text-sm">Sair do Sistema</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
