import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageSelector } from "./LanguageSelector";
import { Bell, Search, Clock, Info, AlertTriangle, CheckCircle2, Check } from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es, fr, de } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: loadingNotifications } = useNotifications();

  // Get date-fns locale based on current language
  const getDateLocale = () => {
    const locales: Record<string, typeof ptBR> = { 'pt-BR': ptBR, en: enUS, es, fr, de };
    return locales[i18n.language] || ptBR;
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationBg = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-success/10";
      case "warning":
        return "bg-warning/10";
      case "error":
        return "bg-destructive/10";
      default:
        return "bg-primary/10";
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, nome")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
      if (data?.nome) {
        setProfileName(data.nome);
      }
    };

    loadProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary",
    staff: "bg-info",
    financeiro: "bg-success",
    secretaria: "bg-warning",
  };
  const roleLabels: Record<string, string> = {
    admin: t("roles.admin"),
    staff: t("roles.staff"),
    financeiro: t("roles.financeiro"),
    secretaria: t("roles.secretaria"),
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || "U";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
          {/* Premium Header */}
          <header className="h-16 border-b border-border/50 bg-card/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              <div className="hidden md:flex relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.searchPlaceholder")}
                  className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <LanguageSelector variant="compact" />

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-muted">
                    <Bell className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.75} />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse-subtle" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-large">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{t("common.notifications")}</h4>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount > 0 
                          ? t(unreadCount > 1 ? "common.unreadNotificationsPlural" : "common.unreadNotifications", { count: unreadCount })
                          : t("common.noUnreadNotifications")
                        }
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7"
                        onClick={markAllAsRead}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {t("common.markAll")}
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[280px]">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">{t("common.noNotifications")}</p>
                        <p className="text-xs text-muted-foreground/70">{t("common.notificationsInfo")}</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                              if (notification.link) {
                                navigate(notification.link);
                              }
                            }}
                            className={`flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                              !notification.read ? "bg-muted/30" : ""
                            }`}
                          >
                            <div className={`h-9 w-9 rounded-full ${getNotificationBg(notification.type)} flex items-center justify-center shrink-0`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> 
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true, 
                                  locale: getDateLocale() 
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t">
                      <Button variant="ghost" className="w-full text-sm" size="sm">
                        {t("common.viewAll")}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 px-3 h-10 rounded-xl hover:bg-muted">
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      <AvatarImage src={avatarUrl || undefined} alt="Foto de perfil" />
                      <AvatarFallback className={`${roleColors[role || 'staff']} text-white text-xs font-semibold`}>
                        {getInitials(profileName, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {profileName || user?.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role ? roleLabels[role] : t("roles.user")}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-large">
                  <DropdownMenuLabel className="py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {role ? roleLabels[role] : t("roles.user")}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/configuracoes")} className="py-2.5 cursor-pointer">
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="py-2.5 text-destructive cursor-pointer focus:text-destructive">
                    {t("nav.exitSystem")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 lg:p-8 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
