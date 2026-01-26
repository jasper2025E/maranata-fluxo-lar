import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Plus, 
  Rocket, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ThumbsUp,
  Calendar,
  Sparkles,
  Bug,
  Zap,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  estimated_release: string | null;
  released_at: string | null;
  votes_count: number;
  is_public: boolean;
  release_notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  backlog: { label: "Backlog", color: "bg-muted text-muted-foreground", icon: Clock },
  planned: { label: "Planejado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Calendar },
  in_progress: { label: "Em Desenvolvimento", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Rocket },
  testing: { label: "Em Testes", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: AlertCircle },
  released: { label: "Lançado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
};

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  feature: { label: "Nova Funcionalidade", icon: Sparkles },
  improvement: { label: "Melhoria", icon: Zap },
  bug: { label: "Correção", icon: Bug },
  integration: { label: "Integração", icon: Rocket },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "text-muted-foreground" },
  medium: { label: "Média", color: "text-foreground" },
  high: { label: "Alta", color: "text-amber-600" },
  critical: { label: "Crítica", color: "text-destructive" },
};

export default function PlatformRoadmap() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "feature",
    status: "backlog",
    priority: "medium",
    estimated_release: "",
    is_public: true,
  });

  const { data: roadmapItems = [], isLoading } = useQuery({
    queryKey: ["platform-roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_roadmap")
        .select("*")
        .order("priority", { ascending: false })
        .order("votes_count", { ascending: false });

      if (error) throw error;
      return data as RoadmapItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("platform_roadmap").insert({
        title: data.title,
        description: data.description || null,
        category: data.category,
        status: data.status,
        priority: data.priority,
        estimated_release: data.estimated_release || null,
        is_public: data.is_public,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-roadmap"] });
      toast.success("Item adicionado ao roadmap");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao adicionar item"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from("platform_roadmap")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-roadmap"] });
      toast.success("Item atualizado");
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar item"),
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "feature",
      status: "backlog",
      priority: "medium",
      estimated_release: "",
      is_public: true,
    });
  };

  const openEditDialog = (item: RoadmapItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      category: item.category,
      status: item.status,
      priority: item.priority,
      estimated_release: item.estimated_release || "",
      is_public: item.is_public,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const groupedByStatus = roadmapItems.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, RoadmapItem[]>);

  return (
    <PlatformLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roadmap</h1>
            <p className="text-muted-foreground">Gerencie o backlog e planejamento de features</p>
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
                Nova Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Nova Feature"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Integração com WhatsApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes sobre a funcionalidade..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Previsão</Label>
                    <Input
                      type="date"
                      value={formData.estimated_release}
                      onChange={(e) => setFormData({ ...formData, estimated_release: e.target.value })}
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
                    {editingItem ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Object.entries(statusConfig).map(([status, config]) => {
              const items = groupedByStatus[status] || [];
              const StatusIcon = config.icon;

              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{config.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {items.length}
                    </Badge>
                  </div>

                  <div className="space-y-2 min-h-[200px]">
                    {items.map((item, index) => {
                      const CategoryIcon = categoryConfig[item.category]?.icon || Sparkles;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => openEditDialog(item)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start gap-2">
                                <CategoryIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${priorityConfig[item.priority]?.color}`}>
                                  {priorityConfig[item.priority]?.label}
                                </span>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span className="text-xs">{item.votes_count}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
