import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Bell, 
  Settings,
  Loader2,
  Moon,
  Sun,
  Save,
  Mail,
  BellRing,
  FileText,
  Monitor,
  Palette,
  Languages,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
      const prefsToSave = {
        user_id: user.id,
        email_notifications: preferences.email_notifications,
        browser_notifications: preferences.browser_notifications,
        weekly_report: preferences.weekly_report,
        theme: theme || "light",
      };

      const { error } = await supabase
        .from("user_preferences")
        .upsert(prefsToSave, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("Preferências salvas com sucesso!");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
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
          .upsert({
            user_id: user.id,
            theme: newTheme,
          }, { onConflict: "user_id" });
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Notifications */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingPrefs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="font-medium">Notificações por e-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizações importantes por e-mail
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, email_notifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <BellRing className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="font-medium">Notificações no navegador</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas em tempo real no navegador
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.browser_notifications}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, browser_notifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/10">
                    <FileText className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="font-medium">Relatório semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Resumo financeiro enviado toda segunda-feira
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.weekly_report}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, weekly_report: checked })
                  }
                />
              </div>

              <Button 
                onClick={handlePreferenceSave} 
                disabled={savingPrefs}
                className="w-full sm:w-auto"
              >
                {savingPrefs ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Notificações
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Tema</Label>
            <RadioGroup
              value={theme}
              onValueChange={handleThemeChange}
              className="grid grid-cols-3 gap-4"
            >
              <Label
                htmlFor="theme-light"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "light" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                <div className="p-3 rounded-full bg-amber-100">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-sm font-medium">Claro</span>
              </Label>

              <Label
                htmlFor="theme-dark"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "dark" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                <div className="p-3 rounded-full bg-slate-800">
                  <Moon className="h-6 w-6 text-slate-300" />
                </div>
                <span className="text-sm font-medium">Escuro</span>
              </Label>

              <Label
                htmlFor="theme-system"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  theme === "system" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-slate-800">
                  <Monitor className="h-6 w-6 text-foreground" />
                </div>
                <span className="text-sm font-medium">Sistema</span>
              </Label>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Languages className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <Label className="font-medium">Idioma</Label>
                <p className="text-sm text-muted-foreground">
                  Português (Brasil)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Em breve
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
