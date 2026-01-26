import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  CreditCard, 
  Users,
  Megaphone,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Building2,
    label: "Nova Escola",
    description: "Cadastrar instituição",
    path: "/platform/tenants/new",
    color: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
  },
  {
    icon: CreditCard,
    label: "Assinaturas",
    description: "Gerenciar billing",
    path: "/platform/subscriptions",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50",
  },
  {
    icon: Users,
    label: "Usuários",
    description: "Ver todos",
    path: "/platform/users",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50",
  },
  {
    icon: Megaphone,
    label: "Comunicado",
    description: "Criar anúncio",
    path: "/platform/announcements",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50",
  },
];

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {quickActions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.05 }}
          onClick={() => navigate(action.path)}
          className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
        >
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
            action.bgColor
          )}>
            <action.icon className={cn("h-5 w-5", action.color)} />
          </div>
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {action.label}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            {action.description}
            <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
}
