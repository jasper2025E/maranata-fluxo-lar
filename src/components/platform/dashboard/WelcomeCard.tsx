import { motion } from "framer-motion";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getGreeting, getFirstName } from "@/lib/greetings";

interface WelcomeCardProps {
  avatarUrl?: string | null;
  userName?: string | null;
  stats: {
    tenantsManaged: number;
    totalRevenue: string;
    activeDays: number;
  };
}

export function WelcomeCard({ avatarUrl, userName, stats }: WelcomeCardProps) {
  const { user } = useAuth();
  const displayName = userName || user?.user_metadata?.nome || user?.email?.split("@")[0] || "Gestor";
  const greeting = getGreeting();

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {getFirstName(displayName)} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Vamos acompanhar o desempenho da plataforma!
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}
