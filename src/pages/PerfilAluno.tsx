import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { LoadingState } from "@/components/LoadingState";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  User, BookOpen, Wallet, Star, ArrowLeft, Calendar, Mail, MapPin, Phone,
  GraduationCap, CheckCircle2, XCircle, Clock, TrendingUp, MessageSquare,
  Activity, Award, ChevronRight, FileText, Sparkles, History,
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

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusColor: Record<string, string> = {
  ativo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  inativo: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  trancado: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const faturaStatusBadge: Record<string, string> = {
  Paga: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Aberta: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Vencida: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Cancelada: "bg-muted text-muted-foreground",
  Parcial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function PerfilAluno() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("pessoal");

  const { data: aluno, isLoading } = useAlunoProfile(alunoId || null);
  const { data: notas } = useAlunoNotas(alunoId || null);
  const { data: frequencia } = useAlunoFrequencia(alunoId || null);
  const { data: faturas } = useAlunoFaturas(alunoId || null);
  const { data: pagamentos } = useAlunoPagamentos(alunoId || null);
  const { data: avaliacoes } = useAlunoAvaliacoes(alunoId || null);
  const { data: atividades } = useAlunoAtividades(alunoId || null);
  const { data: feedbacks } = useAlunoFeedback(alunoId || null);

  if (isLoading) {
    return <DashboardLayout><LoadingState type="dashboard" /></DashboardLayout>;
  }

  if (!aluno) {
    return (
      <DashboardLayout>
        <EmptyState icon={User} title="Aluno não encontrado" description="O aluno solicitado não foi encontrado." action={{ label: "Voltar", onClick: () => navigate(-1) }} />
      </DashboardLayout>
    );
  }

  const totalAulas = frequencia?.length || 0;
  const presencas = frequencia?.filter(f => f.presente).length || 0;
  const freqPercent = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0;
  const mediaNotas = notas && notas.length > 0
    ? (notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length).toFixed(1)
    : "—";
  const totalPago = pagamentos?.reduce((s, p) => s + (p.tipo !== "estorno" ? Number(p.valor) : 0), 0) || 0;
  const totalPendente = faturas?.filter(f => f.status === "Aberta" || f.status === "Vencida").reduce((s, f) => s + Number(f.saldo_restante || f.valor), 0) || 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Perfil do Aluno</span>
        </nav>

        {/* Header Card with Photo */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <AlunoFotoUpload alunoId={aluno.id} currentUrl={aluno.foto_url} nome={aluno.nome_completo} />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground truncate">{aluno.nome_completo}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {aluno.curso && (
                    <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{aluno.curso.nome}</span>
                  )}
                  {aluno.turma && (
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{aluno.turma.nome}</span>
                  )}
                  <Badge className={statusColor[aluno.status_matricula || "ativo"]}>{aluno.status_matricula || "ativo"}</Badge>
                </div>
                {aluno.observacoes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{aluno.observacoes}</p>
                )}
              </div>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{mediaNotas}</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{freqPercent}%</p>
                  <p className="text-xs text-muted-foreground">Frequência</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPago)}</p>
                  <p className="text-xs text-muted-foreground">Pago</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${totalPendente > 0 ? "text-red-500" : "text-foreground"}`}>{formatCurrency(totalPendente)}</p>
                  <p className="text-xs text-muted-foreground">Pendente</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
            <TabsTrigger value="pessoal" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5 hidden sm:block" />Pessoal</TabsTrigger>
            <TabsTrigger value="academico" className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5 hidden sm:block" />Acadêmico</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5 text-xs"><Wallet className="h-3.5 w-3.5 hidden sm:block" />Financeiro</TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5 hidden sm:block" />Documentos</TabsTrigger>
            <TabsTrigger value="habilidades" className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5 hidden sm:block" />Perfil</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 text-xs"><History className="h-3.5 w-3.5 hidden sm:block" />Histórico</TabsTrigger>
          </TabsList>

          {/* Pessoal Tab */}
          <TabsContent value="pessoal" className="space-y-4 mt-4">
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader><CardTitle className="text-lg">Informações Pessoais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoRow icon={User} label="Nome Completo" value={aluno.nome_completo} />
                  <InfoRow icon={Calendar} label="Data de Nascimento" value={aluno.data_nascimento ? format(new Date(aluno.data_nascimento), "dd/MM/yyyy") : "Não informada"} />
                  <InfoRow icon={Mail} label="E-mail Responsável" value={aluno.email_responsavel || "Não informado"} />
                  <InfoRow icon={Phone} label="Telefone" value={aluno.telefone_responsavel || "Não informado"} />
                  <InfoRow icon={MapPin} label="Endereço" value={aluno.endereco || "Não informado"} />
                  <InfoRow icon={Calendar} label="Data de Matrícula" value={format(new Date(aluno.data_matricula), "dd/MM/yyyy")} />
                  <InfoRow icon={GraduationCap} label="Curso" value={aluno.curso ? `${aluno.curso.nome} (${aluno.curso.duracao_meses} meses)` : "—"} />
                  <InfoRow icon={Wallet} label="Mensalidade" value={aluno.curso ? formatCurrency(aluno.curso.mensalidade) : "—"} />
                </div>
                {aluno.responsavel && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Responsável</h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <InfoRow icon={User} label="Nome" value={aluno.responsavel.nome} />
                        <InfoRow icon={Phone} label="Telefone" value={aluno.responsavel.telefone || "—"} />
                        <InfoRow icon={Mail} label="E-mail" value={aluno.responsavel.email || "—"} />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Avaliações e Feedback na tab pessoal */}
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5" /> Avaliações de Desempenho</CardTitle>
              </CardHeader>
              <CardContent>
                {avaliacoes && avaliacoes.length > 0 ? (
                  <div className="space-y-4">
                    {avaliacoes.map((a: any) => (
                      <div key={a.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">{a.periodo}</p>
                            <p className="text-sm text-muted-foreground">Avaliador: {a.avaliador_nome}</p>
                          </div>
                          {a.nota_geral && (
                            <span className={`text-2xl font-bold ${Number(a.nota_geral) >= 7 ? "text-emerald-600" : Number(a.nota_geral) >= 5 ? "text-amber-600" : "text-red-500"}`}>
                              {Number(a.nota_geral).toFixed(1)}
                            </span>
                          )}
                        </div>
                        {a.pontos_fortes && <div><span className="text-xs font-semibold text-emerald-600">Pontos fortes:</span><p className="text-sm text-muted-foreground">{a.pontos_fortes}</p></div>}
                        {a.pontos_melhoria && <div><span className="text-xs font-semibold text-amber-600">Pontos a melhorar:</span><p className="text-sm text-muted-foreground">{a.pontos_melhoria}</p></div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma avaliação de desempenho.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acadêmico Tab */}
          <TabsContent value="academico" className="space-y-4 mt-4">
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Notas por Disciplina</CardTitle>
                <CardDescription>{notas?.length || 0} registros</CardDescription>
              </CardHeader>
              <CardContent>
                {notas && notas.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 font-medium text-muted-foreground">Disciplina</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-center py-2 font-medium text-muted-foreground">Bimestre</th>
                          <th className="text-center py-2 font-medium text-muted-foreground">Nota</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notas.map((n: any) => (
                          <tr key={n.id} className="border-b border-border/30">
                            <td className="py-2.5 text-foreground">{n.disciplinas?.nome || "—"}</td>
                            <td className="py-2.5 capitalize text-muted-foreground">{n.tipo}</td>
                            <td className="py-2.5 text-center text-muted-foreground">{n.bimestre || "—"}</td>
                            <td className="py-2.5 text-center">
                              <span className={`font-semibold ${Number(n.nota) >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                                {Number(n.nota).toFixed(1)}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">{format(new Date(n.data_avaliacao), "dd/MM/yy")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma nota registrada ainda.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Frequência</CardTitle>
                <CardDescription>{presencas}/{totalAulas} presenças ({freqPercent}%)</CardDescription>
              </CardHeader>
              <CardContent>
                {frequencia && frequencia.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {frequencia.slice(0, 30).map((f: any) => (
                      <div key={f.id} className={`p-2 rounded-lg text-center text-xs ${f.presente ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                        <div className="font-medium">{format(new Date(f.data), "dd/MM")}</div>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          {f.presente ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {f.presente ? "P" : "F"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum registro de frequência.</p>
                )}
              </CardContent>
            </Card>

            {/* Atividades Extracurriculares */}
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Atividades Extracurriculares</CardTitle>
              </CardHeader>
              <CardContent>
                {atividades && atividades.length > 0 ? (
                  <div className="space-y-3">
                    {atividades.map((a: any) => (
                      <div key={a.id} className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{a.nome}</p>
                          <Badge variant="outline">{a.status}</Badge>
                        </div>
                        {a.descricao && <p className="text-sm text-muted-foreground mt-1">{a.descricao}</p>}
                        {a.data_inicio && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(a.data_inicio), "dd/MM/yyyy")}
                            {a.data_fim && ` — ${format(new Date(a.data_fim), "dd/MM/yyyy")}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma atividade extracurricular registrada.</p>
                )}
              </CardContent>
            </Card>

            {/* Feedback de Professores */}
            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Feedback de Professores</CardTitle>
              </CardHeader>
              <CardContent>
                {feedbacks && feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    {feedbacks.map((fb: any) => (
                      <div key={fb.id} className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-foreground text-sm">{fb.professor_nome}</p>
                          <span className="text-xs text-muted-foreground">{format(new Date(fb.data_feedback), "dd/MM/yyyy")}</span>
                        </div>
                        {fb.disciplinas?.nome && <Badge variant="outline" className="text-xs mb-1">{fb.disciplinas.nome}</Badge>}
                        <p className="text-sm text-muted-foreground">{fb.comentario}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum feedback de professores.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financeiro Tab */}
          <TabsContent value="financeiro" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniKPI icon={Wallet} label="Mensalidade" value={aluno.curso ? formatCurrency(aluno.curso.mensalidade) : "—"} />
              <MiniKPI icon={CheckCircle2} label="Total Pago" value={formatCurrency(totalPago)} color="text-emerald-600" />
              <MiniKPI icon={Clock} label="Pendente" value={formatCurrency(totalPendente)} color={totalPendente > 0 ? "text-red-500" : undefined} />
              <MiniKPI icon={TrendingUp} label="Faturas" value={`${faturas?.length || 0}`} />
            </div>

            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader><CardTitle className="text-lg">Faturas</CardTitle></CardHeader>
              <CardContent>
                {faturas && faturas.length > 0 ? (
                  <div className="space-y-2">
                    {faturas.map((f: any) => (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.mes_referencia}/{f.ano_referencia}</p>
                          <p className="text-xs text-muted-foreground">Venc: {format(new Date(f.data_vencimento), "dd/MM/yyyy")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={faturaStatusBadge[f.status] || "bg-muted"}>{f.status}</Badge>
                          <span className="font-semibold text-foreground">{formatCurrency(Number(f.valor_total || f.valor))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhuma fatura encontrada.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm rounded-2xl bg-card">
              <CardHeader><CardTitle className="text-lg">Pagamentos Realizados</CardTitle></CardHeader>
              <CardContent>
                {pagamentos && pagamentos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 font-medium text-muted-foreground">Data</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Método</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentos.map((p: any) => (
                          <tr key={p.id} className="border-b border-border/30">
                            <td className="py-2.5 text-foreground">{format(new Date(p.data_pagamento), "dd/MM/yyyy")}</td>
                            <td className="py-2.5 text-muted-foreground">{p.metodo}</td>
                            <td className="py-2.5"><Badge variant={p.tipo === "estorno" ? "destructive" : "secondary"} className="text-xs">{p.tipo || "pagamento"}</Badge></td>
                            <td className="py-2.5 text-right font-semibold text-foreground">{formatCurrency(Number(p.valor))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Nenhum pagamento registrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos Tab */}
          <TabsContent value="documentos" className="mt-4">
            <AlunoDocumentos alunoId={alunoId!} />
          </TabsContent>

          {/* Habilidades/Perfil Tab */}
          <TabsContent value="habilidades" className="mt-4">
            <AlunoHabilidades alunoId={alunoId!} />
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico" className="mt-4">
            <AlunoTimeline alunoId={alunoId!} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <Card className="border-border/50 shadow-sm rounded-xl bg-card">
      <CardContent className="p-4 text-center">
        <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
        <p className={`text-lg font-bold ${color || "text-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
