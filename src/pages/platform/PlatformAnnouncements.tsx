import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Plus, 
  Megaphone, 
  AlertTriangle, 
  Info, 
  Wrench,
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Trash2,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  active: boolean;
  show_banner: boolean;
  show_on_login: boolean;
  show_on_landing: boolean;
  starts_at: string | null;
  ends_at: string | null;
  target_plans: string[];
  target_status: string[];
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  info: { label: "Informativo", icon: Info, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  warning: { label: "Aviso", icon: AlertTriangle, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  urgent: { label: "Urgente", icon: Megaphone, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  maintenance: { label: "Manutenção", icon: Wrench, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

export default function PlatformAnnouncements() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    active: true,
    show_banner: false,
    show_on_login: true,
    show_on_landing: false,
    starts_at: "",
    ends_at: "",
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["platform-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("platform_announcements").insert({
        title: data.title,
        message: data.message,
        type: data.type,
        active: data.active,
        show_banner: data.show_banner,
        show_on_login: data.show_on_login,
        show_on_landing: data.show_on_landing,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      toast.success("Comunicado criado com sucesso");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao criar comunicado"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from("platform_announcements")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      toast.success("Comunicado atualizado");
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar comunicado"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
      toast.success("Comunicado removido");
    },
    onError: () => toast.error("Erro ao remover comunicado"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("platform_announcements")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-announcements"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      active: true,
      show_banner: false,
      show_on_login: true,
      show_on_landing: false,
      starts_at: "",
      ends_at: "",
    });
  };

  const openEditDialog = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      message: item.message,
      type: item.type,
      active: item.active,
      show_banner: item.show_banner || false,
      show_on_login: item.show_on_login,
      show_on_landing: item.show_on_landing,
      starts_at: item.starts_at ? item.starts_at.split("T")[0] : "",
      ends_at: item.ends_at ? item.ends_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <PlatformLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comunicados</h1>
            <p className="text-muted-foreground">Envie avisos e notificações para todas as escolas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingItem(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Comunicado" : "Novo Comunicado"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Manutenção programada"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem *</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Conteúdo do comunicado..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Término</Label>
                    <Input
                      type="date"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Exibir no login</Label>
                    <Switch
                      checked={formData.show_on_login}
                      onCheckedChange={(v) => setFormData({ ...formData, show_on_login: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exibir como banner</Label>
                    <Switch
                      checked={formData.show_banner}
                      onCheckedChange={(v) => setFormData({ ...formData, show_banner: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Ativo</Label>
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(v) => setFormData({ ...formData, active: v })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingItem ? "Salvar" : "Publicar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum comunicado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um comunicado para notificar as escolas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, index) => {
              const config = typeConfig[announcement.type] || typeConfig.info;
              const TypeIcon = config.icon;

              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={!announcement.active ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{announcement.title}</h3>
                            <Badge variant={announcement.active ? "default" : "secondary"} className="text-xs">
                              {announcement.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{announcement.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(announcement.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {announcement.show_on_login && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Login
                              </span>
                            )}
                            {announcement.show_banner && (
                              <span className="flex items-center gap-1">
                                <Megaphone className="h-3 w-3" />
                                Banner
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={announcement.active}
                            onCheckedChange={(active) => toggleActiveMutation.mutate({ id: announcement.id, active })}
                          />
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(announcement)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
