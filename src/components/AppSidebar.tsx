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
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";

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
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
            "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
          )}
          activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>{item.title}</span>}
          {!isCollapsed && (
            <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-50" />
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5",
          isCollapsed && "justify-center px-2"
        )}>
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Maranata</h2>
              <p className="text-xs text-sidebar-foreground/60">Financeiro</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border mx-3 w-auto" />

        {/* Main Menu */}
        <SidebarGroup className="px-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filterByRole(menuItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance Menu */}
        <SidebarGroup className="px-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3">
              Financeiro
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filterByRole(financeItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Menu */}
        <SidebarGroup className="px-2">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs font-medium uppercase tracking-wider px-3">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filterByRole(settingsItems).map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 w-full",
                "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
