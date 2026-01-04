import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Download, Loader2, File, Image, FileIcon, Eye, X, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

interface DocumentosUploadProps {
  funcionarioId: string;
}

interface Documento {
  id: string;
  nome: string;
  tipo: string | null;
  url: string;
  created_at: string;
}

const getFileIcon = (tipo: string | null) => {
  if (!tipo) return <File className="h-5 w-5" />;
  if (tipo.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (tipo.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  return <FileIcon className="h-5 w-5 text-gray-500" />;
};

const isImage = (tipo: string | null) => tipo?.startsWith('image/');
const isPDF = (tipo: string | null) => tipo?.includes('pdf');

export function DocumentosUpload({ funcionarioId }: DocumentosUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documentos, isLoading } = useQuery({
    queryKey: ['funcionario-documentos', funcionarioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionario_documentos')
        .select('*')
        .eq('funcionario_id', funcionarioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Documento[];
    },
    enabled: !!funcionarioId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: Documento) => {
      // Extract file path from URL
      const urlParts = doc.url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      // Delete from storage
      await supabase.storage.from('rh-documentos').remove([filePath]);
      
      // Delete from database
      const { error } = await supabase
        .from('funcionario_documentos')
        .delete()
        .eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionario-documentos', funcionarioId] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir documento');
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: arquivo deve ter no máximo 10MB`);
          continue;
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `documentos/${funcionarioId}/${Date.now()}-${file.name}`;

        const { data, error } = await supabase.storage
          .from('rh-documentos')
          .upload(fileName, file);

        if (error) {
          toast.error(`Erro ao enviar ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('rh-documentos')
          .getPublicUrl(data.path);

        // Save to database
        const { error: dbError } = await supabase
          .from('funcionario_documentos')
          .insert({
            funcionario_id: funcionarioId,
            nome: file.name,
            tipo: file.type,
            url: urlData.publicUrl,
          });

        if (dbError) {
          toast.error(`Erro ao salvar ${file.name}`);
          continue;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['funcionario-documentos', funcionarioId] });
      toast.success('Documentos enviados com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documentos');
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const canPreview = (doc: Documento) => isImage(doc.tipo) || isPDF(doc.tipo);

  const handlePreview = (doc: Documento) => {
    setImageZoom(1);
    setPreviewDoc(doc);
  };

  const zoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.5));

  return (
    <>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos
        </CardTitle>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !documentos || documentos.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum documento"
            description="Envie documentos do funcionário"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.tipo)}
                      <span className="font-medium">{doc.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {doc.tipo?.split('/')[1]?.toUpperCase() || 'ARQUIVO'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canPreview(doc) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(doc)}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.url, '_blank')}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir "{doc.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(doc)}
                              disabled={deleteMutation.isPending}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    {/* Modal de Visualização */}
    <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-base">
            {previewDoc && getFileIcon(previewDoc.tipo)}
            {previewDoc?.nome}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {previewDoc && isImage(previewDoc.tipo) && (
              <>
                <Button variant="ghost" size="icon" onClick={zoomOut} disabled={imageZoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-12 text-center">
                  {Math.round(imageZoom * 100)}%
                </span>
                <Button variant="ghost" size="icon" onClick={zoomIn} disabled={imageZoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => previewDoc && window.open(previewDoc.url, '_blank')}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 min-h-[60vh]">
          {previewDoc && isImage(previewDoc.tipo) && (
            <div className="flex items-center justify-center p-4 min-h-[60vh]">
              <img
                src={previewDoc.url}
                alt={previewDoc.nome}
                className="max-w-full transition-transform duration-200"
                style={{ transform: `scale(${imageZoom})` }}
              />
            </div>
          )}
          
          {previewDoc && isPDF(previewDoc.tipo) && (
            <iframe
              src={previewDoc.url}
              className="w-full h-[70vh] border-0"
              title={previewDoc.nome}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
