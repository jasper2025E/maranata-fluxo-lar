import { useTranslation } from "react-i18next";
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { FinancialKPICard } from "@/components/dashboard";

interface Aluno {
  status_matricula: string;
  turma_id: string | null;
}

interface AlunoKPIsProps {
  alunos: Aluno[];
}

export function AlunoKPIs({ alunos }: AlunoKPIsProps) {
  const { t } = useTranslation();

  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter(a => a.status_matricula === 'ativo').length;
  const alunosTrancados = alunos.filter(a => a.status_matricula === 'trancado').length;
  const alunosCancelados = alunos.filter(a => a.status_matricula === 'cancelado' || a.status_matricula === 'transferido').length;
  const alunosSemTurma = alunos.filter(a => !a.turma_id).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-fade-in">
      <FinancialKPICard title={t("students.totalStudents")} value={totalAlunos} icon={Users} variant="info" size="sm" index={0} />
      <FinancialKPICard title={t("students.activeStudents")} value={alunosAtivos} icon={UserCheck} variant="success" size="sm" index={1} />
      <FinancialKPICard title={t("students.lockedStudents")} value={alunosTrancados} icon={Users} variant="warning" size="sm" index={2} />
      <FinancialKPICard title={t("students.canceledStudents")} value={alunosCancelados} icon={UserX} variant="danger" size="sm" index={3} />
      <FinancialKPICard title={t("students.withoutClass")} value={alunosSemTurma} icon={GraduationCap} variant="premium" size="sm" index={4} />
    </div>
  );
}
