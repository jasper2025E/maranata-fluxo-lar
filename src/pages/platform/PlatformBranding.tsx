import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Save, Palette, Type, Image, Bell, Plus, Trash2, Eye, Pencil } from "lucide-react";
import { GradientBackground } from "@/components/landing/GradientBackground";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SettingRow {
  key: string;
  value: { value: unknown };
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  link_text: string | null;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  show_on_login: boolean;
  show_on_landing: boolean;
  created_at: string;
}

export default function PlatformBranding() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("visual");

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");
      if (error) throw error;

      const result: Record<string, unknown> = {};
      (data as SettingRow[]).forEach((row) => {
        if (row.value && typeof row.value === "object" && "value" in row.value) {
          result[row.key] = row.value.value;
        }
      });
      return result;
    },
  });

  // Form state
  const [form, setForm] = useState({
    platform_name: "",
    landing_hero_title: "",
    landing_hero_subtitle: "",
    landing_cta_primary: "",
    landing_cta_secondary: "",
    login_title: "",
    login_subtitle: "",
    gradient_from: "262 83% 58%",
    gradient_via: "292 84% 61%",
    gradient_to: "24 95% 53%",
    favicon_url: "",
    meta_title: "",
    meta_description: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        platform_name: (settings.platform_name as string) || "",
        landing_hero_title: (settings.landing_hero_title as string) || "",
        landing_hero_subtitle: (settings.landing_hero_subtitle as string) || "",
        landing_cta_primary: (settings.landing_cta_primary as string) || "",
        landing_cta_secondary: (settings.landing_cta_secondary as string) || "",
        login_title: (settings.login_title as string) || "",
        login_subtitle: (settings.login_subtitle as string) || "",
        gradient_from: (settings.gradient_from as string) || "262 83% 58%",
        gradient_via: (settings.gradient_via as string) || "292 84% 61%",
        gradient_to: (settings.gradient_to as string) || "24 95% 53%",
        favicon_url: (settings.favicon_url as string) || "",
        meta_title: (settings.meta_title as string) || "",
        meta_description: (settings.meta_description as string) || "",
      });
    }
  }, [settings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(form).map(([key, value]) => ({
        key,
        value: { value },
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
      queryClient.invalidateQueries({ queryKey: ["platform-branding"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  // Announcements query
  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ["platform-announcements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Announcement form state
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info",
    link_url: "",
    link_text: "",
    active: true,
    show_on_login: true,
    show_on_landing: true,
  });

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      message: "",
      type: "info",
      link_url: "",
      link_text: "",
      active: true,
      show_on_login: true,
      show_on_landing: true,
    });
    setEditingAnnouncement(null);
  };

  const saveAnnouncementMutation = useMutation({
    mutationFn: async () => {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from("platform_announcements")
          .update({
            title: announcementForm.title,
            message: announcementForm.message,
            type: announcementForm.type,
            link_url: announcementForm.link_url || null,
            link_text: announcementForm.link_text || null,
            active: announcementForm.active,
            show_on_login: announcementForm.show_on_login,
            show_on_landing: announcementForm.show_on_landing,
          })
          .eq("id", editingAnnouncement.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_announcements").insert({
          title: announcementForm.title,
          message: announcementForm.message,
          type: announcementForm.type,
          link_url: announcementForm.link_url || null,
          link_text: announcementForm.link_text || null,
          active: announcementForm.active,
          show_on_login: announcementForm.show_on_login,
          show_on_landing: announcementForm.show_on_landing,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      toast.success(editingAnnouncement ? "Anúncio atualizado!" : "Anúncio criado!");
      setAnnouncementDialog(false);
      resetAnnouncementForm();
    },
    onError: (error) => {
      console.error("Error saving announcement:", error);
      toast.error("Erro ao salvar anúncio");
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      toast.success("Anúncio removido");
    },
    onError: () => {
      toast.error("Erro ao remover anúncio");
    },
  });

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Personalização</h1>
            <p className="text-muted-foreground">Configure a aparência da tela de login e página inicial</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visual" className="gap-2">
              <Palette className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="textos" className="gap-2">
              <Type className="h-4 w-4" />
              Textos
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Image className="h-4 w-4" />
              SEO & Favicon
            </TabsTrigger>
            <TabsTrigger value="anuncios" className="gap-2">
              <Bell className="h-4 w-4" />
              Anúncios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cores do Gradiente</CardTitle>
                  <CardDescription>Configure as cores do fundo das páginas de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cor Inicial (HSL)</Label>
                    <Input
                      value={form.gradient_from}
                      onChange={(e) => setForm({ ...form, gradient_from: e.target.value })}
                      placeholder="262 83% 58%"
                    />
                    <p className="text-xs text-muted-foreground">Formato: H S% L% (ex: 262 83% 58% para violeta)</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Meio (HSL)</Label>
                    <Input
                      value={form.gradient_via}
                      onChange={(e) => setForm({ ...form, gradient_via: e.target.value })}
                      placeholder="292 84% 61%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor Final (HSL)</Label>
                    <Input
                      value={form.gradient_to}
                      onChange={(e) => setForm({ ...form, gradient_to: e.target.value })}
                      placeholder="24 95% 53%"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pré-visualização</CardTitle>
                  <CardDescription>Veja como ficará o gradiente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-48 rounded-lg overflow-hidden">
                    <GradientBackground
                      gradientFrom={form.gradient_from}
                      gradientVia={form.gradient_via}
                      gradientTo={form.gradient_to}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/95 rounded-lg p-6 shadow-xl">
                        <p className="text-sm font-medium text-gray-900">{form.platform_name || "Sua Plataforma"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="textos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Página Inicial</CardTitle>
                  <CardDescription>Textos exibidos na tela de apresentação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Plataforma</Label>
                    <Input
                      value={form.platform_name}
                      onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                      placeholder="Sistema de Gestão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Título Principal</Label>
                    <Input
                      value={form.landing_hero_title}
                      onChange={(e) => setForm({ ...form, landing_hero_title: e.target.value })}
                      placeholder="Gerencie sua escola com simplicidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Textarea
                      value={form.landing_hero_subtitle}
                      onChange={(e) => setForm({ ...form, landing_hero_subtitle: e.target.value })}
                      placeholder="Plataforma completa para gestão escolar..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Botão Primário</Label>
                      <Input
                        value={form.landing_cta_primary}
                        onChange={(e) => setForm({ ...form, landing_cta_primary: e.target.value })}
                        placeholder="Entrar na Plataforma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link Secundário</Label>
                      <Input
                        value={form.landing_cta_secondary}
                        onChange={(e) => setForm({ ...form, landing_cta_secondary: e.target.value })}
                        placeholder="Cadastre sua escola"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tela de Login</CardTitle>
                  <CardDescription>Textos exibidos no formulário de acesso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título do Login</Label>
                    <Input
                      value={form.login_title}
                      onChange={(e) => setForm({ ...form, login_title: e.target.value })}
                      placeholder="Acesse sua conta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo do Login</Label>
                    <Input
                      value={form.login_subtitle}
                      onChange={(e) => setForm({ ...form, login_subtitle: e.target.value })}
                      placeholder="Entre com seu email e senha"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO e Metadados</CardTitle>
                <CardDescription>Configure as informações exibidas nos buscadores e redes sociais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Favicon</Label>
                  <Input
                    value={form.favicon_url}
                    onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para usar o favicon padrão</p>
                </div>
                <div className="space-y-2">
                  <Label>Título da Página (Meta Title)</Label>
                  <Input
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    placeholder="Sistema de Gestão Escolar"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{form.meta_title.length}/60 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label>Descrição (Meta Description)</Label>
                  <Textarea
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    placeholder="Plataforma completa para gestão de escolas..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{form.meta_description.length}/160 caracteres</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anuncios" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mensagens Dinâmicas</CardTitle>
                  <CardDescription>Anúncios exibidos nas telas de login e apresentação</CardDescription>
                </div>
                <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => resetAnnouncementForm()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Anúncio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingAnnouncement ? "Editar Anúncio" : "Novo Anúncio"}</DialogTitle>
                      <DialogDescription>Configure a mensagem que será exibida para os usuários</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="Novidade!"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                          value={announcementForm.message}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                          placeholder="Confira nossa nova funcionalidade..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={announcementForm.type}
                            onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Informação</SelectItem>
                              <SelectItem value="warning">Aviso</SelectItem>
                              <SelectItem value="success">Sucesso</SelectItem>
                              <SelectItem value="promo">Promoção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <div className="flex items-center gap-2 pt-2">
                            <Switch
                              checked={announcementForm.active}
                              onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, active: checked })}
                            />
                            <span className="text-sm">{announcementForm.active ? "Ativo" : "Inativo"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>URL do Link (opcional)</Label>
                          <Input
                            value={announcementForm.link_url}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, link_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Texto do Link</Label>
                          <Input
                            value={announcementForm.link_text}
                            onChange={(e) => setAnnouncementForm({ ...announcementForm, link_text: e.target.value })}
                            placeholder="Saiba mais"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={announcementForm.show_on_landing}
                            onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, show_on_landing: checked })}
                          />
                          <span className="text-sm">Página Inicial</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={announcementForm.show_on_login}
                            onCheckedChange={(checked) => setAnnouncementForm({ ...announcementForm, show_on_login: checked })}
                          />
                          <span className="text-sm">Tela de Login</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAnnouncementDialog(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => saveAnnouncementMutation.mutate()}
                        disabled={!announcementForm.title || !announcementForm.message || saveAnnouncementMutation.isPending}
                      >
                        {saveAnnouncementMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingAnnouncement ? "Salvar" : "Criar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingAnnouncements ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum anúncio cadastrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Exibição</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {announcements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-medium">{announcement.title}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                announcement.type === "info"
                                  ? "bg-blue-100 text-blue-700"
                                  : announcement.type === "warning"
                                  ? "bg-amber-100 text-amber-700"
                                  : announcement.type === "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {announcement.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {announcement.show_on_landing && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Inicial</span>
                              )}
                              {announcement.show_on_login && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Login</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                announcement.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {announcement.active ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(announcement.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingAnnouncement(announcement);
                                  setAnnouncementForm({
                                    title: announcement.title,
                                    message: announcement.message,
                                    type: announcement.type,
                                    link_url: announcement.link_url || "",
                                    link_text: announcement.link_text || "",
                                    active: announcement.active,
                                    show_on_login: announcement.show_on_login,
                                    show_on_landing: announcement.show_on_landing,
                                  });
                                  setAnnouncementDialog(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
