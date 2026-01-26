import { motion } from "framer-motion";
import { 
  Clock, 
  MoreHorizontal,
  Building2,
  CreditCard,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UpcomingActivity {
  id: string;
  type: "trial_ending" | "subscription_renewal" | "announcement";
  title: string;
  time: string;
  color: string;
}

interface UpcomingActivitiesProps {
  activities: UpcomingActivity[];
}

const typeConfig = {
  trial_ending: {
    icon: Building2,
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "Trial",
  },
  subscription_renewal: {
    icon: CreditCard,
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    label: "Renovação",
  },
  announcement: {
    icon: Megaphone,
    badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    label: "Anúncio",
  },
};

export function UpcomingActivities({ activities }: UpcomingActivitiesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Próximas Atividades</h3>
        <Button variant="ghost" size="sm" className="text-primary text-xs">
          Ver todas
        </Button>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const config = typeConfig[activity.type];
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground truncate pr-2">
                    {activity.title}
                  </h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-xs border-0", config.badgeColor)}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
