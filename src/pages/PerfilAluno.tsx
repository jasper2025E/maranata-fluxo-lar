import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  User, BookOpen, Wallet, ArrowLeft, Calendar, Mail, MapPin, Phone,
  GraduationCap, FileText, Sparkles, History, TrendingUp, DollarSign,
  BarChart3, Receipt, Clock, CheckCircle2, XCircle,
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

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  ativo: { label: "Ativo", dot: "bg-emerald-500" },
  inativo: { label: "Inativo", dot: "bg-destructive" },
  trancado: { label: "Trancado", dot: "bg-amber-500" },
  cancelado: { label: "Cancelado", dot: "bg-destructive" },
  transferido: { label: "Transferido", dot: "bg-muted-foreground" },
};

const FATURA_STATUS: Record<string, { bg: string; text: string }> = {
  Paga: { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400" },
  Aberta: { bg: "bg-blue-500/10", text: "text-blue-700 dark:text-blue-400" },
  Vencida: { bg: "bg-destructive/10", text: "text-destructive" },
  Cancelada: { bg: "bg-muted", text: "text-muted-foreground" },
  Parcial: { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400" },
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/alunos")} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Alunos
        </Button>

        {/* Hero header card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          {/* Gradient banner */}
          <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          </div>

          {/* Profile info */}
          <div className="px-6 pb-5 -mt-10 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative z-10 ring-4 ring-card rounded-full">
                <AlunoFotoUpload alunoId={aluno.id} currentUrl={aluno.foto_url} nome={aluno.nome_completo} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground truncate">{aluno.nome_completo}</h1>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                    <span className="text-xs font-medium text-muted-foreground">{status.label}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                  {aluno.curso && (
                    <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{aluno.curso.nome}</span>
                  )}
                  {aluno.turma && (
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{aluno.turma.nome}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Matrícula {format(new Date(aluno.data_matricula), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <MiniStat
                icon={BarChart3}
                label="Média Geral"
                value={mediaNotas || "—"}
                color={mediaNotas && Number(mediaNotas) >= 60 ? "emerald" : mediaNotas ? "red" : "neutral"}
              />
              <MiniStat
                icon={CheckCircle2}
                label="Frequência"
                value={`${freqPercent}%`}
                color={freqPercent >= 75 ? "emerald" : "red"}
              />
              <MiniStat
                icon={DollarSign}
                label="Total Pago"
                value={formatCurrency(totalPago)}
                color="emerald"
              />
              <MiniStat
                icon={Clock}
                label="Pendente"
                value={formatCurrency(totalPendente)}
                color={totalPendente > 0 ? "red" : "neutral"}
              />
            </div>
          </div>
        </div>

        {/* Two-column: sidebar + main content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 space-y-4">
            {/* Contact details */}
            <SidebarCard title="Contato">
              <div className="space-y-2.5">
                {aluno.email_responsavel && <InfoRow icon={Mail} value={aluno.email_responsavel} />}
                {aluno.telefone_responsavel && <InfoRow icon={Phone} value={aluno.telefone_responsavel} />}
                {aluno.endereco && <InfoRow icon={MapPin} value={aluno.endereco} />}
                {aluno.data_nascimento && <InfoRow icon={Calendar} value={format(new Date(aluno.data_nascimento), "dd/MM/yyyy")} />}
                {!aluno.email_responsavel && !aluno.telefone_responsavel && !aluno.endereco && !aluno.data_nascimento && (
                  <p className="text-xs text-muted-foreground italic">Sem dados de contato.</p>
                )}
              </div>
            </SidebarCard>

            {/* Responsável */}
            {aluno.responsavel && (
              <SidebarCard title="Responsável">
                <p className="text-sm font-medium text-foreground">{aluno.responsavel.nome}</p>
                {aluno.responsavel.telefone && <p className="text-xs text-muted-foreground mt-1">{aluno.responsavel.telefone}</p>}
                {aluno.responsavel.email && <p className="text-xs text-muted-foreground">{aluno.responsavel.email}</p>}
              </SidebarCard>
            )}

            {/* Attendance mini */}
            <SidebarCard title="Frequência">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{presencas}/{totalAulas} aulas</span>
                  <span className={cn("font-bold tabular-nums", freqPercent >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>{freqPercent}%</span>
                </div>
                <Progress value={freqPercent} className="h-2 rounded-full" />
              </div>
            </SidebarCard>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Tab navigation */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="border-b border-border px-1">
                <nav className="flex overflow-x-auto scrollbar-hide">
                  {TABS.map(t => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap",
                          active
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab content */}
              <div className="p-5">
                {tab === "pessoal" && <TabPessoal aluno={aluno} avaliacoes={avaliacoes} />}
                {tab === "academico" && <TabAcademico notas={notas} frequencia={frequencia} presencas={presencas} totalAulas={totalAulas} freqPercent={freqPercent} atividades={atividades} feedbacks={feedbacks} />}
                {tab === "financeiro" && <TabFinanceiro aluno={aluno} faturas={faturas} pagamentos={pagamentos} totalPago={totalPago} totalPendente={totalPendente} />}
                {tab === "documentos" && <AlunoDocumentos alunoId={alunoId!} />}
                {tab === "perfil" && <AlunoHabilidades alunoId={alunoId!} />}
                {tab === "historico" && <AlunoTimeline alunoId={alunoId!} />}
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Shared components ── */

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: "emerald" | "red" | "neutral" }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    red: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border/50 px-3.5 py-3">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", colors[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-bold text-foreground tabular-nums mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-sm text-foreground break-all">{value}</span>
    </div>
  );
}

function ContentSection({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {typeof count === "number" && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground text-center py-8">{text}</p>;
}

/* ── Tab: Pessoal ── */
function TabPessoal({ aluno, avaliacoes }: { aluno: any; avaliacoes: any[] | undefined }) {
  return (
    <div className="space-y-6">
      {aluno.observacoes && (
        <div className="rounded-xl bg-muted/30 border border-border/50 p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Observações</p>
          <p className="text-sm text-foreground leading-relaxed">{aluno.observacoes}</p>
        </div>
      )}

      <ContentSection title="Avaliações de Desempenho" count={avaliacoes?.length}>
        {avaliacoes && avaliacoes.length > 0 ? (
          <div className="space-y-2.5">
            {avaliacoes.map((a: any) => (
              <div key={a.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.periodo}</p>
                    <p className="text-xs text-muted-foreground">por {a.avaliador_nome}</p>
                  </div>
                  {a.nota_geral != null && (
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      Number(a.nota_geral) >= 7 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : Number(a.nota_geral) >= 5 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {Number(a.nota_geral).toFixed(1)}
                    </div>
                  )}
                </div>
                {a.pontos_fortes && <p className="text-xs text-muted-foreground"><span className="font-medium text-emerald-600 dark:text-emerald-400">✦ </span>{a.pontos_fortes}</p>}
                {a.pontos_melhoria && <p className="text-xs text-muted-foreground"><span className="font-medium text-amber-600 dark:text-amber-400">△ </span>{a.pontos_melhoria}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhuma avaliação registrada." />
        )}
      </ContentSection>
    </div>
  );
}

/* ── Tab: Acadêmico ── */
function TabAcademico({ notas, frequencia, presencas, totalAulas, freqPercent, atividades, feedbacks }: any) {
  return (
    <div className="space-y-6">
      <ContentSection title="Notas" count={notas?.length}>
        {notas && notas.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Disciplina</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground">Bim.</th>
                  <th className="text-center px-3 py-2.5 text-xs font-medium text-muted-foreground">Nota</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notas.map((n: any) => (
                  <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-foreground font-medium">{n.disciplinas?.nome || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground capitalize">{n.tipo}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{n.bimestre || "—"}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "inline-flex h-7 w-12 items-center justify-center rounded-md text-xs font-bold",
                        Number(n.nota) >= 60 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
                      )}>
                        {Number(n.nota).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{format(new Date(n.data_avaliacao), "dd/MM/yy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptySection text="Nenhuma nota registrada." />
        )}
      </ContentSection>

      <ContentSection title="Frequência" count={totalAulas}>
        {frequencia && frequencia.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-muted-foreground">{presencas} presenças</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-muted-foreground">{totalAulas - presencas} faltas</span>
              </div>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-14 gap-1">
              {frequencia.slice(0, 70).map((f: any) => (
                <div
                  key={f.id}
                  title={`${format(new Date(f.data), "dd/MM")} - ${f.presente ? "Presente" : "Falta"}`}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-110",
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
      </ContentSection>

      <ContentSection title="Atividades Extracurriculares" count={atividades?.length}>
        {atividades && atividades.length > 0 ? (
          <div className="space-y-2">
            {atividades.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.nome}</p>
                  {a.descricao && <p className="text-xs text-muted-foreground mt-0.5">{a.descricao}</p>}
                </div>
                <Badge variant="outline" className="text-[11px] shrink-0 rounded-lg">{a.status}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhuma atividade extracurricular." />
        )}
      </ContentSection>

      <ContentSection title="Feedback de Professores" count={feedbacks?.length}>
        {feedbacks && feedbacks.length > 0 ? (
          <div className="space-y-2">
            {feedbacks.map((fb: any) => (
              <div key={fb.id} className="p-3.5 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-foreground">{fb.professor_nome}</p>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(fb.data_feedback), "dd/MM/yyyy")}</span>
                </div>
                {fb.disciplinas?.nome && <Badge variant="secondary" className="text-[10px] mb-2 rounded-md">{fb.disciplinas.nome}</Badge>}
                <p className="text-sm text-muted-foreground leading-relaxed">{fb.comentario}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection text="Nenhum feedback registrado." />
        )}
      </ContentSection>
    </div>
  );
}

/* ── Tab: Financeiro ── */
function TabFinanceiro({ aluno, faturas, pagamentos, totalPago, totalPendente }: any) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Receipt} label="Mensalidade" value={aluno.curso ? formatCurrency(aluno.curso.mensalidade) : "—"} />
        <KpiCard icon={TrendingUp} label="Total Pago" value={formatCurrency(totalPago)} accent="emerald" />
        <KpiCard icon={Clock} label="Pendente" value={formatCurrency(totalPendente)} accent={totalPendente > 0 ? "red" : undefined} />
        <KpiCard icon={FileText} label="Faturas" value={`${faturas?.length || 0}`} />
      </div>

      <ContentSection title="Faturas">
        {faturas && faturas.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {faturas.map((f: any) => {
              const st = FATURA_STATUS[f.status] || FATURA_STATUS.Aberta;
              return (
                <div key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{String(f.mes_referencia).padStart(2, "0")}/{f.ano_referencia}</p>
                    <p className="text-xs text-muted-foreground">Venc. {format(new Date(f.data_vencimento), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md", st.bg, st.text)}>{f.status}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(Number(f.valor_total || f.valor))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptySection text="Nenhuma fatura encontrada." />
        )}
      </ContentSection>

      <ContentSection title="Pagamentos" count={pagamentos?.length}>
        {pagamentos && pagamentos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Método</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagamentos.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-foreground">{format(new Date(p.data_pagamento), "dd/MM/yyyy")}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.metodo}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={p.tipo === "estorno" ? "destructive" : "secondary"} className="text-[11px] rounded-md">{p.tipo || "pagamento"}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">{formatCurrency(Number(p.valor))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptySection text="Nenhum pagamento registrado." />
        )}
      </ContentSection>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: "emerald" | "red" }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn(
        "text-lg font-bold tabular-nums",
        accent === "emerald" ? "text-emerald-600 dark:text-emerald-400"
          : accent === "red" ? "text-destructive"
          : "text-foreground"
      )}>{value}</p>
    </div>
  );
}
