import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Upload, Trash2, Download, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TIPOS_DOCUMENTO = [
  { value: "certidao_nascimento", label: "Certidão de Nascimento" },
  { value: "rg", label: "RG" },
  { value: "cpf", label: "CPF" },
  { value: "historico_escolar", label: "Histórico Escolar" },
  { value: "declaracao_transferencia", label: "Declaração de Transferência" },
  { value: "laudo_medico", label: "Laudo Médico" },
  { value: "comprovante_residencia", label: "Comprovante de Residência" },
  { value: "contrato_matricula", label: "Contrato de Matrícula" },
  { value: "foto_3x4", label: "Foto 3x4" },
  { value: "outro", label: "Outro" },
];

interface AlunoDocumentosProps {
  alunoId: string;
}

export function AlunoDocumentos({ alunoId }: AlunoDocumentosProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tipo, setTipo] = useState("outro");
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["aluno-documentos", alunoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aluno_documentos")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async () => {
    if (!file) { toast.error("Selecione um arquivo"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo deve ter no máximo 10MB"); return; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `documentos/${alunoId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("aluno-files")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("aluno-files").getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("aluno_documentos")
        .insert({
          aluno_id: alunoId,
          nome: nome || file.name,
          tipo,
          url: publicUrl,
          tamanho_bytes: file.size,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        });
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["aluno-documentos", alunoId] });
      toast.success("Documento enviado!");
      setIsOpen(false);
      setFile(null);
      setNome("");
      setTipo("outro");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aluno_documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aluno-documentos", alunoId] });
      toast.success("Documento removido");
    },
  });

  const tipoLabel = (t: string) => TIPOS_DOCUMENTO.find(d => d.value === t)?.label || t;

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" /> Documentos
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Enviar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Enviar Documento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo de Documento</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nome (opcional)</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Certidão do aluno" />
              </div>
              <div className="grid gap-2">
                <Label>Arquivo</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-muted-foreground">PDF, imagens ou documentos. Máx 10MB.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={!file || uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {documentos.length > 0 ? (
          <div className="space-y-2">
            {documentos.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{tipoLabel(doc.tipo)}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(doc.created_at), "dd/MM/yyyy")}</span>
                      {doc.tamanho_bytes && <span className="text-xs text-muted-foreground">{(doc.tamanho_bytes / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("Remover documento?")) deleteMutation.mutate(doc.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhum documento enviado ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
