import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Database,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Clock,
  Shield,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ExportModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "academico" | "financeiro" | "administrativo";
  tables: string[];
}

const exportModules: ExportModule[] = [
  // Acadêmico
  {
    id: "escola",
    name: "Dados da Escola",
    description: "Configurações e dados institucionais",
    icon: <Building2 className="h-4 w-4" />,
    category: "academico",
    tables: ["escola"],
  },
  {
    id: "usuarios",
    name: "Usuários e Perfis",
    description: "Usuários do sistema e permissões",
    icon: <Shield className="h-4 w-4" />,
    category: "academico",
    tables: ["profiles", "user_roles"],
  },
  {
    id: "alunos",
    name: "Alunos",
    description: "Cadastro completo de alunos",
    icon: <GraduationCap className="h-4 w-4" />,
    category: "academico",
    tables: ["alunos"],
  },
  {
    id: "responsaveis",
    name: "Responsáveis",
    description: "Cadastro de responsáveis financeiros",
    icon: <Users className="h-4 w-4" />,
    category: "academico",
    tables: ["responsaveis"],
  },
  {
    id: "turmas",
    name: "Turmas e Cursos",
    description: "Turmas, cursos e disciplinas",
    icon: <GraduationCap className="h-4 w-4" />,
    category: "academico",
    tables: ["turmas", "cursos"],
  },
  // Financeiro
  {
    id: "faturas",
    name: "Faturas",
    description: "Todas as faturas do sistema",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
    tables: ["faturas"],
  },
  {
    id: "fatura_detalhes",
    name: "Detalhes de Faturas",
    description: "Itens, descontos e histórico",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
    tables: ["fatura_itens", "fatura_descontos", "fatura_historico", "fatura_documentos"],
  },
  {
    id: "pagamentos",
    name: "Pagamentos",
    description: "Histórico de pagamentos",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
    tables: ["pagamentos"],
  },
  {
    id: "despesas",
    name: "Despesas",
    description: "Despesas e custos operacionais",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
    tables: ["despesas"],
  },
  // Administrativo / RH
  {
    id: "funcionarios",
    name: "Funcionários",
    description: "Cadastro de funcionários e professores",
    icon: <Users className="h-4 w-4" />,
    category: "administrativo",
    tables: ["funcionarios", "funcionario_documentos", "funcionario_turmas"],
  },
  {
    id: "cargos_setores",
    name: "Cargos e Setores",
    description: "Estrutura organizacional",
    icon: <Building2 className="h-4 w-4" />,
    category: "administrativo",
    tables: ["cargos", "setores"],
  },
  {
    id: "contratos",
    name: "Contratos",
    description: "Contratos de trabalho",
    icon: <Building2 className="h-4 w-4" />,
    category: "administrativo",
    tables: ["contratos"],
  },
  {
    id: "folha",
    name: "Folha de Pagamento",
    description: "Histórico de folha de pagamento",
    icon: <DollarSign className="h-4 w-4" />,
    category: "administrativo",
    tables: ["folha_pagamento"],
  },
  {
    id: "ponto",
    name: "Ponto Eletrônico",
    description: "Registros de ponto e locais autorizados",
    icon: <Clock className="h-4 w-4" />,
    category: "administrativo",
    tables: ["ponto_registros", "pontos_autorizados"],
  },
  {
    id: "notificacoes",
    name: "Notificações",
    description: "Histórico de notificações do sistema",
    icon: <AlertCircle className="h-4 w-4" />,
    category: "administrativo",
    tables: ["notifications"],
  },
];

// Helper to sanitize data for export (remove sensitive fields)
const sanitizeForExport = (tableName: string, data: any[]) => {
  return data.map(row => {
    const sanitized = { ...row };
    // Remove tokens and sensitive credentials
    if ('ponto_token' in sanitized) delete sanitized.ponto_token;
    if ('ponto_token_expires_at' in sanitized) delete sanitized.ponto_token_expires_at;
    if ('stripe_customer_id' in sanitized) delete sanitized.stripe_customer_id;
    if ('stripe_checkout_session_id' in sanitized) delete sanitized.stripe_checkout_session_id;
    if ('stripe_payment_intent_id' in sanitized) delete sanitized.stripe_payment_intent_id;
    if ('payment_url' in sanitized) delete sanitized.payment_url;
    return sanitized;
  });
};

