import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building2, 
  LayoutDashboard, 
  Settings, 
  Shield, 
  LogOut,
  Activity,
  Users,
  UserCog,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlatformLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/platform" },
  { icon: Building2, label: "Escolas", path: "/platform/tenants" },
  { icon: CreditCard, label: "Assinaturas", path: "/platform/subscriptions" },
  { icon: Users, label: "Usuários", path: "/platform/users" },
  { icon: UserCog, label: "Acessar Como", path: "/platform/impersonate" },
  { icon: Activity, label: "Atividade", path: "/platform/logs" },
  { icon: Settings, label: "Configurações", path: "/platform/settings" },
  { icon: Shield, label: "Segurança", path: "/platform/security" },
];

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Desconectado com sucesso");
    navigate("/auth");
  };

  const getInitials = (email?: string) => {
    if (!email) return "PA";
    return email.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/platform") {
      return location.pathname === "/platform";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed inset-y-0 left-0 z-50 w-16 flex flex-col bg-slate-950/50 backdrop-blur-xl border-r border-slate-700/50"
      >
        {/* Logo - Gestor */}
        <div className="flex h-16 items-center justify-center border-b border-slate-700/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 cursor-pointer">
                <span className="text-white font-bold text-lg">G</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 border-slate-700">
              Painel do Gestor
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2 py-4">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10 transition-all",
                      isActive(item.path)
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 py-4 border-t border-slate-700/50">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                {user?.email}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                Sair
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="pl-16">
        <div className="min-h-screen p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
