import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save,
  Loader2,
  Palette,
  Settings2,
  Mail,
  Database,
  CreditCard,
  HardDrive,
  Camera,
  Zap,
  AlertTriangle,
  Users,
  Server,
  Sparkles
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { HSLColorPicker } from "@/components/config/HSLColorPicker";
import { SettingsSidebar } from "@/components/platform/settings/SettingsSidebar";
import { cn } from "@/lib/utils";

interface SystemConfig {
  // Branding
  platform_name: string;
  platform_logo: string;
  favicon_url: string;
  meta_title: string;
  meta_description: string;
  support_email: string;
  privacy_terms_url: string;
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
  // Backup & Logs
  log_retention_days: number;
  auto_backup_enabled: boolean;
  backup_frequency: string;
}

const defaultConfig: SystemConfig = {
  platform_name: "Sistema de Gestão",
  platform_logo: "",
  favicon_url: "",
  meta_title: "",
  meta_description: "",
  support_email: "suporte@exemplo.com",
  privacy_terms_url: "",
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
  log_retention_days: 90,
  auto_backup_enabled: true,
  backup_frequency: "daily",
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

  const renderContent = () => {
    switch (activeTab) {
      case "branding":
        return (
          <div className="space-y-6">
            {/* Logo & Platform Info */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Logo Upload */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Logo do Sistema
                  </CardTitle>
                  <CardDescription className="text-xs">Imagem principal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                        {config.platform_logo ? (
                          <AvatarImage src={config.platform_logo} alt="Logo" />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl font-bold">
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
              <Card className="lg:col-span-2 border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Informações da Plataforma</CardTitle>
                  <CardDescription className="text-xs">Nome, email e metadados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Nome da Plataforma</Label>
                      <Input
                        value={config.platform_name}
                        onChange={(e) => updateConfig("platform_name", e.target.value)}
                        placeholder="Ex: Meu Sistema de Gestão"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Email de Suporte</Label>
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
                      <Label className="text-xs">Título SEO</Label>
                      <Input
                        value={config.meta_title}
                        onChange={(e) => updateConfig("meta_title", e.target.value)}
                        placeholder="Sistema de Gestão Escolar"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground">{(config.meta_title || "").length}/60</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">URL do Favicon</Label>
                      <Input
                        value={config.favicon_url}
                        onChange={(e) => updateConfig("favicon_url", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Descrição SEO</Label>
                    <Textarea
                      value={config.meta_description}
                      onChange={(e) => updateConfig("meta_description", e.target.value)}
                      placeholder="Plataforma completa para gestão de escolas..."
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">{(config.meta_description || "").length}/160</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">URL de Privacidade e Termos</Label>
                    <Input
                      value={config.privacy_terms_url}
                      onChange={(e) => updateConfig("privacy_terms_url", e.target.value)}
                      placeholder="https://seusite.com/privacidade"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gradient Colors */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="h-4 w-4 text-primary" />
                    Cores do Gradiente
                  </CardTitle>
                  <CardDescription className="text-xs">Personalize as cores das páginas públicas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <HSLColorPicker
                    label="Cor Inicial"
                    value={config.gradient_from}
                    onChange={(val) => updateConfig("gradient_from", val)}
                    defaultValue="262 83% 58%"
                  />
                  <HSLColorPicker
                    label="Cor do Meio"
                    value={config.gradient_via}
                    onChange={(val) => updateConfig("gradient_via", val)}
                    defaultValue="292 84% 61%"
                  />
                  <HSLColorPicker
                    label="Cor Final"
                    value={config.gradient_to}
                    onChange={(val) => updateConfig("gradient_to", val)}
                    defaultValue="24 95% 53%"
                  />
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Preview do Gradiente</CardTitle>
                  <CardDescription className="text-xs">Visualização em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-48 rounded-xl overflow-hidden border border-border/50">
                    <GradientBackground
                      gradientFrom={config.gradient_from}
                      gradientVia={config.gradient_via}
                      gradientTo={config.gradient_to}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl text-center border border-border/50 max-w-xs w-full">
                        {config.platform_logo ? (
                          <img src={config.platform_logo} alt="Logo" className="h-12 w-12 rounded-xl mx-auto mb-3 object-contain" />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-3 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-primary-foreground" />
                          </div>
                        )}
                        <p className="font-semibold text-foreground">{config.platform_name || "Sua Plataforma"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Página de Login</p>
                        <div className="mt-4 space-y-2">
                          <div className="h-8 bg-muted rounded-lg" />
                          <div className="h-8 bg-primary rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "general":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-success" />
                  Funcionalidades
                </CardTitle>
                <CardDescription className="text-xs">Ative ou desative recursos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Novos Cadastros</Label>
                    <p className="text-xs text-muted-foreground">Permitir registro de novas escolas</p>
                  </div>
                  <Switch
                    checked={config.enable_new_registrations}
                    onCheckedChange={(checked) => updateConfig("enable_new_registrations", checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5" />
                      Notificações por Email
                    </Label>
                    <p className="text-xs text-muted-foreground">Enviar emails automatizados</p>
                  </div>
                  <Switch
                    checked={config.enable_email_notifications}
                    onCheckedChange={(checked) => updateConfig("enable_email_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" />
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

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Gateways de Pagamento
                </CardTitle>
                <CardDescription className="text-xs">Métodos de pagamento disponíveis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Stripe</Label>
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Asaas</Label>
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
          </div>
        );

      case "limits":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  Limites de Escolas
                </CardTitle>
                <CardDescription className="text-xs">Capacidade máxima do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Máximo de Escolas</Label>
                  <Input
                    type="number"
                    value={config.max_schools}
                    onChange={(e) => updateConfig("max_schools", parseInt(e.target.value) || 100)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Usuários por Escola</Label>
                  <Input
                    type="number"
                    value={config.max_users_per_school}
                    onChange={(e) => updateConfig("max_users_per_school", parseInt(e.target.value) || 10)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Alunos por Escola</Label>
                  <Input
                    type="number"
                    value={config.max_students_per_school}
                    onChange={(e) => updateConfig("max_students_per_school", parseInt(e.target.value) || 500)}
                    min={1}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <HardDrive className="h-4 w-4 text-accent" />
                  Limites de Arquivos
                </CardTitle>
                <CardDescription className="text-xs">Tamanho máximo para uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tamanho Máximo por Arquivo (MB)</Label>
                  <Input
                    type="number"
                    value={config.max_file_size_mb}
                    onChange={(e) => updateConfig("max_file_size_mb", parseInt(e.target.value) || 10)}
                    min={1}
                    max={100}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cotas por Plano
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <span>Basic</span>
                      <Badge variant="outline">500 MB</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <span>Professional</span>
                      <Badge variant="outline">2 GB</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                      <span>Enterprise</span>
                      <Badge variant="outline">10 GB</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "backup":
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4 text-primary" />
                  Backup Automático
                </CardTitle>
                <CardDescription className="text-xs">Configurações de backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Backup Automático</Label>
                    <p className="text-xs text-muted-foreground">Criar backups periodicamente</p>
                  </div>
                  <Switch
                    checked={config.auto_backup_enabled}
                    onCheckedChange={(checked) => updateConfig("auto_backup_enabled", checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Frequência de Backup</Label>
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
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-accent" />
                  Retenção de Logs
                </CardTitle>
                <CardDescription className="text-xs">Período de armazenamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Retenção de Logs (dias)</Label>
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
        );

      default:
        return null;
    }
  };

  return (
    <PlatformLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Settings2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Configurações do Sistema
              </h1>
              <p className="text-muted-foreground text-sm">
                Gerencie as configurações globais da plataforma
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <SettingsSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            
            {/* Content Area */}
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0"
            >
              {renderContent()}
            </motion.div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
