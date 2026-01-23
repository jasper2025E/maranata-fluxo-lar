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
  Search,
  Bell,
  HelpCircle,
  Menu,
  X
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

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      { icon: LayoutDashboard, label: "Página inicial", path: "/platform" },
    ],
  },
  {
    items: [
      { icon: Building2, label: "Escolas", path: "/platform/tenants" },
      { icon: CreditCard, label: "Assinaturas", path: "/platform/subscriptions" },
      { icon: Users, label: "Usuários", path: "/platform/users" },
    ],
  },
  {
    title: "Atalhos",
    items: [
      { icon: UserCog, label: "Acessar Como", path: "/platform/impersonate" },
      { icon: Activity, label: "Atividade", path: "/platform/logs" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: Settings, label: "Configurações", path: "/platform/settings" },
      { icon: Shield, label: "Segurança", path: "/platform/security" },
    ],
  },
];

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <button
      onClick={() => {
        navigate(item.path);
        setMobileMenuOpen(false);
      }}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        isActive(item.path)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </button>
  );

  const Sidebar = ({ className }: { className?: string }) => (
    <aside className={cn("flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">G</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm text-foreground">Gestor</p>
                <p className="text-xs text-muted-foreground">Plataforma</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-card">
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex items-center gap-4 px-4 py-3 bg-card border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">G</span>
          </div>
          <span className="font-semibold text-sm">Gestor</span>
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
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold">Menu</span>
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
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 hidden lg:flex items-center justify-between gap-4 px-6 py-3 bg-card/80 backdrop-blur-sm border-b">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Settings className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Gestor da Plataforma</p>
                </div>
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
        <main className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
