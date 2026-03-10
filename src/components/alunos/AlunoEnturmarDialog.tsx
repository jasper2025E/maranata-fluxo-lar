import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Aluno, Turma } from "./types";

interface AlunoEnturmarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aluno: Aluno | null;
  turmas: Turma[];
  onConfirm: (turmaId: string) => Promise<void>;
  isPending: boolean;
}

export function AlunoEnturmarDialog({ open, onOpenChange, aluno, turmas, onConfirm, isPending }: AlunoEnturmarDialogProps) {
  const { t } = useTranslation();
  const [selectedTurmaId, setSelectedTurmaId] = useState(aluno?.turma_id || "");

  const handleConfirm = async () => {
    if (!selectedTurmaId) return;
    await onConfirm(selectedTurmaId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("students.assignClass")}</DialogTitle>
          <DialogDescription>
            {t("students.selectClassFor")} {aluno?.nome_completo}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>{t("students.class")}</Label>
            <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
              <SelectTrigger>
                <SelectValue placeholder={t("students.selectClass")} />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome} - {turma.serie}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {aluno && !aluno.turma_id && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm">
              {t("students.invoicesWillBeGenerated")}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedTurmaId || isPending}>
            {isPending ? t("common.saving") : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
