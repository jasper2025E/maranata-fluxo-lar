import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Palette, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ColorEditor } from "./ColorEditor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface UserPreferences {
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_report: boolean;
  theme: string;
}

interface PreferencesTabProps {
  user: User | null;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  loadingPrefs: boolean;
}

export function PreferencesTab({ 
  user, 
  theme, 
  setTheme, 
  preferences, 
  setPreferences, 
  loadingPrefs 
}: PreferencesTabProps) {
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handlePreferenceSave = async () => {
    if (!user) return;
    
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: preferences.email_notifications,
          browser_notifications: preferences.browser_notifications,
          weekly_report: preferences.weekly_report,
          theme: theme || "light",
        }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Preferências salvas");
    } catch (error) {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    
    if (user) {
      try {
        await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, theme: newTheme }, { onConflict: "user_id" });
      } catch (error) {
        console.error("Error saving theme:", error);
      }
    }
  };

  if (loadingPrefs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="geral" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="geral" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Geral
        </TabsTrigger>
        <TabsTrigger value="cores" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Cores
        </TabsTrigger>
      </TabsList>

      <TabsContent value="geral" className="space-y-6">
        {/* Theme Selection */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Aparência</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
                { value: 'system', label: 'Sistema' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium rounded-lg border transition-colors",
                    theme === option.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Notificações</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notificações por e-mail</Label>
                <p className="text-xs text-muted-foreground">Atualizações importantes por e-mail</p>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, email_notifications: checked })
                }
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notificações no navegador</Label>
                <p className="text-xs text-muted-foreground">Alertas em tempo real</p>
              </div>
              <Switch
                checked={preferences.browser_notifications}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, browser_notifications: checked })
                }
              />
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Relatório semanal</Label>
                <p className="text-xs text-muted-foreground">Resumo financeiro toda segunda</p>
              </div>
              <Switch
                checked={preferences.weekly_report}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, weekly_report: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handlePreferenceSave} disabled={savingPrefs} size="sm">
            {savingPrefs ? "Salvando..." : "Salvar preferências"}
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="cores">
        {user && <ColorEditor userId={user.id} />}
      </TabsContent>
    </Tabs>
  );
}
