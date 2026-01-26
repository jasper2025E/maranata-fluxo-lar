import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { Card, CardContent } from "@/components/ui/card";
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
  Sparkles, 
  Zap, 
  Bug, 
  Shield,
  Loader2,
  Calendar,
  Tag
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  content: string;
  type: string;
  is_major: boolean;
  published_at: string;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  feature: { label: "Nova Funcionalidade", icon: Sparkles, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  improvement: { label: "Melhoria", icon: Zap, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  fix: { label: "Correção", icon: Bug, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  security: { label: "Segurança", icon: Shield, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function PlatformChangelog() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    version: "",
    title: "",
    content: "",
    type: "feature",
    is_major: false,
  });

  const { data: changelog = [], isLoading } = useQuery({
    queryKey: ["platform-changelog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_changelog")
        .select("*")
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as ChangelogItem[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("platform_changelog").insert({
        version: data.version,
        title: data.title,
        content: data.content,
        type: data.type,
        is_major: data.is_major,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-changelog"] });
      toast.success("Release publicada");
      setIsDialogOpen(false);
      setFormData({
        version: "",
        title: "",
        content: "",
        type: "feature",
        is_major: false,
      });
    },
    onError: () => toast.error("Erro ao publicar release"),
  });

  const handleSubmit = () => {
    if (!formData.version.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  // Group by month
  const groupedByMonth = changelog.reduce((acc, item) => {
    const month = format(new Date(item.published_at), "MMMM yyyy", { locale: ptBR });
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<string, ChangelogItem[]>);

  return (
    <PlatformLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Changelog</h1>
            <p className="text-muted-foreground">Histórico de atualizações e releases</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Release
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Release</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Versão *</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="Ex: 2.1.0"
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
                </div>

                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Novo módulo de relatórios"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Descreva as mudanças desta release..."
                    rows={5}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Release Major</Label>
                    <p className="text-xs text-muted-foreground">Marque para destacar esta versão</p>
                  </div>
                  <Switch
                    checked={formData.is_major}
                    onCheckedChange={(v) => setFormData({ ...formData, is_major: v })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Publicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : changelog.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma release publicada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Publique a primeira release do sistema
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByMonth).map(([month, items]) => (
              <div key={month}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {month}
                </h2>
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const config = typeConfig[item.type] || typeConfig.feature;
                    const TypeIcon = config.icon;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={item.is_major ? "border-primary/50 bg-primary/5" : ""}>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${config.color} shrink-0`}>
                                <TypeIcon className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={item.is_major ? "default" : "secondary"} className="text-xs">
                                    v{item.version}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(item.published_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                  {item.content}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}
