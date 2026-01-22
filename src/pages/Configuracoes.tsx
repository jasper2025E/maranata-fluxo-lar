import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Lock, 
  Settings, 
  Receipt,
  Database,
  Users,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  ProfileTab, 
  SecurityTab, 
  PreferencesTab, 
  SystemTab, 
  ConfiguracoesCobranca,
  UserManagementTab,
  IntegrationsTab,
} from "@/components/config";

interface UserPreferences {
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_report: boolean;
  theme: string;
}

const Configuracoes = () => {
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    browser_notifications: false,
    weekly_report: true,
    theme: "light",
  });

  // Load user preferences and profile on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefsError) throw prefsError;

        if (prefsData) {
          setPreferences({
            email_notifications: prefsData.email_notifications ?? true,
            browser_notifications: prefsData.browser_notifications ?? false,
            weekly_report: prefsData.weekly_report ?? true,
            theme: prefsData.theme ?? "light",
          });
          if (prefsData.theme) {
            setTheme(prefsData.theme);
          }
          if (prefsData.language && prefsData.language !== i18n.language) {
            i18n.changeLanguage(prefsData.language);
          }
        }

        // Load profile avatar
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadData();
  }, [user, setTheme]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conta e preferências do sistema
          </p>
        </motion.div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="perfil" className="gap-2 data-[state=active]:bg-background">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="gap-2 data-[state=active]:bg-background">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="preferencias" className="gap-2 data-[state=active]:bg-background">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferências</span>
              </TabsTrigger>
              {role === "admin" && (
                <TabsTrigger value="cobranca" className="gap-2 data-[state=active]:bg-background">
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Cobrança</span>
                </TabsTrigger>
              )}
              {role === "admin" && (
                <TabsTrigger value="usuarios" className="gap-2 data-[state=active]:bg-background">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>
              )}
              {role === "admin" && (
                <TabsTrigger value="integracoes" className="gap-2 data-[state=active]:bg-background">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrações</span>
                </TabsTrigger>
              )}
              {role === "admin" && (
                <TabsTrigger value="sistema" className="gap-2 data-[state=active]:bg-background">
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Sistema</span>
                </TabsTrigger>
              )}
            </TabsList>
          </motion.div>

          {/* Perfil Tab */}
          <TabsContent value="perfil">
            <ProfileTab 
              user={user} 
              role={role} 
              avatarUrl={avatarUrl} 
              setAvatarUrl={setAvatarUrl} 
            />
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="seguranca">
            <SecurityTab />
          </TabsContent>

          {/* Preferências Tab */}
          <TabsContent value="preferencias">
            <PreferencesTab
              user={user}
              theme={theme}
              setTheme={setTheme}
              preferences={preferences}
              setPreferences={setPreferences}
              loadingPrefs={loadingPrefs}
            />
          </TabsContent>

          {/* Cobrança Tab - Admin Only */}
          {role === "admin" && (
            <TabsContent value="cobranca">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ConfiguracoesCobranca />
              </motion.div>
            </TabsContent>
          )}

          {/* Usuários Tab - Admin Only */}
          {role === "admin" && (
            <TabsContent value="usuarios">
              <UserManagementTab />
            </TabsContent>
          )}

          {/* Integrações Tab - Admin Only */}
          {role === "admin" && (
            <TabsContent value="integracoes">
              <IntegrationsTab />
            </TabsContent>
          )}

          {/* Sistema Tab - Admin Only */}
          {role === "admin" && (
            <TabsContent value="sistema">
              <SystemTab role={role} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
