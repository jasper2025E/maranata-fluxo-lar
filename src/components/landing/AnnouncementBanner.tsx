import { X, Info, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "promo";
  link_url: string | null;
  link_text: string | null;
}

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

const typeConfig = {
  info: {
    icon: Info,
    bg: "bg-blue-500/90",
    text: "text-white",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/90",
    text: "text-white",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-emerald-500/90",
    text: "text-white",
  },
  promo: {
    icon: Sparkles,
    bg: "bg-gradient-to-r from-purple-600/90 to-pink-500/90",
    text: "text-white",
  },
};

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="w-full space-y-2">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement) => {
          const config = typeConfig[announcement.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`${config.bg} ${config.text} backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{announcement.title}</p>
                <p className="text-sm opacity-90 truncate">{announcement.message}</p>
              </div>
              {announcement.link_url && announcement.link_text && (
                <a
                  href={announcement.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline underline-offset-2 hover:opacity-80 flex-shrink-0"
                >
                  {announcement.link_text}
                </a>
              )}
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
