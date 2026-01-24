import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { MapPin, Plus, Pencil, Trash2, MapPinned, Navigation } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PontoAutorizado {
  id: string;
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
  ativo: boolean;
  created_at: string;
}

const queryKey = ['pontos_autorizados'];

export function PontosAutorizadosManager() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPonto, setEditingPonto] = useState<PontoAutorizado | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    latitude: '',
    longitude: '',
    raio_metros: '100',
    ativo: true,
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const queryClient = useQueryClient();

  const { data: pontos, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pontos_autorizados' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PontoAutorizado[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<PontoAutorizado, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('pontos_autorizados' as any).insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Local cadastrado com sucesso!');
      closeDialog();
    },
    onError: () => {
      toast.error('Erro ao cadastrar local');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PontoAutorizado> & { id: string }) => {
      const { error } = await supabase
        .from('pontos_autorizados' as any)
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Local atualizado com sucesso!');
      closeDialog();
    },
    onError: () => {
      toast.error('Erro ao atualizar local');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pontos_autorizados' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Local excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir local');
    },
  });

  const openDialog = (ponto?: PontoAutorizado) => {
    if (ponto) {
      setEditingPonto(ponto);
      setFormData({
        nome: ponto.nome,
        latitude: ponto.latitude.toString(),
        longitude: ponto.longitude.toString(),
        raio_metros: ponto.raio_metros.toString(),
        ativo: ponto.ativo,
      });
    } else {
      setEditingPonto(null);
      setFormData({
        nome: '',
        latitude: '',
        longitude: '',
        raio_metros: '100',
        ativo: true,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPonto(null);
    setFormData({
      nome: '',
      latitude: '',
      longitude: '',
      raio_metros: '100',
      ativo: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.latitude || !formData.longitude) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const data = {
      nome: formData.nome,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      raio_metros: parseInt(formData.raio_metros) || 100,
      ativo: formData.ativo,
    };

    if (editingPonto) {
      updateMutation.mutate({ id: editingPonto.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Obtendo localização... Permita o acesso quando solicitado.');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success(`Localização obtida!`);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permissão negada. Ative a localização nas configurações do navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Localização indisponível. Verifique se o GPS está ativado.');
            break;
          case error.TIMEOUT:
            toast.error('Tempo esgotado. Tente novamente.');
            break;
          default:
            toast.error('Erro ao obter localização. Tente novamente.');
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const addLocationWithCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Obtendo sua localização...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          nome: '',
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          raio_metros: '100',
          ativo: true,
        });
        setEditingPonto(null);
        setDialogOpen(true);
        toast.success('Localização obtida! Preencha o nome do local.');
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permissão negada.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Localização indisponível.');
            break;
          case error.TIMEOUT:
            toast.error('Tempo esgotado ao obter localização.');
            break;
          default:
            toast.error('Erro ao obter localização.');
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <MapPinned className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">Locais Autorizados para Ponto</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={addLocationWithCurrentPosition}
            disabled={isGettingLocation}
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Obtendo...' : 'Usar Minha Localização'}
          </Button>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Local
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Lista de Locais
          </CardTitle>
          <CardDescription>
            {pontos?.length || 0} local(is) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pontos?.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={MapPin}
                title="Nenhum local cadastrado"
                description="Sem locais cadastrados, qualquer localização será aceita."
              />
              <div className="mt-4 mx-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                  ⚠️ Cadastre ao menos um local para ativar a validação de geolocalização.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Nome</TableHead>
                  <TableHead className="font-semibold text-foreground">Coordenadas</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Raio</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
                  <TableHead className="text-right font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pontos?.map((ponto, index) => (
                  <motion.tr
                    key={ponto.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors border-b border-border/50"
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {ponto.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {ponto.latitude.toFixed(4)}, {ponto.longitude.toFixed(4)}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {ponto.raio_metros}m
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "font-medium",
                          ponto.ativo 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {ponto.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openDialog(ponto)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(ponto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingPonto ? 'Editar Local' : 'Novo Local Autorizado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Local *</Label>
              <Input
                id="nome"
                placeholder="Ex: Escola Principal"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  placeholder="-23.5505"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="-46.6333"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? 'Obtendo localização...' : 'Usar Minha Localização Atual'}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="raio">Raio de Tolerância (metros)</Label>
              <Input
                id="raio"
                type="number"
                placeholder="100"
                value={formData.raio_metros}
                onChange={(e) => setFormData(prev => ({ ...prev, raio_metros: e.target.value }))}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Funcionários dentro deste raio poderão bater ponto.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="ativo">Local Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingPonto ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
