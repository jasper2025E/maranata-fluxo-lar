import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bell, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { getGreeting, getFirstName } from "@/lib/greetings";
import { getRandomVerse } from "@/lib/biblicalVerses";

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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
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
      </div>

      {/* Versículo Bíblico */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/10"
      >
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground italic leading-relaxed">
              "{verse.text}"
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              — {verse.reference}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
