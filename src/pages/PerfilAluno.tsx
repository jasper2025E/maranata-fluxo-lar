import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User, BookOpen, Wallet, ArrowLeft, Calendar, Mail, MapPin, Phone,
  GraduationCap, CheckCircle2, XCircle, Clock, TrendingUp, MessageSquare,
  Activity, Award, FileText, Sparkles, History, MoreHorizontal, Edit,
} from "lucide-react";
import {
  useAlunoProfile, useAlunoNotas, useAlunoFrequencia,
  useAlunoFaturas, useAlunoPagamentos, useAlunoAvaliacoes,
  useAlunoAtividades, useAlunoFeedback,
} from "@/hooks/useAlunoProfile";
import { AlunoFotoUpload } from "@/components/alunos/AlunoFotoUpload";
import { AlunoDocumentos } from "@/components/alunos/AlunoDocumentos";
import { AlunoHabilidades } from "@/components/alunos/AlunoHabilidades";
import { AlunoTimeline } from "@/components/alunos/AlunoTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  inativo: { label: "Inativo", className: "bg-destructive/10 text-destructive border-destructive/20" },
  trancado: { label: "Trancado", className: "bg-warning/10 text-warning-foreground border-warning/20" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  transferido: { label: "Transferido", className: "bg-muted text-muted-foreground border-border" },
};

const FATURA_STATUS: Record<string, string> = {
  Paga: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Aberta: "bg-info/10 text-info dark:text-blue-400",
  Vencida: "bg-destructive/10 text-destructive",
  Cancelada: "bg-muted text-muted-foreground",
  Parcial: "bg-warning/10 text-warning-foreground",
};

type TabKey = "pessoal" | "academico" | "financeiro" | "documentos" | "perfil" | "historico";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "pessoal", label: "Pessoal", icon: User },
  { key: "academico", label: "Acadêmico", icon: BookOpen },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "perfil", label: "Perfil", icon: Sparkles },
  { key: "historico", label: "Histórico", icon: History },
];

