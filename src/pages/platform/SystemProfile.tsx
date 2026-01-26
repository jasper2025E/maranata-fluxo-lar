import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Save,
  Loader2,
  Palette,
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  CreditCard,
  Bell,
  Clock,
  FileText,
  HardDrive,
  Camera,
  Zap,
  AlertTriangle,
  Users,
  Server
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface SystemConfig {
  // Branding
  platform_name: string;
  platform_logo: string;
  favicon_url: string;
  meta_title: string;
  meta_description: string;
  support_email: string;
  // Gradients
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
  // System Limits
  max_schools: number;
  max_users_per_school: number;
  max_students_per_school: number;
  max_file_size_mb: number;
  // Features
  enable_new_registrations: boolean;
  enable_email_notifications: boolean;
  enable_maintenance_mode: boolean;
  stripe_enabled: boolean;
  asaas_enabled: boolean;
  // Session & Security
  session_timeout_minutes: number;
  require_mfa_admins: boolean;
  password_min_length: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  // Backup & Logs
  log_retention_days: number;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  // Notifications
  notify_new_tenant: boolean;
  notify_payment_issues: boolean;
  notify_security_alerts: boolean;
}

const defaultConfig: SystemConfig = {
  platform_name: "Sistema de Gestão",
  platform_logo: "",
  favicon_url: "",
  meta_title: "",
  meta_description: "",
  support_email: "suporte@exemplo.com",
  gradient_from: "262 83% 58%",
  gradient_via: "292 84% 61%",
  gradient_to: "24 95% 53%",
  max_schools: 100,
  max_users_per_school: 10,
  max_students_per_school: 500,
  max_file_size_mb: 10,
  enable_new_registrations: true,
  enable_email_notifications: true,
  enable_maintenance_mode: false,
  stripe_enabled: true,
  asaas_enabled: true,
  session_timeout_minutes: 480,
  require_mfa_admins: false,
  password_min_length: 8,
  max_login_attempts: 5,
  lockout_duration_minutes: 30,
  log_retention_days: 90,
  auto_backup_enabled: true,
  backup_frequency: "daily",
  notify_new_tenant: true,
  notify_payment_issues: true,
  notify_security_alerts: true,
};

