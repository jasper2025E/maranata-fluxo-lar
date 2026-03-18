import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Database,
  Download,
  Loader2,
  CheckCircle2,
  FolderArchive,
  ChevronRight,
  AlertTriangle,
  Copy,
  Code,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useAuth } from "@/contexts/AuthContext";

// All exportable tables grouped by category
// IMPORTANT: Groups are ordered by FK dependency for safe import:
// 1. Base/independent tables first (tenants, profiles, enums)
// 2. Tables that depend on group 1
// 3. Tables that depend on group 2, and so on
const tableGroups = [
  {
    category: "1 · Base (importar primeiro)",
    tables: [
      { name: "tenants", label: "Dados da Instituição" },
      { name: "profiles", label: "Perfis de Usuários" },
      { name: "user_roles", label: "Permissões de Usuários" },
      { name: "data_retention_config", label: "Configuração de Retenção" },
      { name: "pontos_autorizados", label: "Pontos Autorizados" },
      { name: "platform_announcements", label: "Anúncios" },
      { name: "platform_changelog", label: "Changelog" },
      { name: "platform_roadmap", label: "Roadmap" },
    ],
  },
  {
    category: "2 · Cadastros Principais",
    tables: [
      { name: "escola", label: "Dados da Escola" },
      { name: "setores", label: "Setores" },
      { name: "cursos", label: "Cursos" },
      { name: "responsaveis", label: "Responsáveis" },
      { name: "categorias_contabeis", label: "Categorias Contábeis" },
      { name: "centros_custo", label: "Centros de Custo" },
      { name: "legal_documents", label: "Documentos Legais" },
      { name: "tenant_gateway_configs", label: "Configurações de Gateway" },
      { name: "integration_settings", label: "Configurações de Integração" },
      { name: "user_preferences", label: "Preferências de Usuário" },
    ],
  },
  {
    category: "3 · Cadastros Dependentes",
    tables: [
      { name: "cargos", label: "Cargos" },
      { name: "turmas", label: "Turmas" },
      { name: "disciplinas", label: "Disciplinas" },
      { name: "alunos", label: "Alunos" },
      { name: "funcionarios", label: "Funcionários" },
      { name: "despesas", label: "Despesas" },
      { name: "receitas", label: "Receitas" },
      { name: "lancamentos_contabeis", label: "Lançamentos Contábeis" },
      { name: "bens_patrimoniais", label: "Bens Patrimoniais" },
      { name: "school_website_config", label: "Config do Site" },
      { name: "school_website_pages", label: "Páginas do Site" },
    ],
  },
  {
    category: "4 · Financeiro",
    tables: [
      { name: "faturas", label: "Faturas" },
      { name: "fatura_itens", label: "Itens de Fatura" },
      { name: "fatura_alunos", label: "Alunos por Fatura" },
      { name: "fatura_descontos", label: "Descontos de Fatura" },
      { name: "fatura_documentos", label: "Documentos de Fatura" },
      { name: "fatura_historico", label: "Histórico de Fatura" },
      { name: "pagamentos", label: "Pagamentos" },
      { name: "impostos_estimados", label: "Impostos Estimados" },
      { name: "depreciacao_mensal", label: "Depreciação Mensal" },
    ],
  },
  {
    category: "5 · RH",
    tables: [
      { name: "contratos", label: "Contratos" },
      { name: "folha_pagamento", label: "Folha de Pagamento" },
      { name: "ponto_registros", label: "Ponto Eletrônico" },
      { name: "funcionario_documentos", label: "Documentos de Funcionários" },
      { name: "funcionario_turmas", label: "Funcionário x Turmas" },
    ],
  },
  {
    category: "6 · Acadêmico",
    tables: [
      { name: "aluno_documentos", label: "Documentos de Alunos" },
      { name: "aluno_habilidades", label: "Habilidades de Alunos" },
      { name: "aluno_historico", label: "Histórico de Alunos" },
      { name: "avaliacoes_desempenho", label: "Avaliações de Desempenho" },
      { name: "atividades_extracurriculares", label: "Atividades Extracurriculares" },
      { name: "feedback_professores", label: "Feedback de Professores" },
      { name: "frequencia", label: "Frequência" },
      { name: "notas", label: "Notas" },
    ],
  },
  {
    category: "7 · Site & Leads",
    tables: [
      { name: "school_website_blocks", label: "Blocos do Site" },
      { name: "prematricula_leads", label: "Leads de Pré-matrícula" },
      { name: "notifications", label: "Notificações" },
      { name: "announcement_reads", label: "Leitura de Anúncios" },
    ],
  },
  {
    category: "8 · Logs & Auditoria (importar por último)",
    tables: [
      { name: "audit_logs", label: "Logs de Auditoria" },
      { name: "auditoria_contabil", label: "Auditoria Contábil" },
      { name: "auth_logs", label: "Logs de Autenticação" },
      { name: "security_access_logs", label: "Logs de Acesso" },
      { name: "security_alerts", label: "Alertas de Segurança" },
      { name: "immutable_security_logs", label: "Logs Imutáveis de Segurança" },
      { name: "api_request_logs", label: "Logs de API" },
      { name: "gateway_transaction_logs", label: "Logs de Transações Gateway" },
      { name: "platform_audit_logs", label: "Logs de Auditoria Plataforma" },
      { name: "user_legal_acceptances", label: "Aceites de Termos" },
      { name: "lgpd_deletion_requests", label: "Solicitações LGPD" },
      { name: "subscription_history", label: "Histórico de Assinatura" },
      { name: "roadmap_votes", label: "Votos Roadmap" },
    ],
  },
];

