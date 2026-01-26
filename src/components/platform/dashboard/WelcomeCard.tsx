import { useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, MessageSquare, BookOpen, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getGreeting, getFirstName } from "@/lib/greetings";
import { getRandomVerse } from "@/lib/biblicalVerses";
import { cn } from "@/lib/utils";

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

  // Mantém o mesmo versículo durante a sessão
  const verse = useMemo(() => getRandomVerse(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Welcome Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting}, {getFirstName(displayName)} 👋
            </h1>
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 text-primary gap-1.5"
            >
              <Crown className="h-3 w-3" />
              Gestor Master
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Vamos acompanhar o desempenho da plataforma!
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full animate-pulse" />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Versículo Bíblico - Premium Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10" />
        <div className="absolute inset-0 backdrop-blur-sm" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative p-5 border border-primary/10 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  Versículo do Dia
                </span>
              </div>
              <p className="text-sm text-foreground italic leading-relaxed">
                "{verse.text}"
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-semibold">
                — {verse.reference}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
