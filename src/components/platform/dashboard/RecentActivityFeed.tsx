import { motion } from "framer-motion";
import { 
  Building2, 
  UserPlus, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "school_created" | "subscription_active" | "subscription_trial" | "subscription_overdue" | "user_created";
  title: string;
  description: string;
  time: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const activityConfig = {
  school_created: {
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  subscription_active: {
    icon: CheckCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  subscription_trial: {
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  subscription_overdue: {
    icon: AlertTriangle,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
  },
  user_created: {
    icon: UserPlus,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">Atividade Recente</h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs h-7 px-2">
          Ver tudo
        </Button>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
