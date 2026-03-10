import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Eye, GraduationCap, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Aluno } from "./types";
import { STATUS_CONFIG } from "./types";

interface AlunoTableProps {
  alunos: Aluno[];
  isLoading: boolean;
  onView: (aluno: Aluno) => void;
  onEdit: (aluno: Aluno) => void;
  onDelete: (id: string) => void;
  onEnturmar: (aluno: Aluno) => void;
  isDeleting: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  faturasVencidas: Record<string, number>;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function AlunoTable({
  alunos, isLoading, onView, onEdit, onDelete, onEnturmar,
  isDeleting, selectedIds, onSelectionChange, faturasVencidas
}: AlunoTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const allSelected = alunos.length > 0 && selectedIds.length === alunos.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < alunos.length;

  const toggleAll = () => {
    onSelectionChange(allSelected ? [] : alunos.map(a => a.id));
  };

  const toggleOne = (id: string) => {
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]
    );
  };

  if (isLoading) return <TableSkeleton />;

  if (alunos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <GraduationCap className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">{t("students.noStudentsFound")}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{t("students.noStudentsDescription")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="w-10">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              aria-label="Selecionar todos"
              className={someSelected ? "data-[state=checked]:bg-primary" : ""}
            />
          </TableHead>
          <TableHead className="font-semibold text-foreground">{t("students.name")}</TableHead>
          <TableHead className="font-semibold text-foreground">{t("students.course")}</TableHead>
          <TableHead className="font-semibold text-foreground">{t("students.class")}</TableHead>
          <TableHead className="font-semibold text-foreground">{t("students.guardian")}</TableHead>
          <TableHead className="font-semibold text-foreground">{t("students.status")}</TableHead>
          <TableHead className="font-semibold text-foreground">Financeiro</TableHead>
          <TableHead className="text-right font-semibold text-foreground">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alunos.map((aluno) => {
          const vencidas = faturasVencidas[aluno.id] || 0;
          return (
            <TableRow key={aluno.id} className={cn("hover:bg-muted/50 transition-colors", selectedIds.includes(aluno.id) && "bg-primary/5")}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(aluno.id)}
                  onCheckedChange={() => toggleOne(aluno.id)}
                  aria-label={`Selecionar ${aluno.nome_completo}`}
                />
              </TableCell>
              <TableCell className="font-medium text-foreground">{aluno.nome_completo}</TableCell>
              <TableCell className="text-muted-foreground">{aluno.cursos?.nome}</TableCell>
              <TableCell className="text-muted-foreground">
                {aluno.turmas ? `${aluno.turmas.nome} - ${aluno.turmas.serie}` : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">{t("students.withoutClass")}</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{aluno.responsaveis?.nome || "-"}</TableCell>
              <TableCell>
                <Badge className={cn("font-medium", STATUS_CONFIG[aluno.status_matricula]?.color)}>
                  {STATUS_CONFIG[aluno.status_matricula]?.label}
                </Badge>
              </TableCell>
              <TableCell>
                {vencidas > 0 ? (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {vencidas} vencida{vencidas > 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">Em dia</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => navigate(`/alunos/${aluno.id}/perfil`)} title="Ver perfil">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10" onClick={() => onEnturmar(aluno)} title={t("students.assignClass")}>
                    <GraduationCap className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => onView(aluno)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => onEdit(aluno)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(aluno.id)} disabled={isDeleting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
