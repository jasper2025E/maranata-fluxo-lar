import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  LogOut,
  Activity,
  Users,
  UserCog,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  BarChart3,
  FileText,
  MoreHorizontal,
  FolderOpen,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlatformLayoutProps {
  children: ReactNode;
}

interface NavSubItem {
  label: string;
  path: string;
}

interface NavModule {
  icon: React.ElementType;
  label: string;
  path?: string;
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  modules: NavModule[];
}

const navigation: NavSection[] = [
  {
    title: "Produtos",
    modules: [
      { 
        icon: CreditCard, 
        label: "Assinaturas", 
        subItems: [
          { label: "Visão geral", path: "/platform/subscriptions" },
          { label: "Planos", path: "/platform/plans" },
          { label: "Histórico", path: "/platform/subscriptions" },
        ]
      },
      { 
        icon: Building2, 
        label: "Escolas", 
        subItems: [
          { label: "Todas as escolas", path: "/platform/tenants" },
          { label: "Adicionar escola", path: "/platform/tenants/new" },
        ]
      },
      { 
        icon: Users, 
        label: "Usuários", 
        subItems: [
          { label: "Todos os usuários", path: "/platform/users" },
          { label: "Acessar como", path: "/platform/impersonate" },
        ]
      },
      { 
        icon: Activity, 
        label: "Monitoramento", 
        path: "/platform/monitoring"
      },
      { 
        icon: BarChart3, 
        label: "Analytics", 
        path: "/platform/analytics"
      },
      { 
        icon: MoreHorizontal, 
        label: "Mais", 
        subItems: [
          { label: "Módulos", path: "/platform/modules" },
          { label: "Logs", path: "/platform/logs" },
          { label: "Configurações", path: "/platform/settings" },
          { label: "Segurança", path: "/platform/security" },
        ]
      },
    ],
  },
];

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(["Assinaturas", "Escolas", "Usuários"]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Desconectado com sucesso");
    navigate("/auth");
  };

  const getInitials = (email?: string) => {
    if (!email) return "G";
    return email.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/platform") {
      return location.pathname === "/platform";
    }
    return location.pathname === path;
  };

  const isModuleActive = (module: NavModule) => {
    if (module.path) return isActive(module.path);
    return module.subItems?.some(sub => isActive(sub.path)) ?? false;
  };

  const toggleModule = (label: string) => {
    setExpandedModules(prev => 
      prev.includes(label) 
        ? prev.filter(m => m !== label)
        : [...prev, label]
    );
  };

  const NavModule = ({ module }: { module: NavModule }) => {
    const hasSubItems = module.subItems && module.subItems.length > 0;
    const isExpanded = expandedModules.includes(module.label);
    const moduleActive = isModuleActive(module);

    if (!hasSubItems) {
      return (
        <button
          onClick={() => {
            if (module.path) {
              navigate(module.path);
              setMobileMenuOpen(false);
            }
          }}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
            moduleActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <module.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{module.label}</span>
          <ChevronRight className="h-4 w-4 opacity-40" />
        </button>
      );
    }

    return (
      <div>
        <button
          onClick={() => toggleModule(module.label)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
            moduleActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <module.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{module.label}</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 opacity-40" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3 pb-1">
                {module.subItems?.map((subItem, index) => (
                  <motion.button
                    key={subItem.path + subItem.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.15 }}
                    onClick={() => {
                      navigate(subItem.path);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "block w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200",
                      isActive(subItem.path)
                        ? "text-primary font-medium bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    {subItem.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Sidebar = ({ className }: { className?: string }) => (
    <aside className={cn("flex flex-col h-full bg-card", className)}>
      {/* Logo with premium gradient */}
      <div className="px-4 py-5 border-b border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-90 transition-opacity w-full">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-foreground">Gestor</p>
                <p className="text-xs text-muted-foreground">Painel da Plataforma</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/platform/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Home Link */}
      <div className="px-3 py-4 border-b border-border/50">
        <button
          onClick={() => navigate("/platform")}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
            location.pathname === "/platform"
              ? "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent text-primary font-medium border-l-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Página inicial</span>
        </button>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navigation.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.modules.map((module) => (
                <NavModule key={module.label} module={module} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile at bottom */}
      <div className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Gestor do Sistema</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient overlay - subtle */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-purple-500/5 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl z-30">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-4 px-4 py-3 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">Gestor</span>
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
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border/50 shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <span className="font-bold text-foreground">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-64 relative z-10">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 hidden lg:flex items-center justify-between gap-4 px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-border/50">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar escolas, usuários..."
                className="pl-10 bg-muted/30 border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/platform/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            
            <div className="ml-2 h-6 w-px bg-border" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ml-2">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Gestor da Plataforma</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/platform/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