const allTableNames = tableGroups.flatMap((g) => g.tables.map((t) => t.name));

function arrayToCSV(data: Record<string, any>[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map((h) => `"${h}"`).join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

export default function ExportarDados() {
  const { role } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");
  const [exportDone, setExportDone] = useState(false);
  const [results, setResults] = useState<{ table: string; rows: number }[]>([]);
  const [schemaSql, setSchemaSql] = useState("");
  const [loadingSql, setLoadingSql] = useState(false);
  const [sqlVisible, setSqlVisible] = useState(false);

  const handleLoadSchema = async () => {
    setLoadingSql(true);
    try {
      const { data, error } = await supabase.rpc("get_public_tables_ddl" as any);
      if (error) throw error;
      setSchemaSql(data || "");
      setSqlVisible(true);
      toast.success("Schema SQL carregado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao carregar schema:", err);
      toast.error("Erro ao carregar schema SQL");
    } finally {
      setLoadingSql(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    toast.success("SQL copiado para a área de transferência!");
  };
  const allSelected = allTableNames.every((n) => selected.has(n));

  const toggle = (name: string) => {
    const s = new Set(selected);
    s.has(name) ? s.delete(name) : s.add(name);
    setSelected(s);
    setExportDone(false);
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allTableNames));
    setExportDone(false);
  };

  const toggleCategory = (category: string) => {
    const group = tableGroups.find((g) => g.category === category);
    if (!group) return;
    const s = new Set(selected);
    const allCatSelected = group.tables.every((t) => s.has(t.name));
    group.tables.forEach((t) => (allCatSelected ? s.delete(t.name) : s.add(t.name)));
    setSelected(s);
    setExportDone(false);
  };

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error("Selecione ao menos uma tabela");
      return;
    }

    setExporting(true);
    setProgress(0);
    setResults([]);
    setExportDone(false);

    const zip = new JSZip();
    const tables = Array.from(selected);
    const exportResults: { table: string; rows: number }[] = [];

    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i];
      const label = tableGroups
        .flatMap((g) => g.tables)
        .find((t) => t.name === tableName)?.label || tableName;
      setCurrentTable(label);
      setProgress(Math.round(((i) / tables.length) * 100));

      try {
        // Fetch all data with pagination to handle >1000 rows
        let allData: Record<string, any>[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await (supabase.from(tableName as any) as any)
            .select("*")
            .range(from, from + pageSize - 1);

          if (error) {
            console.warn(`Erro ao exportar ${tableName}:`, error.message);
            break;
          }

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          const csv = arrayToCSV(allData);
          zip.file(`${tableName}.csv`, csv);
        }

        exportResults.push({ table: label, rows: allData.length });
      } catch (err) {
        console.warn(`Falha ao exportar ${tableName}:`, err);
        exportResults.push({ table: label, rows: -1 });
      }
    }

    setProgress(100);
    setCurrentTable("Gerando arquivo ZIP...");

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const now = new Date();
      const fileName = `exportacao-completa-${now.toISOString().slice(0, 10)}.zip`;
      saveAs(blob, fileName);
      toast.success("Exportação concluída com sucesso!");
    } catch (err) {
      toast.error("Erro ao gerar arquivo ZIP");
    }

    setResults(exportResults);
    setExportDone(true);
    setExporting(false);
    setCurrentTable("");
  };

  if (role !== "admin" && role !== "platform_admin") {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-muted-foreground">Apenas administradores podem exportar dados.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sistema</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Exportar Dados</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Exportar Dados para Migração</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Exporte todas as tabelas do banco de dados como CSV dentro de um arquivo ZIP.
              Ideal para migração completa de dados.
            </p>
          </div>
        </div>

        {/* Select all */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">
                Selecionar todas as tabelas ({allTableNames.length})
              </span>
            </label>
            <Badge variant="secondary">{selected.size} selecionada(s)</Badge>
          </div>
        </div>

        {/* Table groups */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {tableGroups.map((group) => {
              const allGroupSelected = group.tables.every((t) => selected.has(t.name));
              const someGroupSelected = group.tables.some((t) => selected.has(t.name));
              return (
                <div key={group.category} className="bg-card border border-border rounded-lg">
                  <div className="px-4 py-3 border-b border-border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={allGroupSelected}
                        onCheckedChange={() => toggleCategory(group.category)}
                        className={someGroupSelected && !allGroupSelected ? "opacity-50" : ""}
                      />
                      <span className="text-sm font-medium text-foreground">{group.category}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {group.tables.length}
                      </Badge>
                    </label>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {group.tables.map((table) => (
                      <label
                        key={table.name}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selected.has(table.name)}
                          onCheckedChange={() => toggle(table.name)}
                        />
                        <span className="text-sm text-muted-foreground">{table.label}</span>
                        <span className="text-[10px] text-muted-foreground/50 ml-auto font-mono">
                          {table.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Progress */}
        {exporting && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Exportando: {currentTable}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{progress}% concluído</p>
          </div>
        )}

        {/* Results */}
        {exportDone && results.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-foreground">Exportação concluída</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {results.map((r) => (
                <div key={r.table} className="text-xs flex items-center gap-1.5">
                  {r.rows >= 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  )}
                  <span className="text-muted-foreground truncate">{r.table}</span>
                  <span className="font-mono text-foreground ml-auto">
                    {r.rows >= 0 ? r.rows : "erro"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL Schema Section */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Schema SQL (CREATE TABLE)</h3>
                <p className="text-xs text-muted-foreground">
                  Gere o SQL completo das tabelas para recriar a estrutura em outro banco
                </p>
              </div>
            </div>
            <Button
              onClick={handleLoadSchema}
              disabled={loadingSql}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {loadingSql ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {loadingSql ? "Carregando..." : "Gerar SQL"}
            </Button>
          </div>

          {sqlVisible && schemaSql && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button onClick={handleCopySql} variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <Copy className="h-3.5 w-3.5" />
                  Copiar SQL
                </Button>
              </div>
              <Textarea
                value={schemaSql}
                readOnly
                className="font-mono text-xs h-[300px] bg-muted/50 resize-y"
              />
            </div>
          )}
        </div>

        {/* Export button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={exporting || selected.size === 0}
            size="lg"
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderArchive className="h-4 w-4" />
            )}
            {exporting ? "Exportando..." : `Exportar ${selected.size} tabela(s) como CSV`}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
