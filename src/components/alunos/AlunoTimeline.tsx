import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, UserCheck, GraduationCap, BookOpen, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPO_CONFIG: Record<string, { icon: any; color: string }> = {
  status: { icon: UserCheck, color: "bg-amber-100 text-amber-700" },
  enturmacao: { icon: GraduationCap, color: "bg-blue-100 text-blue-700" },
  curso: { icon: BookOpen, color: "bg-purple-100 text-purple-700" },
  default: { icon: Edit, color: "bg-muted text-muted-foreground" },
};

interface AlunoTimelineProps {
  alunoId: string;
}

export function AlunoTimeline({ alunoId }: AlunoTimelineProps) {
  const { data: historico = [] } = useQuery({
    queryKey: ["aluno-historico", alunoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aluno_historico")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" /> Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historico.length > 0 ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {historico.map((item: any) => {
                const config = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.default;
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex items-start gap-4 relative">
                    <div className={`z-10 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Nenhuma alteração registrada ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
