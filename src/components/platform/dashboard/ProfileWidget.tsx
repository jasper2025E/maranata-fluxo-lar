import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileWidgetProps {
  avatarUrl?: string | null;
  userName?: string | null;
  stats: {
    tenantsManaged: number;
    totalUsers: number;
    activeDays: number;
  };
}

export function ProfileWidget({ avatarUrl, userName, stats }: ProfileWidgetProps) {
  const { user } = useAuth();
  const displayName = userName || user?.user_metadata?.nome || "Gestor";
  const email = user?.email || "";

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-4 ring-primary/10">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground text-lg">{displayName}</h3>
            <p className="text-sm text-muted-foreground">@{email.split("@")[0]}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Escolas</p>
          <p className="text-xl font-bold text-primary">{stats.tenantsManaged}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Usuários</p>
          <p className="text-xl font-bold text-foreground">{stats.totalUsers}</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Dias ativos</p>
          <p className="text-xl font-bold text-foreground">{stats.activeDays}</p>
        </div>
      </div>
    </motion.div>
  );
}