export function BackupExport() {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");
  const [exportComplete, setExportComplete] = useState(false);

  const allModuleIds = exportModules.map(m => m.id);
  const allSelected = allModuleIds.every(id => selectedModules.has(id));

  const toggleModule = (moduleId: string) => {
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
    setExportComplete(false);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedModules(new Set());
    } else {
      setSelectedModules(new Set(allModuleIds));
    }
    setExportComplete(false);
  };

  const selectCategory = (category: "academico" | "financeiro" | "administrativo") => {
    const categoryModules = exportModules.filter(m => m.category === category);
    const newSelected = new Set(selectedModules);
    const allCategorySelected = categoryModules.every(m => newSelected.has(m.id));
    
    categoryModules.forEach(m => {
      if (allCategorySelected) {
        newSelected.delete(m.id);
      } else {
        newSelected.add(m.id);
      }
    });
    
    setSelectedModules(newSelected);
    setExportComplete(false);
  };

  const fetchTableData = async (tableName: string): Promise<any[]> => {
    try {
      // Use type assertion to allow dynamic table names
      const { data, error } = await (supabase.from(tableName as any).select("*") as any);
      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return [];
      }
      return sanitizeForExport(tableName, data || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      return [];
    }
  };

  const handleExport = async () => {
    if (selectedModules.size === 0) {
      toast.error("Selecione pelo menos um módulo para exportar");
      return;
    }

    setExporting(true);
    setProgress(0);
    setExportComplete(false);

    try {
      const workbook = XLSX.utils.book_new();
      
      // Get all selected modules and their tables
      const selectedModulesList = exportModules.filter(m => selectedModules.has(m.id));
      const allTables = selectedModulesList.flatMap(m => m.tables);
      const uniqueTables = [...new Set(allTables)];
      
      let completed = 0;
      const total = uniqueTables.length;

      for (const tableName of uniqueTables) {
        setCurrentTable(tableName);
        
        const data = await fetchTableData(tableName);
        
        if (data.length > 0) {
          // Create worksheet from data
          const worksheet = XLSX.utils.json_to_sheet(data);
          
          // Auto-size columns
          const maxWidth = 50;
          const cols = Object.keys(data[0]).map(key => ({
            wch: Math.min(
              Math.max(
                key.length,
                ...data.map(row => String(row[key] || "").length)
              ),
              maxWidth
            )
          }));
          worksheet["!cols"] = cols;
          
          // Truncate sheet name to 31 chars (Excel limit)
          const sheetName = tableName.substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
        
        completed++;
        setProgress(Math.round((completed / total) * 100));
      }

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, "").replace("T", "_");
      const filename = `backup_maranata_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      setExportComplete(true);
      toast.success("Backup exportado com sucesso!", {
        description: `Arquivo: ${filename}`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar dados", {
        description: error.message,
      });
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentTable("");
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "academico": return "Acadêmico";
      case "financeiro": return "Financeiro";
      case "administrativo": return "Administrativo / RH";
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "academico": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "financeiro": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "administrativo": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-muted";
    }
  };

  const groupedModules = {
    academico: exportModules.filter(m => m.category === "academico"),
    financeiro: exportModules.filter(m => m.category === "financeiro"),
    administrativo: exportModules.filter(m => m.category === "administrativo"),
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Backup do Sistema
        </CardTitle>
        <CardDescription>
          Exporte todos os dados do sistema para backup ou migração.
          Os dados são exportados em formato Excel (.xlsx) com uma aba para cada tabela.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Box */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Exportação Segura</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os dados exportados preservam todos os IDs para facilitar migração.
                Tokens de segurança e dados sensíveis são automaticamente removidos.
                O sistema continua funcionando normalmente durante a exportação.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={allSelected ? "default" : "outline"}
            size="sm"
            onClick={toggleAll}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {allSelected ? "Desmarcar Tudo" : "Exportar Tudo"}
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCategory("academico")}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            Acadêmico
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCategory("financeiro")}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Financeiro
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectCategory("administrativo")}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Administrativo
          </Button>
        </div>

        <Separator />

        {/* Module Selection */}
        <div className="space-y-6">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor(category)}>
                  {getCategoryLabel(category)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {modules.filter(m => selectedModules.has(m.id)).length} de {modules.length} selecionados
                </span>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      selectedModules.has(module.id) 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-background"
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <Checkbox
                      id={module.id}
                      checked={selectedModules.has(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {module.icon}
                        <Label
                          htmlFor={module.id}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {module.name}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {module.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Tabelas: {module.tables.join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Export Progress */}
        {exporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Exportando...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {currentTable && (
              <p className="text-xs text-muted-foreground">
                Processando: {currentTable}
              </p>
            )}
          </div>
        )}

        {/* Export Complete Message */}
        {exportComplete && !exporting && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm text-green-700">Exportação Concluída!</p>
                <p className="text-xs text-green-600/80 mt-0.5">
                  O arquivo foi baixado para sua pasta de downloads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting || selectedModules.size === 0}
          className="w-full gap-2"
          size="lg"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando... {progress}%
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <FileSpreadsheet className="h-4 w-4" />
              Baixar Backup ({selectedModules.size} {selectedModules.size === 1 ? "módulo" : "módulos"})
            </>
          )}
        </Button>

        {/* Info Footer */}
        <p className="text-xs text-muted-foreground text-center">
          O backup é gerado em formato Excel (.xlsx) com uma aba para cada tabela de dados.
          IDs são preservados para facilitar a migração para outro sistema.
        </p>
      </CardContent>
    </Card>
  );
}
