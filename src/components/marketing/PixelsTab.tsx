import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Zap } from "lucide-react";
import { useMarketingPixels, useDeletePixel, useUpdatePixel } from "@/hooks/useMarketing";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PixelDialog } from "./PixelDialog";
import { PixelEventsDialog } from "./PixelEventsDialog";
import type { MarketingPixel } from "@/hooks/useMarketing";

const pixelTypeConfig: Record<string, { label: string; color: string }> = {
  meta: { label: "Meta (Facebook)", color: "bg-blue-500" },
  google_ads: { label: "Google Ads", color: "bg-yellow-500" },
  google_analytics: { label: "Google Analytics", color: "bg-orange-500" },
  tiktok: { label: "TikTok", color: "bg-pink-500" },
  custom: { label: "Customizado", color: "bg-gray-500" },
};

export function PixelsTab() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventsDialogOpen, setEventsDialogOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<MarketingPixel | null>(null);
  const [selectedPixel, setSelectedPixel] = useState<MarketingPixel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: pixels, isLoading } = useMarketingPixels();
  const deleteMutation = useDeletePixel();
  const updateMutation = useUpdatePixel();

  const filteredPixels = pixels?.filter(pixel =>
    pixel.nome.toLowerCase().includes(search.toLowerCase()) ||
    pixel.pixel_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (pixel: MarketingPixel) => {
    setEditingPixel(pixel);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (pixel: MarketingPixel) => {
    await updateMutation.mutateAsync({
      id: pixel.id,
      ativo: !pixel.ativo,
    });
  };

  const handleOpenEvents = (pixel: MarketingPixel) => {
    setSelectedPixel(pixel);
    setEventsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pixels de Rastreamento</CardTitle>
              <CardDescription>
                Gerencie seus pixels e eventos de conversão
              </CardDescription>
            </div>
            <Button onClick={() => { setEditingPixel(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Pixel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pixels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPixels?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? "Nenhum pixel encontrado" : "Nenhum pixel criado ainda"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>ID do Pixel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPixels?.map((pixel) => (
                    <TableRow key={pixel.id}>
                      <TableCell className="font-medium">{pixel.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <span className={`w-2 h-2 rounded-full ${pixelTypeConfig[pixel.tipo]?.color || 'bg-gray-500'}`} />
                          {pixelTypeConfig[pixel.tipo]?.label || pixel.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {pixel.pixel_id}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={pixel.ativo}
                          onCheckedChange={() => handleToggleActive(pixel)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(pixel.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(pixel)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEvents(pixel)}>
                              <Zap className="mr-2 h-4 w-4" />
                              Eventos
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(pixel.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PixelDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        pixel={editingPixel}
      />

      <PixelEventsDialog
        open={eventsDialogOpen}
        onOpenChange={setEventsDialogOpen}
        pixel={selectedPixel}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pixel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pixel e todos os eventos associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
