import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Trophy, 
  ChevronRight,
  Zap,
  Target,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Achievement {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

interface AwardsWidgetProps {
  achievements: Achievement[];
}

export function AwardsWidget({ achievements }: AwardsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-2xl border border-border p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Suas Conquistas</h3>
        <Select defaultValue="30">
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {achievements.slice(0, 3).map((achievement, index) => (
          <motion.div
            key={achievement.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className={cn(
              "h-10 w-10 mx-auto rounded-xl flex items-center justify-center mb-2",
              achievement.bgColor
            )}>
              <achievement.icon className={cn("h-5 w-5", achievement.color)} />
            </div>
            <p className="text-xs text-muted-foreground mb-0.5">{achievement.label}</p>
            <p className={cn("text-sm font-bold", achievement.color)}>{achievement.value}</p>
          </motion.div>
        ))}
        
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-center p-3 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
          <div className="h-10 w-10 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </div>
          <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Ver mais</p>
        </motion.button>
      </div>
    </motion.div>
  );
}
