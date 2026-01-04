import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { MapPin, Plus, Edit, Trash2, MapPinned, Navigation } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success('Localização obtida!');
        setIsGettingLocation(false);
      },
      () => {
        toast.error('Erro ao obter localização');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            Locais Autorizados para Ponto
          </CardTitle>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Local
          </Button>
        </CardHeader>
        <CardContent>
          {pontos?.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Nenhum local cadastrado"
              description="Cadastre locais autorizados para controle de geolocalização do ponto. Sem locais cadastrados, qualquer localização será aceita."
            />
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Coordenadas</TableHead>
                    <TableHead className="text-center">Raio</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pontos?.map((ponto) => (
                    <TableRow key={ponto.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {ponto.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {ponto.latitude.toFixed(4)}, {ponto.longitude.toFixed(4)}
                        </code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{ponto.raio_metros}m</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={ponto.ativo ? "default" : "secondary"}>
                          {ponto.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDialog(ponto)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(ponto.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pontos?.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                ⚠️ <strong>Atenção:</strong> Sem locais cadastrados, os funcionários poderão bater ponto de qualquer localização. 
                Cadastre ao menos um local para ativar a validação de geolocalização.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPonto ? 'Editar Local' : 'Novo Local Autorizado'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Local *</Label>
              <Input
                id="nome"
                placeholder="Ex: Escola Principal"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  placeholder="-46.6333"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
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
              />
              <p className="text-xs text-muted-foreground">
                Funcionários dentro deste raio poderão bater ponto.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ativo">Local Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
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
