import { motion } from "framer-motion";
import { 
  Palette, 
  Settings2, 
  Database, 
  HardDrive,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const settingsTabs = [
  {
    id: "branding",
    label: "Marca",
    description: "Logo, cores e SEO",
    icon: Palette,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "general",
    label: "Geral",
    description: "Recursos e funcionalidades",
    icon: Settings2,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "limits",
    label: "Limites",
    description: "Quotas e restrições",
    icon: Database,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "backup",
    label: "Backup & Logs",
    description: "Backups e retenção",
    icon: HardDrive,
    iconColor: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-900/30",
  },
];

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <nav className="space-y-1">
        {settingsTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                isActive
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                isActive ? "bg-primary/15" : tab.iconBg
              )}>
                <TabIcon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : tab.iconColor
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm",
                  isActive ? "text-primary" : "text-foreground"
                )}>
                  {tab.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {tab.description}
                </p>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="h-8 w-1 rounded-full bg-primary"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Pro Tip Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/10"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Dica Pro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use cores vibrantes no gradiente para destacar sua marca na página de login.
            </p>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}
