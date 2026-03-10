import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, GraduationCap, Phone, Mail, MapPin, ExternalLink, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Aluno } from "./types";

interface AlunoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: Aluno | null;
  faturasVencidas?: Record<string, number>;
}

export function AlunoViewDialog({ open, onOpenChange, aluno, faturasVencidas = {} }: AlunoViewDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!aluno) return null;

  const vencidas = faturasVencidas[aluno.id] || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("students.studentDetails")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{aluno.nome_completo}</h3>
                <p className="text-sm text-muted-foreground">{aluno.cursos?.nome}</p>
              </div>
              {vencidas > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {vencidas} vencida{vencidas > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{aluno.data_nascimento ? format(new Date(aluno.data_nascimento), "dd/MM/yyyy") : "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{aluno.turmas ? aluno.turmas.nome : t("students.withoutClass")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{aluno.telefone_responsavel || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{aluno.email_responsavel || "-"}</span>
              </div>
            </div>
            {aluno.endereco && (
              <div className="flex items-start gap-2 text-sm pt-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{aluno.endereco}</span>
              </div>
            )}
            {aluno.observacoes && (
              <div className="pt-2">
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("students.observations")}:</p>
                <p className="text-sm">{aluno.observacoes}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/alunos/${aluno.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Ver perfil completo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
