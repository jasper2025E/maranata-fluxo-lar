import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { 
  ProfileTab, 
  SecurityTab, 
  PreferencesTab, 
  SystemTab, 
  ConfiguracoesCobranca,
  UserManagementTab,
  IntegrationsTab,
  GatewayConfigTab,
} from "@/components/config";

interface UserPreferences {
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_report: boolean;
  theme: string;
}

interface NavItem {
  id: string;
  label: string;
  adminOnly?: boolean;
  platformAdminOnly?: boolean;
}

const Configuracoes = () => {
  const { user, role, isPlatformAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("perfil");
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    browser_notifications: false,
    weekly_report: true,
    theme: "light",
  });

  const navItems: NavItem[] = [
    { id: "perfil", label: "Perfil" },
    { id: "seguranca", label: "Segurança" },
    { id: "preferencias", label: "Preferências" },
    { id: "cobranca", label: "Cobrança", adminOnly: true },
    { id: "usuarios", label: "Usuários", adminOnly: true },
    { id: "gateways", label: "Gateways", adminOnly: true },
    { id: "integracoes", label: "Integrações", platformAdminOnly: true },
    { id: "sistema", label: "Sistema", adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.platformAdminOnly) return isPlatformAdmin();
    if (item.adminOnly) return role === "admin";
    return true;
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
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
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-8">
            <Skeleton className="h-[300px] w-48" />
            <Skeleton className="h-[300px] flex-1" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        return (
          <ProfileTab 
            user={user} 
            role={role} 
            avatarUrl={avatarUrl} 
            setAvatarUrl={setAvatarUrl} 
          />
        );
      case "seguranca":
        return <SecurityTab />;
      case "preferencias":
        return (
          <PreferencesTab
            user={user}
            theme={theme}
            setTheme={setTheme}
            preferences={preferences}
            setPreferences={setPreferences}
            loadingPrefs={loadingPrefs}
          />
        );
      case "cobranca":
        return role === "admin" ? <ConfiguracoesCobranca /> : null;
      case "usuarios":
        return role === "admin" ? <UserManagementTab /> : null;
      case "gateways":
        return role === "admin" ? <GatewayConfigTab /> : null;
      case "integracoes":
        return isPlatformAdmin() ? <IntegrationsTab /> : null;
      case "sistema":
        return role === "admin" ? <SystemTab role={role} /> : null;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Conta</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Configurações</span>
        </nav>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="md:w-48 shrink-0">
            <ul className="space-y-0.5">
              {visibleNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === item.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