export default function PerfilAluno() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("pessoal");

  const { data: aluno, isLoading } = useAlunoProfile(alunoId || null);
  const { data: notas } = useAlunoNotas(alunoId || null);
  const { data: frequencia } = useAlunoFrequencia(alunoId || null);
  const { data: faturas } = useAlunoFaturas(alunoId || null);
  const { data: pagamentos } = useAlunoPagamentos(alunoId || null);
  const { data: avaliacoes } = useAlunoAvaliacoes(alunoId || null);
  const { data: atividades } = useAlunoAtividades(alunoId || null);
  const { data: feedbacks } = useAlunoFeedback(alunoId || null);

  if (isLoading) return <DashboardLayout><LoadingState type="dashboard" /></DashboardLayout>;

  if (!aluno) {
    return (
      <DashboardLayout>
        <EmptyState icon={User} title="Aluno não encontrado" description="O aluno solicitado não existe ou foi removido." action={{ label: "Voltar", onClick: () => navigate(-1) }} />
      </DashboardLayout>
    );
  }

  const totalAulas = frequencia?.length || 0;
  const presencas = frequencia?.filter(f => f.presente).length || 0;
  const freqPercent = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
  const mediaNotas = notas && notas.length > 0
    ? (notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length).toFixed(1)
    : null;
  const totalPago = pagamentos?.reduce((s, p) => s + (p.tipo !== "estorno" ? Number(p.valor) : 0), 0) || 0;
  const totalPendente = faturas?.filter(f => f.status === "Aberta" || f.status === "Vencida").reduce((s, f) => s + Number(f.saldo_restante || f.valor), 0) || 0;
  const status = STATUS_MAP[aluno.status_matricula || "ativo"] || STATUS_MAP.ativo;
  const initials = aluno.nome_completo.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/alunos")} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4" /> Alunos
          </Button>
        </div>

        {/* Two-column layout: sidebar + content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - profile card */}
          <aside className="lg:w-72 shrink-0 space-y-4">
            {/* Identity card */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex flex-col items-center text-center">
                <AlunoFotoUpload alunoId={aluno.id} currentUrl={aluno.foto_url} nome={aluno.nome_completo} />
                <h1 className="text-lg font-semibold text-foreground mt-3 leading-tight">{aluno.nome_completo}</h1>
                <Badge variant="outline" className={cn("mt-1.5 text-[11px] font-medium border", status.className)}>
                  {status.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                {aluno.curso && (
                  <DetailRow icon={GraduationCap} label="Curso" value={aluno.curso.nome} />
                )}
                {aluno.turma && (
                  <DetailRow icon={BookOpen} label="Turma" value={aluno.turma.nome} />
                )}
                <DetailRow icon={Calendar} label="Matrícula" value={format(new Date(aluno.data_matricula), "dd/MM/yyyy")} />
                {aluno.data_nascimento && (
                  <DetailRow icon={Calendar} label="Nascimento" value={format(new Date(aluno.data_nascimento), "dd/MM/yyyy")} />
                )}
                {aluno.email_responsavel && (
                  <DetailRow icon={Mail} label="E-mail" value={aluno.email_responsavel} />
                )}
                {aluno.telefone_responsavel && (
                  <DetailRow icon={Phone} label="Telefone" value={aluno.telefone_responsavel} />
                )}
                {aluno.endereco && (
                  <DetailRow icon={MapPin} label="Endereço" value={aluno.endereco} />
                )}
              </div>

              {aluno.responsavel && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Responsável</p>
                    <p className="text-sm font-medium text-foreground">{aluno.responsavel.nome}</p>
                    {aluno.responsavel.telefone && <p className="text-xs text-muted-foreground">{aluno.responsavel.telefone}</p>}
                    {aluno.responsavel.email && <p className="text-xs text-muted-foreground">{aluno.responsavel.email}</p>}
                  </div>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Resumo</p>
              <StatRow label="Média Geral" value={mediaNotas || "—"} accent={mediaNotas && Number(mediaNotas) >= 60} />
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium text-foreground">{freqPercent}%</span>
                </div>
                <Progress value={freqPercent} className="h-1.5" />
              </div>
              <StatRow label="Total Pago" value={formatCurrency(totalPago)} />
              <StatRow label="Pendente" value={formatCurrency(totalPendente)} danger={totalPendente > 0} />
            </div>
          </aside>

          {/* Right content area */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Tab navigation - underline style */}
            <div className="border-b border-border">
              <nav className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px">
                {TABS.map(t => {
                  const Icon = t.icon;
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        active
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab content */}
            {tab === "pessoal" && <TabPessoal aluno={aluno} avaliacoes={avaliacoes} />}
            {tab === "academico" && <TabAcademico notas={notas} frequencia={frequencia} presencas={presencas} totalAulas={totalAulas} freqPercent={freqPercent} atividades={atividades} feedbacks={feedbacks} />}
            {tab === "financeiro" && <TabFinanceiro aluno={aluno} faturas={faturas} pagamentos={pagamentos} totalPago={totalPago} totalPendente={totalPendente} />}
            {tab === "documentos" && <AlunoDocumentos alunoId={alunoId!} />}
            {tab === "perfil" && <AlunoHabilidades alunoId={alunoId!} />}
            {tab === "historico" && <AlunoTimeline alunoId={alunoId!} />}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Shared small components ── */

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value, accent, danger }: { label: string; value: string; accent?: boolean | null; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", danger ? "text-destructive" : accent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>{value}</span>
    </div>
  );
}

function Section({ title, count, children, empty }: { title: string; count?: number; children: React.ReactNode; empty?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {typeof count === "number" && <span className="text-xs text-muted-foreground">{count} registros</span>}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{text}</p>;
}

/* ── Tab: Pessoal ── */
function TabPessoal({ aluno, avaliacoes }: { aluno: any; avaliacoes: any[] | undefined }) {
  return (
    <div className="space-y-4">
      {aluno.observacoes && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Observações</p>
          <p className="text-sm text-foreground leading-relaxed">{aluno.observacoes}</p>
        </div>
      )}

      <Section title="Avaliações de Desempenho" count={avaliacoes?.length}>
        {avaliacoes && avaliacoes.length > 0 ? (
          <div className="space-y-3">
            {avaliacoes.map((a: any) => (
              <div key={a.id} className="p-4 rounded-lg border border-border bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.periodo}</p>
                    <p className="text-xs text-muted-foreground">por {a.avaliador_nome}</p>
                  </div>
                  {a.nota_geral != null && (
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold",
                      Number(a.nota_geral) >= 7 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : Number(a.nota_geral) >= 5 ? "bg-warning/10 text-warning-foreground"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {Number(a.nota_geral).toFixed(1)}
                    </div>
                  )}
                </div>
                {a.pontos_fortes && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-emerald-600 dark:text-emerald-400">Fortes: </span>{a.pontos_fortes}</p>
                )}
                {a.pontos_melhoria && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-warning-foreground">Melhorar: </span>{a.pontos_melhoria}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhuma avaliação registrada." />
        )}
      </Section>
    </div>
  );
}

/* ── Tab: Acadêmico ── */
function TabAcademico({ notas, frequencia, presencas, totalAulas, freqPercent, atividades, feedbacks }: any) {
  return (
    <div className="space-y-4">
      <Section title="Notas" count={notas?.length}>
        {notas && notas.length > 0 ? (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Disciplina</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bim.</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notas.map((n: any) => (
                  <tr key={n.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-foreground">{n.disciplinas?.nome || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground capitalize">{n.tipo}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{n.bimestre || "—"}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("font-semibold", Number(n.nota) >= 60 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                        {Number(n.nota).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{format(new Date(n.data_avaliacao), "dd/MM/yy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptySection text="Nenhuma nota registrada." />
        )}
      </Section>

      <Section title="Frequência" count={totalAulas}>
        {frequencia && frequencia.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{presencas} presenças de {totalAulas} aulas</span>
              <span className={cn("font-semibold", freqPercent >= 75 ? "text-emerald-600" : "text-destructive")}>{freqPercent}%</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-12 gap-1.5">
              {frequencia.slice(0, 60).map((f: any) => (
                <div
                  key={f.id}
                  title={`${format(new Date(f.data), "dd/MM")} - ${f.presente ? "Presente" : "Falta"}`}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-[10px] font-medium",
                    f.presente
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {format(new Date(f.data), "dd")}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptySection text="Nenhum registro de frequência." />
        )}
      </Section>

      <Section title="Atividades Extracurriculares" count={atividades?.length}>
        {atividades && atividades.length > 0 ? (
          <div className="space-y-2">
            {atividades.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.nome}</p>
                  {a.descricao && <p className="text-xs text-muted-foreground mt-0.5">{a.descricao}</p>}
                </div>
                <Badge variant="outline" className="text-[11px] shrink-0">{a.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhuma atividade extracurricular." />
        )}
      </Section>

      <Section title="Feedback de Professores" count={feedbacks?.length}>
        {feedbacks && feedbacks.length > 0 ? (
          <div className="space-y-2">
            {feedbacks.map((fb: any) => (
              <div key={fb.id} className="p-3 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{fb.professor_nome}</p>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(fb.data_feedback), "dd/MM/yyyy")}</span>
                </div>
                {fb.disciplinas?.nome && <Badge variant="outline" className="text-[10px] mb-1.5">{fb.disciplinas.nome}</Badge>}
                <p className="text-sm text-muted-foreground leading-relaxed">{fb.comentario}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhum feedback registrado." />
        )}
      </Section>
    </div>
  );
}

/* ── Tab: Financeiro ── */
function TabFinanceiro({ aluno, faturas, pagamentos, totalPago, totalPendente }: any) {
  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Mensalidade" value={aluno.curso ? formatCurrency(aluno.curso.mensalidade) : "—"} />
        <KpiCard label="Total Pago" value={formatCurrency(totalPago)} className="text-emerald-600 dark:text-emerald-400" />
        <KpiCard label="Pendente" value={formatCurrency(totalPendente)} className={totalPendente > 0 ? "text-destructive" : undefined} />
        <KpiCard label="Faturas" value={`${faturas?.length || 0}`} />
      </div>

      <Section title="Faturas">
        {faturas && faturas.length > 0 ? (
          <div className="space-y-1.5 -m-5">
            {faturas.map((f: any, i: number) => (
              <div key={f.id} className={cn("flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors", i < faturas.length - 1 && "border-b border-border")}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{String(f.mes_referencia).padStart(2, "0")}/{f.ano_referencia}</p>
                  <p className="text-xs text-muted-foreground">Venc. {format(new Date(f.data_vencimento), "dd/MM/yyyy")}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={cn("text-[11px] border-0", FATURA_STATUS[f.status])}>{f.status}</Badge>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(Number(f.valor_total || f.valor))}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhuma fatura encontrada." />
        )}
      </Section>

      <Section title="Pagamentos" count={pagamentos?.length}>
        {pagamentos && pagamentos.length > 0 ? (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Método</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagamentos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 text-foreground">{format(new Date(p.data_pagamento), "dd/MM/yyyy")}</td>
                    <td className="px-3 py-3 text-muted-foreground">{p.metodo}</td>
                    <td className="px-3 py-3">
                      <Badge variant={p.tipo === "estorno" ? "destructive" : "secondary"} className="text-[11px]">{p.tipo || "pagamento"}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">{formatCurrency(Number(p.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptySection text="Nenhum pagamento registrado." />
        )}
      </Section>
    </div>
  );
}

function KpiCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn("text-lg font-bold tabular-nums", className || "text-foreground")}>{value}</p>
    </div>
  );
}
