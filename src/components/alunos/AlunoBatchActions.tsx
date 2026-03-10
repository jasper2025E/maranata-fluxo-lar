import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Aluno } from "./types";
import * as XLSX from "xlsx";

interface AlunoBatchActionsProps {
  selectedIds: string[];
  alunos: Aluno[];
  onClearSelection: () => void;
  onStatusChange: (ids: string[], status: string) => void;
}

export function AlunoBatchActions({ selectedIds, alunos, onClearSelection, onStatusChange }: AlunoBatchActionsProps) {
  const { t } = useTranslation();

  if (selectedIds.length === 0) return null;

  const handleBatchStatus = (status: string) => {
    onStatusChange(selectedIds, status);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-fade-in">
      <Badge variant="secondary" className="text-sm">
        {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
      </Badge>
      <Select onValueChange={handleBatchStatus}>
        <SelectTrigger className="w-44 h-8 text-xs">
          <SelectValue placeholder="Alterar status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ativo">Ativar</SelectItem>
          <SelectItem value="trancado">Trancar</SelectItem>
          <SelectItem value="cancelado">Cancelar</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onClearSelection}>
        <X className="h-3 w-3" /> Limpar
      </Button>
    </div>
  );
}

export function ExportButton({ alunos }: { alunos: Aluno[] }) {
  const handleExport = () => {
    const data = alunos.map(a => ({
      Nome: a.nome_completo,
      Curso: a.cursos?.nome || "",
      Turma: a.turmas ? `${a.turmas.nome} - ${a.turmas.serie}` : "Sem turma",
      Responsável: a.responsaveis?.nome || "",
      Status: a.status_matricula,
      Telefone: a.telefone_responsavel || "",
      Email: a.email_responsavel || "",
      Endereço: a.endereco || "",
      "Data Matrícula": a.data_matricula,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alunos");
    XLSX.writeFile(wb, `alunos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Arquivo exportado com sucesso!");
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Exportar
    </Button>
  );
}
