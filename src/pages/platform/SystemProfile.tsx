import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building2, 
  Save, 
  Camera,
  Loader2,
  Palette,
  Image,
  Type,
  Eye
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
import { toast } from "sonner";
import { GradientBackground } from "@/components/landing/GradientBackground";

interface SystemData {
  platform_name: string;
  platform_logo: string;
  landing_hero_title: string;
  landing_hero_subtitle: string;
  landing_cta_primary: string;
  landing_cta_secondary: string;
  login_title: string;
  login_subtitle: string;
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
  favicon_url: string;
  meta_title: string;
  meta_description: string;
}

const defaultData: SystemData = {
  platform_name: "Sistema de Gestão",
  platform_logo: "",
  landing_hero_title: "Gerencie sua escola com simplicidade",
  landing_hero_subtitle: "Plataforma completa para gestão escolar. Alunos, financeiro, RH e muito mais em um só lugar.",
  landing_cta_primary: "Entrar na Plataforma",
  landing_cta_secondary: "Cadastre sua escola",
  login_title: "Acesse sua conta",
  login_subtitle: "Entre com seu email e senha para continuar",
  gradient_from: "262 83% 58%",
  gradient_via: "292 84% 61%",
  gradient_to: "24 95% 53%",
  favicon_url: "",
  meta_title: "",
  meta_description: "",
};

