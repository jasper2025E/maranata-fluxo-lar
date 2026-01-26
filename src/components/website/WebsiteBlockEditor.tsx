import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, GripVertical, Trash2, Settings, Eye, EyeOff, ChevronUp, ChevronDown,
  Sparkles, Type, Grid3x3, Images, Quote, HelpCircle, Play, MousePointerClick,
  CreditCard, Phone, MapPin, GitBranch, Users, BarChart, Megaphone, Minus, FileEdit
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  usePageBlocks, 
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useReorderBlocks,
  blockLibrary, 
  WebsiteBlock,
  BlockType,
  BlockDefinition
} from "@/hooks/useWebsiteBuilder";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Type, Grid3x3, Images, Quote, HelpCircle, Play, MousePointerClick,
  CreditCard, Phone, MapPin, GitBranch, Users, BarChart, Megaphone, Minus, FileEdit
};

interface WebsiteBlockEditorProps {
  pageId: string;
  primaryColor: string;
}

export function WebsiteBlockEditor({ pageId, primaryColor }: WebsiteBlockEditorProps) {
  const { data: blocks = [], isLoading } = usePageBlocks(pageId);
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();
  const reorderBlocks = useReorderBlocks();

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<WebsiteBlock | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Todos" },
    { id: "layout", label: "Layout" },
    { id: "content", label: "Conteúdo" },
    { id: "media", label: "Mídia" },
    { id: "forms", label: "Formulários" },
  ];

  const filteredBlocks = selectedCategory === "all"
    ? blockLibrary
    : blockLibrary.filter(b => b.category === selectedCategory);

  const handleAddBlock = (blockType: BlockType) => {
    createBlock.mutate({ pageId, blockType }, {
      onSuccess: () => setIsAddBlockOpen(false),
    });
  };

  const handleToggleVisibility = (block: WebsiteBlock) => {
    updateBlock.mutate({
      blockId: block.id,
      pageId,
      updates: { is_visible: !block.is_visible },
    });
  };

  const handleMoveBlock = (block: WebsiteBlock, direction: "up" | "down") => {
    const currentIndex = blocks.findIndex(b => b.id === block.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[currentIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[currentIndex]];

    reorderBlocks.mutate({
      pageId,
      blocks: newBlocks.map((b, i) => ({ id: b.id, order: i })),
    });
  };

  const handleDelete = () => {
    if (!blockToDelete) return;
    deleteBlock.mutate({ blockId: blockToDelete.id, pageId }, {
      onSuccess: () => setBlockToDelete(null),
    });
  };

  const getBlockDefinition = (blockType: string): BlockDefinition | undefined => {
    return blockLibrary.find(b => b.type === blockType);
  };

  const getBlockIcon = (iconName: string) => {
    return iconMap[iconName] || Sparkles;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando blocos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Blocks List */}
      {blocks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Página vazia</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione blocos para construir sua página
            </p>
            <Button onClick={() => setIsAddBlockOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro bloco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const definition = getBlockDefinition(block.block_type);
            const Icon = definition ? getBlockIcon(definition.icon) : Sparkles;

            return (
              <Card 
                key={block.id}
                className={cn(
                  "transition-all",
                  !block.is_visible && "opacity-50"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div className="cursor-move p-1 hover:bg-muted rounded">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Block Info */}
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `hsl(${primaryColor} / 0.1)` }}
                    >
                      <Icon 
                        className="h-4 w-4" 
                        style={{ color: `hsl(${primaryColor})` }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {definition?.name || block.block_type}
                        </span>
                        {!block.is_visible && (
                          <Badge variant="outline" className="text-[10px]">
                            Oculto
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {definition?.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveBlock(block, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveBlock(block, "down")}
                        disabled={index === blocks.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleVisibility(block)}
                      >
                        {block.is_visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setBlockToDelete(block)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Block Button */}
      {blocks.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full border-dashed"
          onClick={() => setIsAddBlockOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar bloco
        </Button>
      )}

      {/* Add Block Dialog */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Bloco</DialogTitle>
            <DialogDescription>
              Escolha um bloco para adicionar à página
            </DialogDescription>
          </DialogHeader>

          {/* Category Filter */}
          <div className="flex gap-1 border-b pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Blocks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 py-4">
            {filteredBlocks.map((block) => {
              const Icon = getBlockIcon(block.icon);
              return (
                <button
                  key={block.type}
                  type="button"
                  onClick={() => handleAddBlock(block.type)}
                  disabled={createBlock.isPending}
                  className="p-4 rounded-lg border bg-background text-left hover:border-primary hover:shadow-sm transition-all group"
                >
                  <div 
                    className="p-2 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `hsl(${primaryColor} / 0.1)` }}
                  >
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: `hsl(${primaryColor})` }}
                    />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{block.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {block.description}
                  </p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!blockToDelete} onOpenChange={() => setBlockToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover bloco?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O bloco e seu conteúdo serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
