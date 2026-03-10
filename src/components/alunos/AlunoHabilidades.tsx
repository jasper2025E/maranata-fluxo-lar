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
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const NIVEIS = ["Iniciante", "Intermediário", "Avançado", "Excelente"];

interface AlunoHabilidadesProps {
  alunoId: string;
}

export function AlunoHabilidades({ alunoId }: AlunoHabilidadesProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("habilidade");
  const [nivel, setNivel] = useState("Intermediário");

  const { data: habilidades = [] } = useQuery({
    queryKey: ["aluno-habilidades", alunoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aluno_habilidades")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Nome é obrigatório");
      const { error } = await supabase.from("aluno_habilidades").insert({ aluno_id: alunoId, nome: nome.trim(), tipo, nivel });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aluno-habilidades", alunoId] });
      toast.success("Adicionado!");
      setIsOpen(false);
      setNome("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aluno_habilidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aluno-habilidades", alunoId] });
      toast.success("Removido");
    },
  });

  const skills = habilidades.filter((h: any) => h.tipo === "habilidade");
  const interests = habilidades.filter((h: any) => h.tipo === "interesse");

  const nivelColor: Record<string, string> = {
    Iniciante: "bg-blue-100 text-blue-700",
    Intermediário: "bg-amber-100 text-amber-700",
    Avançado: "bg-emerald-100 text-emerald-700",
    Excelente: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Habilidades e Interesses
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Nova Habilidade/Interesse</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="habilidade">Habilidade</SelectItem>
                    <SelectItem value="interesse">Interesse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Música, Liderança..." />
              </div>
              {tipo === "habilidade" && (
                <div className="grid gap-2">
                  <Label>Nível</Label>
                  <Select value={nivel} onValueChange={setNivel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NIVEIS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {habilidades.length > 0 ? (
          <div className="space-y-4">
            {skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Habilidades</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((h: any) => (
                    <div key={h.id} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                      <span className="text-sm font-medium text-foreground">{h.nome}</span>
                      {h.nivel && <Badge className={`text-xs ${nivelColor[h.nivel] || "bg-muted"}`}>{h.nivel}</Badge>}
                      <button onClick={() => deleteMutation.mutate(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Interesses</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((h: any) => (
                    <div key={h.id} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors">
                      <span className="text-sm font-medium text-foreground">{h.nome}</span>
                      <button onClick={() => deleteMutation.mutate(h.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma habilidade ou interesse registrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
