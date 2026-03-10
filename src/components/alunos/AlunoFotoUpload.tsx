import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AlunoFotoUploadProps {
  alunoId: string;
  currentUrl: string | null;
  nome: string;
}

export function AlunoFotoUpload({ alunoId, currentUrl, nome }: AlunoFotoUploadProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const initials = nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `fotos/${alunoId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("aluno-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("aluno-files")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("alunos")
        .update({ foto_url: publicUrl })
        .eq("id", alunoId);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["aluno-profile", alunoId] });
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(`Erro ao enviar foto: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await supabase.from("alunos").update({ foto_url: null }).eq("id", alunoId);
      queryClient.invalidateQueries({ queryKey: ["aluno-profile", alunoId] });
      toast.success("Foto removida");
    } catch {
      toast.error("Erro ao remover foto");
    }
  };

  return (
    <div className="relative group">
      <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-background shadow-md">
        {currentUrl ? (
          <img src={currentUrl} alt={nome} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-bold text-primary">{initials}</span>
        )}
      </div>
      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        {uploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {currentUrl && (
        <Button
          variant="destructive" size="icon"
          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
