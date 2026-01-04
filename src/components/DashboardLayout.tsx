import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    staff: "Funcionário",
    financeiro: "Financeiro",
    secretaria: "Secretaria",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary",
    staff: "bg-info",
    financeiro: "bg-success",
    secretaria: "bg-warning",
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Premium Header */}
          <header className="h-16 border-b border-border/50 bg-card/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              {/* Search Bar */}
              <div className="hidden md:flex relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alunos, faturas..."
                  className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted">
                <Bell className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse-subtle" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 px-3 h-10 rounded-xl hover:bg-muted">
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      <AvatarFallback className={`${roleColors[role || 'staff']} text-white text-xs font-semibold`}>
                        {user?.email ? getInitials(user.email) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {user?.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role ? roleLabels[role] : "Usuário"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-large">
                  <DropdownMenuLabel className="py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {role ? roleLabels[role] : "Usuário"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="py-2.5 cursor-pointer">
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="py-2.5 text-destructive cursor-pointer focus:text-destructive">
                    Sair do Sistema
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
