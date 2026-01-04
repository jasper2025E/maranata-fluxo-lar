import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Lock, 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Loader2,
  Moon,
  Sun,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface UserPreferences {
  email_notifications: boolean;
  browser_notifications: boolean;
  weekly_report: boolean;
  theme: string;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Configuracoes = () => {
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    email_notifications: true,
    browser_notifications: false,
    weekly_report: true,
    theme: "light",
  });

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            email_notifications: data.email_notifications ?? true,
            browser_notifications: data.browser_notifications ?? false,
            weekly_report: data.weekly_report ?? true,
            theme: data.theme ?? "light",
          });
          // Sync theme with stored preference
          if (data.theme) {
            setTheme(data.theme);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoadingPrefs(false);
      }
    };

    loadPreferences();
  }, [user, setTheme]);

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    staff: "Funcionário",
    financeiro: "Financeiro",
    secretaria: "Secretaria",
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse(passwordData);
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

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

  const handleThemeChange = async (isDark: boolean) => {
    const newTheme = isDark ? "dark" : "light";
    setTheme(newTheme);
    
    // Auto-save theme preference
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
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie sua conta e preferências do sistema
          </p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferências
            </TabsTrigger>
          </TabsList>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Visualize suas informações de conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {user?.email?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{user?.email?.split("@")[0]}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {role ? roleLabels[role] : "Usuário"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={user?.email || ""} 
                        disabled 
                        className="bg-muted/50"
                      />
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        Verificado
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">Função no Sistema</Label>
                    <Input 
                      value={role ? roleLabels[role] : "Usuário"} 
                      disabled 
                      className="bg-muted/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">Membro desde</Label>
                    <Input 
                      value={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"} 
                      disabled 
                      className="bg-muted/50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segurança Tab */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres. Use letras, números e símbolos.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      "Alterar Senha"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Segurança da Conta
                </CardTitle>
                <CardDescription>
                  Informações sobre a segurança da sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">E-mail verificado</p>
                      <p className="text-xs text-muted-foreground">Sua conta está protegida</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success border-success/30">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Autenticação em dois fatores</p>
                      <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferências Tab */}
          <TabsContent value="preferencias" className="space-y-6">
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium">Notificações por e-mail</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba atualizações importantes por e-mail
                        </p>
                      </div>
                      <Switch
                        checked={preferences.email_notifications}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, email_notifications: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium">Notificações no navegador</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba alertas em tempo real
                        </p>
                      </div>
                      <Switch
                        checked={preferences.browser_notifications}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, browser_notifications: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-medium">Relatório semanal</Label>
                        <p className="text-sm text-muted-foreground">
                          Resumo financeiro enviado toda segunda-feira
                        </p>
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

            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Aparência
                </CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-primary" />
                    ) : (
                      <Sun className="h-5 w-5 text-warning" />
                    )}
                    <div className="space-y-0.5">
                      <Label className="font-medium">Modo escuro</Label>
                      <p className="text-sm text-muted-foreground">
                        {theme === "dark" ? "Tema escuro ativado" : "Tema claro ativado"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={handleThemeChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