export default function SystemProfile() {
  const { isPlatformAdmin } = useAuth();
  const { data: platformSettings, refetch: refetchPlatformSettings } = usePlatformSettings();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("branding");
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin()) {
      fetchSettings();
    }
  }, [isPlatformAdmin]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) throw error;

      if (settings && settings.length > 0) {
        const loaded: Partial<SystemConfig> = {};
        settings.forEach((row) => {
          const val = row.value as { value: unknown } | null;
          if (val && typeof val === "object" && "value" in val) {
            (loaded as Record<string, unknown>)[row.key] = val.value;
          }
        });
        setConfig({ ...defaultConfig, ...loaded } as SystemConfig);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(config);
      
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert({ key, value: { value } }, { onConflict: "key" });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["platform-branding"] });
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      
      toast.success("Configurações do sistema salvas!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WEBP ou SVG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `system/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const logoUrl = `${publicUrl}?t=${Date.now()}`;
      setConfig(prev => ({ ...prev, platform_logo: logoUrl }));

      const { error } = await supabase
        .from("platform_settings")
        .upsert({ key: "platform_logo", value: { value: logoUrl } }, { onConflict: "key" });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["platform-branding"] });
      toast.success("Logo do sistema atualizada!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Erro ao enviar logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateConfig = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getInitials = (name: string) => {
    if (!name) return "SG";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Configurações do Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as configurações globais da plataforma
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="branding" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden lg:inline">Marca</span>
              </TabsTrigger>
              <TabsTrigger value="general" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden lg:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="limits" className="gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden lg:inline">Limites</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden lg:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden lg:inline">Alertas</span>
              </TabsTrigger>
            </TabsList>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Logo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Logo do Sistema
                    </CardTitle>
                    <CardDescription>Imagem principal exibida no login e cabeçalho</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                          {config.platform_logo ? (
                            <AvatarImage src={config.platform_logo} alt="Logo" />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-bold">
                            {getInitials(config.platform_name)}
                          </AvatarFallback>
                        </Avatar>
                        <label 
                          htmlFor="logo-upload"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            onChange={handleLogoUpload}
                            className="sr-only"
                            disabled={uploadingLogo}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP ou SVG • Máx 10MB
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Info */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informações da Plataforma</CardTitle>
                    <CardDescription>Nome, SEO e metadados do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nome da Plataforma</Label>
                        <Input
                          value={config.platform_name}
                          onChange={(e) => updateConfig("platform_name", e.target.value)}
                          placeholder="Ex: Meu Sistema de Gestão"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email de Suporte</Label>
                        <Input
                          type="email"
                          value={config.support_email}
                          onChange={(e) => updateConfig("support_email", e.target.value)}
                          placeholder="suporte@exemplo.com"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Título SEO</Label>
                        <Input
                          value={config.meta_title}
                          onChange={(e) => updateConfig("meta_title", e.target.value)}
                          placeholder="Sistema de Gestão Escolar"
                          maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground">{(config.meta_title || "").length}/60</p>
                      </div>
                      <div className="space-y-2">
                        <Label>URL do Favicon</Label>
                        <Input
                          value={config.favicon_url}
                          onChange={(e) => updateConfig("favicon_url", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição SEO</Label>
                      <Textarea
                        value={config.meta_description}
                        onChange={(e) => updateConfig("meta_description", e.target.value)}
                        placeholder="Plataforma completa para gestão de escolas..."
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground">{(config.meta_description || "").length}/160</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gradient Colors */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Cores do Gradiente
                    </CardTitle>
                    <CardDescription>Cores de fundo das páginas públicas (login, cadastro)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Cor Inicial (HSL)</Label>
                        <Input
                          value={config.gradient_from}
                          onChange={(e) => updateConfig("gradient_from", e.target.value)}
                          placeholder="262 83% 58%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Meio (HSL)</Label>
                        <Input
                          value={config.gradient_via}
                          onChange={(e) => updateConfig("gradient_via", e.target.value)}
                          placeholder="292 84% 61%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor Final (HSL)</Label>
                        <Input
                          value={config.gradient_to}
                          onChange={(e) => updateConfig("gradient_to", e.target.value)}
                          placeholder="24 95% 53%"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preview do Gradiente</CardTitle>
                    <CardDescription>Visualização em tempo real</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-32 rounded-lg overflow-hidden">
                      <GradientBackground
                        gradientFrom={config.gradient_from}
                        gradientVia={config.gradient_via}
                        gradientTo={config.gradient_to}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 rounded-lg p-4 shadow-xl text-center">
                          {config.platform_logo ? (
                            <img src={config.platform_logo} alt="Logo" className="h-10 w-10 rounded-lg mx-auto mb-1 object-contain" />
                          ) : null}
                          <p className="text-sm font-medium text-gray-900">{config.platform_name || "Sua Plataforma"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      Funcionalidades
                    </CardTitle>
                    <CardDescription>Ative ou desative recursos do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Novos Cadastros</Label>
                        <p className="text-xs text-muted-foreground">Permitir registro de novas escolas</p>
                      </div>
                      <Switch
                        checked={config.enable_new_registrations}
                        onCheckedChange={(checked) => updateConfig("enable_new_registrations", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Notificações por Email
                        </Label>
                        <p className="text-xs text-muted-foreground">Enviar emails automatizados</p>
                      </div>
                      <Switch
                        checked={config.enable_email_notifications}
                        onCheckedChange={(checked) => updateConfig("enable_email_notifications", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Modo Manutenção
                        </Label>
                        <p className="text-xs text-muted-foreground">Bloquear acesso ao sistema</p>
                      </div>
                      <Switch
                        checked={config.enable_maintenance_mode}
                        onCheckedChange={(checked) => updateConfig("enable_maintenance_mode", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Gateways de Pagamento
                    </CardTitle>
                    <CardDescription>Métodos de pagamento disponíveis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Stripe</Label>
                        <p className="text-xs text-muted-foreground">Cartões internacionais</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Internacional</Badge>
                        <Switch
                          checked={config.stripe_enabled}
                          onCheckedChange={(checked) => updateConfig("stripe_enabled", checked)}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Asaas</Label>
                        <p className="text-xs text-muted-foreground">PIX e Boleto</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Brasil</Badge>
                        <Switch
                          checked={config.asaas_enabled}
                          onCheckedChange={(checked) => updateConfig("asaas_enabled", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-600" />
                      Backup e Logs
                    </CardTitle>
                    <CardDescription>Configurações de retenção e backup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Backup Automático</Label>
                        <p className="text-xs text-muted-foreground">Criar backups periodicamente</p>
                      </div>
                      <Switch
                        checked={config.auto_backup_enabled}
                        onCheckedChange={(checked) => updateConfig("auto_backup_enabled", checked)}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Frequência de Backup</Label>
                      <Select
                        value={config.backup_frequency}
                        onValueChange={(value) => updateConfig("backup_frequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Retenção de Logs (dias)</Label>
                      <Input
                        type="number"
                        value={config.log_retention_days}
                        onChange={(e) => updateConfig("log_retention_days", parseInt(e.target.value) || 90)}
                        min={7}
                        max={365}
                      />
                      <p className="text-xs text-muted-foreground">Logs de auditoria serão mantidos por este período</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Limits Tab */}
            <TabsContent value="limits" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Limites de Escolas
                    </CardTitle>
                    <CardDescription>Capacidade máxima do sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Máximo de Escolas</Label>
                      <Input
                        type="number"
                        value={config.max_schools}
                        onChange={(e) => updateConfig("max_schools", parseInt(e.target.value) || 100)}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Número máximo de tenants no sistema</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Usuários por Escola</Label>
                      <Input
                        type="number"
                        value={config.max_users_per_school}
                        onChange={(e) => updateConfig("max_users_per_school", parseInt(e.target.value) || 10)}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alunos por Escola</Label>
                      <Input
                        type="number"
                        value={config.max_students_per_school}
                        onChange={(e) => updateConfig("max_students_per_school", parseInt(e.target.value) || 500)}
                        min={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-orange-600" />
                      Limites de Arquivos
                    </CardTitle>
                    <CardDescription>Tamanho máximo para uploads</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tamanho Máximo por Arquivo (MB)</Label>
                      <Input
                        type="number"
                        value={config.max_file_size_mb}
                        onChange={(e) => updateConfig("max_file_size_mb", parseInt(e.target.value) || 10)}
                        min={1}
                        max={100}
                      />
                      <p className="text-xs text-muted-foreground">Aplica-se a todos os uploads do sistema</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cotas por Plano</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Basic</span>
                          <Badge variant="outline">500 MB</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Professional</span>
                          <Badge variant="outline">2 GB</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Enterprise</span>
                          <Badge variant="outline">10 GB</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Sessão e Autenticação
                    </CardTitle>
                    <CardDescription>Configurações de timeout e login</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Timeout da Sessão (minutos)</Label>
                      <Input
                        type="number"
                        value={config.session_timeout_minutes}
                        onChange={(e) => updateConfig("session_timeout_minutes", parseInt(e.target.value) || 480)}
                        min={15}
                        max={1440}
                      />
                      <p className="text-xs text-muted-foreground">Sessões inativas serão encerradas após este período</p>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>MFA Obrigatório para Admins</Label>
                        <p className="text-xs text-muted-foreground">Exigir autenticação de dois fatores</p>
                      </div>
                      <Switch
                        checked={config.require_mfa_admins}
                        onCheckedChange={(checked) => updateConfig("require_mfa_admins", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      Política de Senhas
                    </CardTitle>
                    <CardDescription>Requisitos de segurança para senhas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tamanho Mínimo da Senha</Label>
                      <Input
                        type="number"
                        value={config.password_min_length}
                        onChange={(e) => updateConfig("password_min_length", parseInt(e.target.value) || 8)}
                        min={6}
                        max={32}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo de Tentativas de Login</Label>
                      <Input
                        type="number"
                        value={config.max_login_attempts}
                        onChange={(e) => updateConfig("max_login_attempts", parseInt(e.target.value) || 5)}
                        min={3}
                        max={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duração do Bloqueio (minutos)</Label>
                      <Input
                        type="number"
                        value={config.lockout_duration_minutes}
                        onChange={(e) => updateConfig("lockout_duration_minutes", parseInt(e.target.value) || 30)}
                        min={5}
                        max={120}
                      />
                      <p className="text-xs text-muted-foreground">Tempo de bloqueio após exceder tentativas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-yellow-600" />
                    Alertas do Sistema
                  </CardTitle>
                  <CardDescription>Configure quais notificações você deseja receber</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novo Tenant Cadastrado</Label>
                      <p className="text-xs text-muted-foreground">Receber alerta quando uma nova escola se cadastrar</p>
                    </div>
                    <Switch
                      checked={config.notify_new_tenant}
                      onCheckedChange={(checked) => updateConfig("notify_new_tenant", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Problemas de Pagamento</Label>
                      <p className="text-xs text-muted-foreground">Alertas sobre faturas vencidas e falhas de cobrança</p>
                    </div>
                    <Switch
                      checked={config.notify_payment_issues}
                      onCheckedChange={(checked) => updateConfig("notify_payment_issues", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Segurança</Label>
                      <p className="text-xs text-muted-foreground">Tentativas suspeitas de acesso e violações</p>
                    </div>
                    <Switch
                      checked={config.notify_security_alerts}
                      onCheckedChange={(checked) => updateConfig("notify_security_alerts", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </PlatformLayout>
  );
}
