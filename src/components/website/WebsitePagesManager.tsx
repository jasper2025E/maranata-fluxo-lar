import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, FileText, Home, Trash2, Edit2, MoreHorizontal, Eye, EyeOff,
  ExternalLink, Globe
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { 
  useWebsitePages, 
  useCreatePage, 
  useUpdatePage, 
  useDeletePage,
  WebsitePage 
} from "@/hooks/useWebsiteBuilder";
import { cn } from "@/lib/utils";

interface WebsitePagesManagerProps {
  config: SchoolWebsiteConfig;
  onEditPage: (page: WebsitePage) => void;
}

export function WebsitePagesManager({ config, onEditPage }: WebsitePagesManagerProps) {
  const { data: pages = [], isLoading } = useWebsitePages(config.id);
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [pageToDelete, setPageToDelete] = useState<WebsitePage | null>(null);

  const handleCreatePage = () => {
    if (!newPageTitle.trim()) return;
    
    const slug = newPageSlug || newPageTitle.toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    createPage.mutate({
      websiteId: config.id,
      title: newPageTitle,
      slug,
      isHomepage: pages.length === 0,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPageTitle("");
        setNewPageSlug("");
      }
    });
  };

  const handleTogglePublish = (page: WebsitePage) => {
    updatePage.mutate({
      pageId: page.id,
      websiteId: config.id,
      updates: { is_published: !page.is_published },
    });
  };

  const handleDelete = () => {
    if (!pageToDelete) return;
    deletePage.mutate({
      pageId: pageToDelete.id,
      websiteId: config.id,
    }, {
      onSuccess: () => setPageToDelete(null),
    });
  };

  const baseUrl = window.location.origin;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Globe className="h-4 w-4" />
              Páginas
            </CardTitle>
            <CardDescription className="text-sm">
              Gerencie as páginas do seu site
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Página
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Página</DialogTitle>
                <DialogDescription>
                  Crie uma nova página para seu site
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título da Página</Label>
                  <Input
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Ex: Sobre Nós"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL (slug)</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      /escola/{config.slug}/
                    </span>
                    <Input
                      value={newPageSlug}
                      onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="sobre-nos"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePage} disabled={createPage.isPending}>
                  {createPage.isPending ? "Criando..." : "Criar Página"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              Nenhuma página criada ainda
            </p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Criar primeira página
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors",
                  !page.is_published && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-muted">
                    {page.is_homepage ? (
                      <Home className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{page.title}</span>
                      {page.is_homepage && (
                        <Badge variant="secondary" className="text-[10px]">
                          Home
                        </Badge>
                      )}
                      {!page.is_published && (
                        <Badge variant="outline" className="text-[10px]">
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      /{page.slug}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditPage(page)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  {page.is_published && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a 
                        href={`${baseUrl}/escola/${config.slug}/${page.is_homepage ? '' : page.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTogglePublish(page)}>
                        {page.is_published ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      {!page.is_homepage && (
                        <DropdownMenuItem 
                          onClick={() => setPageToDelete(page)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog open={!!pageToDelete} onOpenChange={() => setPageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{pageToDelete?.title}"? 
              Esta ação não pode ser desfeita e todos os blocos da página serão perdidos.
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
    </Card>
  );
}