export default function SystemProfile() {
  const { isPlatformAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("identidade");
  const [data, setData] = useState<SystemData>(defaultData);
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
        const loaded: Partial<SystemData> = {};
        settings.forEach((row) => {
          const val = row.value as { value: unknown } | null;
          if (val && typeof val === "object" && "value" in val) {
            (loaded as Record<string, unknown>)[row.key] = val.value;
          }
        });
        setData({ ...defaultData, ...loaded } as SystemData);
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
      const entries = Object.entries(data);
      
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

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
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
      setData(prev => ({ ...prev, platform_logo: logoUrl }));

      // Save immediately
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

  const getInitials = (name: string) => {
    if (!name) return "SG";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!isPlatformAdmin()) {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Perfil do Sistema
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure a identidade visual e textos da plataforma
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identidade" className="gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Identidade</span>
              </TabsTrigger>
              <TabsTrigger value="cores" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="textos" className="gap-2">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Textos</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
            </TabsList>

            {/* Identity Tab */}
            <TabsContent value="identidade" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Logo Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Logo do Sistema</CardTitle>
                      <CardDescription>Imagem principal da plataforma</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                          <Avatar className="h-28 w-28 ring-4 ring-primary/20">
                            {data.platform_logo ? (
                              <AvatarImage src={data.platform_logo} alt="Logo" />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">
                              {getInitials(data.platform_name)}
                            </AvatarFallback>
                          </Avatar>
                          <label 
                            htmlFor="logo-upload"
                            className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
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
                          JPG, PNG, WEBP ou SVG • Máx 2MB
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Platform Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="md:col-span-2"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Informações do Sistema</CardTitle>
                      <CardDescription>Nome e metadados da plataforma</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome da Plataforma</Label>
                        <Input
                          value={data.platform_name}
                          onChange={(e) => setData({ ...data, platform_name: e.target.value })}
                          placeholder="Ex: Meu Sistema de Gestão"
                        />
                        <p className="text-xs text-muted-foreground">
                          Exibido no cabeçalho e nos emails do sistema
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Título SEO (Meta Title)</Label>
                          <Input
                            value={data.meta_title}
                            onChange={(e) => setData({ ...data, meta_title: e.target.value })}
                            placeholder="Sistema de Gestão Escolar"
                            maxLength={60}
                          />
                          <p className="text-xs text-muted-foreground">{data.meta_title.length}/60</p>
                        </div>
                        <div className="space-y-2">
                          <Label>URL do Favicon</Label>
                          <Input
                            value={data.favicon_url}
                            onChange={(e) => setData({ ...data, favicon_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição SEO (Meta Description)</Label>
                        <Textarea
                          value={data.meta_description}
                          onChange={(e) => setData({ ...data, meta_description: e.target.value })}
                          placeholder="Plataforma completa para gestão de escolas..."
                          rows={2}
                          maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground">{data.meta_description.length}/160</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="cores" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Cores do Gradiente
                      </CardTitle>
                      <CardDescription>
                        Configure as cores do fundo das páginas de login e cadastro
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Cor Inicial (HSL)</Label>
                        <Input
                          value={data.gradient_from}
                          onChange={(e) => setData({ ...data, gradient_from: e.target.value })}
                          placeholder="262 83% 58%"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formato: H S% L% (ex: 262 83% 58% para violeta)
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Cor do Meio (HSL)</Label>
                        <Input
                          value={data.gradient_via}
                          onChange={(e) => setData({ ...data, gradient_via: e.target.value })}
                          placeholder="292 84% 61%"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor Final (HSL)</Label>
                        <Input
                          value={data.gradient_to}
                          onChange={(e) => setData({ ...data, gradient_to: e.target.value })}
                          placeholder="24 95% 53%"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Pré-visualização</CardTitle>
                      <CardDescription>Veja como ficará o gradiente</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <GradientBackground
                          gradientFrom={data.gradient_from}
                          gradientVia={data.gradient_via}
                          gradientTo={data.gradient_to}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/95 rounded-lg p-6 shadow-xl text-center">
                            {data.platform_logo ? (
                              <img 
                                src={data.platform_logo} 
                                alt="Logo" 
                                className="h-12 w-12 rounded-lg mx-auto mb-2 object-contain"
                              />
                            ) : null}
                            <p className="text-sm font-medium text-gray-900">
                              {data.platform_name || "Sua Plataforma"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Texts Tab */}
            <TabsContent value="textos" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Página Inicial</CardTitle>
                      <CardDescription>Textos exibidos na tela de apresentação</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título Principal</Label>
                        <Input
                          value={data.landing_hero_title}
                          onChange={(e) => setData({ ...data, landing_hero_title: e.target.value })}
                          placeholder="Gerencie sua escola com simplicidade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtítulo</Label>
                        <Textarea
                          value={data.landing_hero_subtitle}
                          onChange={(e) => setData({ ...data, landing_hero_subtitle: e.target.value })}
                          placeholder="Plataforma completa para gestão escolar..."
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Botão Primário</Label>
                          <Input
                            value={data.landing_cta_primary}
                            onChange={(e) => setData({ ...data, landing_cta_primary: e.target.value })}
                            placeholder="Entrar na Plataforma"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Link Secundário</Label>
                          <Input
                            value={data.landing_cta_secondary}
                            onChange={(e) => setData({ ...data, landing_cta_secondary: e.target.value })}
                            placeholder="Cadastre sua escola"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Tela de Login</CardTitle>
                      <CardDescription>Textos exibidos no formulário de acesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título do Login</Label>
                        <Input
                          value={data.login_title}
                          onChange={(e) => setData({ ...data, login_title: e.target.value })}
                          placeholder="Acesse sua conta"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtítulo do Login</Label>
                        <Input
                          value={data.login_subtitle}
                          onChange={(e) => setData({ ...data, login_subtitle: e.target.value })}
                          placeholder="Entre com seu email e senha"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pré-visualização Completa</CardTitle>
                    <CardDescription>Veja como ficará a tela de acesso</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-96 rounded-lg overflow-hidden">
                      <GradientBackground
                        gradientFrom={data.gradient_from}
                        gradientVia={data.gradient_via}
                        gradientTo={data.gradient_to}
                      />
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full">
                          <div className="text-center space-y-4">
                            {data.platform_logo ? (
                              <img 
                                src={data.platform_logo} 
                                alt="Logo" 
                                className="h-16 w-16 rounded-xl mx-auto object-contain"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 mx-auto flex items-center justify-center text-primary-foreground font-bold text-xl">
                                {getInitials(data.platform_name)}
                              </div>
                            )}
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">
                                {data.login_title || "Acesse sua conta"}
                              </h2>
                              <p className="text-sm text-gray-600 mt-1">
                                {data.login_subtitle || "Entre com seu email e senha"}
                              </p>
                            </div>
                            <div className="space-y-3">
                              <div className="h-10 bg-gray-100 rounded-lg" />
                              <div className="h-10 bg-gray-100 rounded-lg" />
                              <div className="h-10 bg-primary rounded-lg" />
                            </div>
                            <p className="text-xs text-gray-500">
                              © {new Date().getFullYear()} {data.platform_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PlatformLayout>
  );
}
