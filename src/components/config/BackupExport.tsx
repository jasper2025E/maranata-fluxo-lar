import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Download,
  Database,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  Users,
  GraduationCap,
  DollarSign,
  Building2,
  Clock,
  Shield,
  AlertCircle,
  FolderArchive,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { formatCurrency, formatDate, getMonthName } from "@/lib/formatters";

interface ExportModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "academico" | "financeiro" | "administrativo";
}

const exportModules: ExportModule[] = [
  // Acadêmico
  {
    id: "escola",
    name: "Dados da Escola",
    description: "Configurações e dados institucionais",
    icon: <Building2 className="h-4 w-4" />,
    category: "academico",
  },
  {
    id: "usuarios",
    name: "Usuários",
    description: "Usuários do sistema e permissões",
    icon: <Shield className="h-4 w-4" />,
    category: "academico",
  },
  {
    id: "alunos",
    name: "Alunos",
    description: "Cadastro completo de alunos",
    icon: <GraduationCap className="h-4 w-4" />,
    category: "academico",
  },
  {
    id: "responsaveis",
    name: "Responsáveis",
    description: "Cadastro de responsáveis financeiros",
    icon: <Users className="h-4 w-4" />,
    category: "academico",
  },
  {
    id: "cursos",
    name: "Cursos",
    description: "Cursos oferecidos",
    icon: <GraduationCap className="h-4 w-4" />,
    category: "academico",
  },
  {
    id: "turmas",
    name: "Turmas",
    description: "Turmas e classes",
    icon: <GraduationCap className="h-4 w-4" />,
    category: "academico",
  },
  // Financeiro
  {
    id: "faturas",
    name: "Faturas",
    description: "Todas as faturas do sistema",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
  },
  {
    id: "pagamentos",
    name: "Pagamentos",
    description: "Histórico de pagamentos",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
  },
  {
    id: "despesas",
    name: "Despesas",
    description: "Despesas e custos operacionais",
    icon: <DollarSign className="h-4 w-4" />,
    category: "financeiro",
  },
  // Administrativo / RH
  {
    id: "funcionarios",
    name: "Funcionários",
    description: "Cadastro de funcionários e professores",
    icon: <Users className="h-4 w-4" />,
    category: "administrativo",
  },
  {
    id: "cargos",
    name: "Cargos e Setores",
    description: "Estrutura organizacional",
    icon: <Building2 className="h-4 w-4" />,
    category: "administrativo",
  },
  {
    id: "contratos",
    name: "Contratos",
    description: "Contratos de trabalho",
    icon: <Building2 className="h-4 w-4" />,
    category: "administrativo",
  },
  {
    id: "folha_pagamento",
    name: "Folha de Pagamento",
    description: "Histórico de folha de pagamento",
    icon: <DollarSign className="h-4 w-4" />,
    category: "administrativo",
  },
  {
    id: "ponto",
    name: "Ponto Eletrônico",
    description: "Registros de ponto",
    icon: <Clock className="h-4 w-4" />,
    category: "administrativo",
  },
];

// Lookup maps for humanizing data
interface LookupMaps {
  alunos: Map<string, string>;
  responsaveis: Map<string, string>;
  cursos: Map<string, string>;
  turmas: Map<string, string>;
  funcionarios: Map<string, string>;
  cargos: Map<string, string>;
  setores: Map<string, string>;
}

export function BackupExport() {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<"xlsx" | "pdf">("xlsx");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
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

  // Build lookup maps for humanizing IDs
  const buildLookupMaps = useCallback(async (): Promise<LookupMaps> => {
    const maps: LookupMaps = {
      alunos: new Map(),
      responsaveis: new Map(),
      cursos: new Map(),
      turmas: new Map(),
      funcionarios: new Map(),
      cargos: new Map(),
      setores: new Map(),
    };

    // Fetch alunos
    const { data: alunos } = await supabase.from("alunos").select("id, nome_completo");
    alunos?.forEach(a => maps.alunos.set(a.id, a.nome_completo));

    // Fetch responsaveis
    const { data: responsaveis } = await supabase.from("responsaveis").select("id, nome");
    responsaveis?.forEach(r => maps.responsaveis.set(r.id, r.nome));

    // Fetch cursos
    const { data: cursos } = await supabase.from("cursos").select("id, nome");
    cursos?.forEach(c => maps.cursos.set(c.id, c.nome));

    // Fetch turmas
    const { data: turmas } = await supabase.from("turmas").select("id, nome");
    turmas?.forEach(t => maps.turmas.set(t.id, t.nome));

    // Fetch funcionarios
    const { data: funcionarios } = await supabase.from("funcionarios").select("id, nome_completo");
    funcionarios?.forEach(f => maps.funcionarios.set(f.id, f.nome_completo));

    // Fetch cargos
    const { data: cargos } = await supabase.from("cargos").select("id, nome");
    cargos?.forEach(c => maps.cargos.set(c.id, c.nome));

    // Fetch setores
    const { data: setores } = await supabase.from("setores").select("id, nome");
    setores?.forEach(s => maps.setores.set(s.id, s.nome));

    return maps;
  }, []);

  // Format status in Portuguese
  const formatStatus = (status: string | null): string => {
    if (!status) return "-";
    const statusMap: Record<string, string> = {
      ativo: "Ativo",
      inativo: "Inativo",
      afastado: "Afastado",
      ferias: "Férias",
      trancado: "Trancado",
      cancelado: "Cancelado",
      transferido: "Transferido",
      Aberta: "Em Aberto",
      Paga: "Pago",
      Vencida: "Atrasado",
      Cancelada: "Cancelado",
    };
    return statusMap[status] || status;
  };

  // Format tipo funcionario
  const formatTipoFuncionario = (tipo: string | null): string => {
    if (!tipo) return "-";
    const tipoMap: Record<string, string> = {
      professor: "Professor",
      administrativo: "Administrativo",
      outro: "Outro",
    };
    return tipoMap[tipo] || tipo;
  };

  // Format contrato tipo
  const formatContratoTipo = (tipo: string | null): string => {
    if (!tipo) return "-";
    const tipoMap: Record<string, string> = {
      clt: "CLT",
      pj: "PJ",
      temporario: "Temporário",
      estagio: "Estágio",
    };
    return tipoMap[tipo] || tipo;
  };

  // Humanize escola data
  const humanizeEscola = async () => {
    const { data } = await supabase.from("escola").select("*").limit(1).maybeSingle();
    if (!data) return [];

    return [{
      "Nome da Escola": data.nome || "-",
      "CNPJ": data.cnpj || "-",
      "Telefone": data.telefone || "-",
      "Email": data.email || "-",
      "Endereço": data.endereco || "-",
      "Ano Letivo": data.ano_letivo || "-",
      "Multa Padrão (%)": data.multa_percentual_padrao ?? "-",
      "Juros Diário (%)": data.juros_percentual_diario_padrao ?? "-",
      "Juros Mensal (%)": data.juros_percentual_mensal_padrao ?? "-",
      "Dias Carência Juros": data.dias_carencia_juros ?? "-",
      "Desconto Pontualidade (%)": data.desconto_pontualidade_percentual ?? "-",
      "Dias Desconto Pontualidade": data.dias_desconto_pontualidade ?? "-",
    }];
  };

  // Humanize usuarios data
  const humanizeUsuarios = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    const roleMap = new Map<string, string>();
    roles?.forEach(r => {
      const roleLabel = r.role === "admin" ? "Administrador" : 
                       r.role === "staff" ? "Funcionário" :
                       r.role === "financeiro" ? "Financeiro" :
                       r.role === "secretaria" ? "Secretaria" : r.role;
      roleMap.set(r.user_id, roleLabel);
    });

    return (profiles || []).map(p => ({
      "Nome": p.nome || "-",
      "Email": p.email || "-",
      "Perfil de Acesso": roleMap.get(p.id) || "Sem permissão",
      "Data de Cadastro": p.created_at ? formatDate(p.created_at) : "-",
    }));
  };

  // Humanize alunos data
  const humanizeAlunos = async (maps: LookupMaps) => {
    const { data } = await supabase.from("alunos").select("*");
    
    return (data || []).map(a => ({
      "Nome do Aluno": a.nome_completo || "-",
      "Data de Nascimento": a.data_nascimento ? formatDate(a.data_nascimento) : "-",
      "Data da Matrícula": a.data_matricula ? formatDate(a.data_matricula) : "-",
      "Status": formatStatus(a.status_matricula),
      "Curso": maps.cursos.get(a.curso_id) || "-",
      "Turma": a.turma_id ? (maps.turmas.get(a.turma_id) || "-") : "Não enturmado",
      "Responsável Financeiro": a.responsavel_id ? (maps.responsaveis.get(a.responsavel_id) || "-") : "-",
      "Telefone do Responsável": a.telefone_responsavel || "-",
      "Email do Responsável": a.email_responsavel || "-",
      "Endereço": a.endereco || "-",
      "Desconto (%)": a.desconto_percentual ?? 0,
      "Observações": a.observacoes || "-",
    }));
  };

  // Humanize responsaveis data
  const humanizeResponsaveis = async (maps: LookupMaps) => {
    const { data: responsaveis } = await supabase.from("responsaveis").select("*");
    const { data: alunos } = await supabase.from("alunos").select("id, nome_completo, responsavel_id");

    // Build a map of responsavel -> alunos
    const alunosDoResp = new Map<string, string[]>();
    alunos?.forEach(a => {
      if (a.responsavel_id) {
        const lista = alunosDoResp.get(a.responsavel_id) || [];
        lista.push(a.nome_completo);
        alunosDoResp.set(a.responsavel_id, lista);
      }
    });

    return (responsaveis || []).map(r => ({
      "Nome do Responsável": r.nome || "-",
      "CPF": r.cpf || "-",
      "Telefone": r.telefone || "-",
      "Email": r.email || "-",
      "Alunos Vinculados": alunosDoResp.get(r.id)?.join(", ") || "-",
      "Status": r.ativo ? "Ativo" : "Inativo",
      "Fatura Consolidada": r.fatura_consolidada ? "Sim" : "Não",
      "Observações": r.observacoes || "-",
    }));
  };

  // Humanize cursos data
  const humanizeCursos = async () => {
    const { data } = await supabase.from("cursos").select("*");
    
    return (data || []).map(c => ({
      "Nome do Curso": c.nome || "-",
      "Nível": c.nivel || "-",
      "Mensalidade": formatCurrency(c.mensalidade || 0),
      "Duração (meses)": c.duracao_meses || "-",
      "Status": c.ativo ? "Ativo" : "Inativo",
    }));
  };

  // Humanize turmas data
  const humanizeTurmas = async () => {
    const { data } = await supabase.from("turmas").select("*");
    
    return (data || []).map(t => ({
      "Nome da Turma": t.nome || "-",
      "Série": t.serie || "-",
      "Turno": t.turno || "-",
      "Ano Letivo": t.ano_letivo || "-",
      "Status": t.ativo ? "Ativo" : "Inativo",
    }));
  };

  // Humanize faturas data
  const humanizeFaturas = async (maps: LookupMaps) => {
    const { data } = await supabase.from("faturas").select("*").order("ano_referencia", { ascending: false }).order("mes_referencia", { ascending: false });
    
    return (data || []).map(f => ({
      "Código da Fatura": f.codigo_sequencial || "-",
      "Aluno": maps.alunos.get(f.aluno_id) || "-",
      "Responsável": f.responsavel_id ? (maps.responsaveis.get(f.responsavel_id) || "-") : "-",
      "Curso": maps.cursos.get(f.curso_id) || "-",
      "Mês/Ano Referência": `${getMonthName(f.mes_referencia)}/${f.ano_referencia}`,
      "Data de Emissão": f.data_emissao ? formatDate(f.data_emissao) : "-",
      "Data de Vencimento": f.data_vencimento ? formatDate(f.data_vencimento) : "-",
      "Valor Original": formatCurrency(f.valor_original || f.valor || 0),
      "Desconto": formatCurrency(f.valor_desconto_aplicado || 0),
      "Juros": formatCurrency(f.valor_juros_aplicado || 0),
      "Multa": formatCurrency(f.valor_multa_aplicado || 0),
      "Valor Total": formatCurrency(f.valor_total || f.valor || 0),
      "Status": formatStatus(f.status),
      "Dias em Atraso": f.dias_atraso || 0,
    }));
  };

  // Humanize pagamentos data
  const humanizePagamentos = async (maps: LookupMaps) => {
    const { data: pagamentos } = await supabase.from("pagamentos").select("*").order("data_pagamento", { ascending: false });
    const { data: faturas } = await supabase.from("faturas").select("id, codigo_sequencial, aluno_id, mes_referencia, ano_referencia");

    const faturaMap = new Map<string, { codigo: string; aluno: string; referencia: string }>();
    faturas?.forEach(f => {
      faturaMap.set(f.id, {
        codigo: f.codigo_sequencial || "-",
        aluno: maps.alunos.get(f.aluno_id) || "-",
        referencia: `${getMonthName(f.mes_referencia)}/${f.ano_referencia}`,
      });
    });

    return (pagamentos || []).map(p => {
      const fatura = faturaMap.get(p.fatura_id);
      return {
        "Código da Fatura": fatura?.codigo || "-",
        "Aluno": fatura?.aluno || "-",
        "Referência": fatura?.referencia || "-",
        "Data do Pagamento": p.data_pagamento ? formatDate(p.data_pagamento) : "-",
        "Valor Pago": formatCurrency(p.valor || 0),
        "Método de Pagamento": p.metodo || "-",
        "Desconto Aplicado": formatCurrency(p.desconto_aplicado || 0),
        "Juros Aplicado": formatCurrency(p.juros_aplicado || 0),
        "Multa Aplicada": formatCurrency(p.multa_aplicada || 0),
        "Tipo": p.tipo === "estorno" ? "Estorno" : "Pagamento",
      };
    });
  };

  // Humanize despesas data
  const humanizeDespesas = async () => {
    const { data } = await supabase.from("despesas").select("*").order("data_vencimento", { ascending: false });
    
    return (data || []).map(d => ({
      "Título": d.titulo || "-",
      "Categoria": d.categoria || "-",
      "Valor": formatCurrency(d.valor || 0),
      "Data de Vencimento": d.data_vencimento ? formatDate(d.data_vencimento) : "-",
      "Data do Pagamento": d.data_pagamento ? formatDate(d.data_pagamento) : "-",
      "Status": d.paga ? "Pago" : "Pendente",
      "Recorrente": d.recorrente ? "Sim" : "Não",
      "Observações": d.observacoes || "-",
    }));
  };

  // Humanize funcionarios data
  const humanizeFuncionarios = async (maps: LookupMaps) => {
    const { data } = await supabase.from("funcionarios").select("*");
    
    return (data || []).map(f => ({
      "Nome do Funcionário": f.nome_completo || "-",
      "CPF": f.cpf || "-",
      "RG": f.rg || "-",
      "Tipo": formatTipoFuncionario(f.tipo),
      "Cargo": f.cargo_id ? (maps.cargos.get(f.cargo_id) || "-") : "-",
      "Data de Admissão": f.data_admissao ? formatDate(f.data_admissao) : "-",
      "Data de Demissão": f.data_demissao ? formatDate(f.data_demissao) : "-",
      "Salário Base": formatCurrency(f.salario_base || 0),
      "Status": formatStatus(f.status),
      "Telefone": f.telefone || "-",
      "Email": f.email || "-",
      "Endereço": f.endereco || "-",
      "Data de Nascimento": f.data_nascimento ? formatDate(f.data_nascimento) : "-",
      "Observações": f.observacoes || "-",
      "Arquivo da Foto": f.foto_url ? `funcionarios/${f.nome_completo?.replace(/\s+/g, "_").toLowerCase()}_foto.jpg` : "-",
    }));
  };

  // Humanize cargos e setores
  const humanizeCargosSetores = async (maps: LookupMaps) => {
    const { data: cargos } = await supabase.from("cargos").select("*");
    const { data: setores } = await supabase.from("setores").select("*");

    const cargosData = (cargos || []).map(c => ({
      "Tipo": "Cargo",
      "Nome": c.nome || "-",
      "Descrição": c.descricao || "-",
      "Salário Base": formatCurrency(c.salario_base || 0),
      "Setor": c.setor_id ? (maps.setores.get(c.setor_id) || "-") : "-",
      "Status": c.ativo ? "Ativo" : "Inativo",
    }));

    const setoresData = (setores || []).map(s => ({
      "Tipo": "Setor",
      "Nome": s.nome || "-",
      "Descrição": s.descricao || "-",
      "Salário Base": "-",
      "Setor": "-",
      "Status": s.ativo ? "Ativo" : "Inativo",
    }));

    return [...setoresData, ...cargosData];
  };

  // Humanize contratos
  const humanizeContratos = async (maps: LookupMaps) => {
    const { data } = await supabase.from("contratos").select("*");
    
    return (data || []).map(c => ({
      "Funcionário": maps.funcionarios.get(c.funcionario_id) || "-",
      "Tipo de Contrato": formatContratoTipo(c.tipo),
      "Data de Início": c.data_inicio ? formatDate(c.data_inicio) : "-",
      "Data de Término": c.data_fim ? formatDate(c.data_fim) : "-",
      "Salário": formatCurrency(c.salario || 0),
      "Carga Horária (h/semana)": c.carga_horaria ?? "-",
      "Status": c.ativo ? "Ativo" : "Encerrado",
      "Observações": c.observacoes || "-",
    }));
  };

  // Humanize folha de pagamento
  const humanizeFolhaPagamento = async (maps: LookupMaps) => {
    const { data } = await supabase.from("folha_pagamento").select("*").order("ano_referencia", { ascending: false }).order("mes_referencia", { ascending: false });
    
    return (data || []).map(f => ({
      "Funcionário": maps.funcionarios.get(f.funcionario_id) || "-",
      "Mês/Ano": `${getMonthName(f.mes_referencia)}/${f.ano_referencia}`,
      "Salário Base": formatCurrency(f.salario_base || 0),
      "Horas Extras": formatCurrency(f.horas_extras_valor || 0),
      "Bonificações": formatCurrency(f.bonificacoes || 0),
      "Adicional Noturno": formatCurrency(f.adicional_noturno || 0),
      "Adicional Periculosidade": formatCurrency(f.adicional_periculosidade || 0),
      "Outros Adicionais": formatCurrency(f.outros_adicionais || 0),
      "Total Bruto": formatCurrency(f.total_bruto || 0),
      "INSS": formatCurrency(f.inss || 0),
      "IRRF": formatCurrency(f.irrf || 0),
      "FGTS": formatCurrency(f.fgts || 0),
      "Faltas/Atrasos": formatCurrency(f.faltas_atrasos || 0),
      "Outros Descontos": formatCurrency(f.descontos || 0),
      "Total Líquido": formatCurrency(f.total_liquido || 0),
      "Status": f.pago ? "Pago" : "Pendente",
      "Data do Pagamento": f.data_pagamento ? formatDate(f.data_pagamento) : "-",
    }));
  };

  // Humanize ponto eletrônico
  const humanizePonto = async (maps: LookupMaps) => {
    const { data } = await supabase.from("ponto_registros").select("*").order("data", { ascending: false });
    
    return (data || []).map(p => ({
      "Funcionário": maps.funcionarios.get(p.funcionario_id) || "-",
      "Data": p.data ? formatDate(p.data) : "-",
      "Entrada": p.entrada || "-",
      "Saída Almoço": p.saida_almoco || "-",
      "Retorno Almoço": p.retorno_almoco || "-",
      "Saída": p.saida || "-",
      "Horas Trabalhadas": p.horas_trabalhadas || "-",
      "Horas Extras": p.horas_extras || "-",
      "Localização Válida": p.localizacao_valida ? "Sim" : "Não",
      "Observações": p.observacoes || "-",
    }));
  };

  // Create XLSX workbook for a module
  const createWorkbook = (data: any[], moduleName: string) => {
    const workbook = XLSX.utils.book_new();
    
    if (data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Auto-size columns
      const maxWidth = 50;
      const cols = Object.keys(data[0]).map(key => ({
        wch: Math.min(
          Math.max(
            key.length + 2,
            ...data.map(row => String(row[key] || "").length)
          ),
          maxWidth
        )
      }));
      worksheet["!cols"] = cols;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    }
    
    return workbook;
  };

  // Create PDF for a module
  const createPDF = (data: any[], moduleName: string) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const now = new Date();
    const timestamp = now.toLocaleString("pt-BR");
    
    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Relatório: ${moduleName}`, 14, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${timestamp}`, 14, 22);
    doc.text(`Total de registros: ${data.length}`, 14, 27);

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => String(row[h] || "-")));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 7,
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 6,
          textColor: 50,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 10, right: 10 },
        tableWidth: "auto",
        styles: {
          overflow: "linebreak",
          cellPadding: 1.5,
        },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Página ${i} de ${pageCount} - Sistema MARANATA`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }

    return doc;
  };

  // Download file from Supabase storage
  const downloadFile = async (url: string): Promise<Blob | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  };

  // Main export function
  const handleExport = async () => {
    if (selectedModules.size === 0) {
      toast.error("Selecione pelo menos um módulo para exportar");
      return;
    }

    setExporting(true);
    setProgress(0);
    setExportComplete(false);

    try {
      const zip = new JSZip();
      const planilhasFolder = zip.folder("planilhas");
      const arquivosFolder = zip.folder("arquivos");
      
      setCurrentStep("Preparando dados de referência...");
      const maps = await buildLookupMaps();
      setProgress(10);

      const selectedList = Array.from(selectedModules);
      const totalModules = selectedList.length;
      let completed = 0;

      // Process each module
      for (const moduleId of selectedList) {
        const module = exportModules.find(m => m.id === moduleId);
        if (!module) continue;

        setCurrentStep(`Processando: ${module.name}...`);
        
        let data: any[] = [];
        let fileName = "";

        switch (moduleId) {
          case "escola":
            data = await humanizeEscola();
            fileName = "escola";
            break;
          case "usuarios":
            data = await humanizeUsuarios();
            fileName = "usuarios";
            break;
          case "alunos":
            data = await humanizeAlunos(maps);
            fileName = "alunos";
            break;
          case "responsaveis":
            data = await humanizeResponsaveis(maps);
            fileName = "responsaveis";
            break;
          case "cursos":
            data = await humanizeCursos();
            fileName = "cursos";
            break;
          case "turmas":
            data = await humanizeTurmas();
            fileName = "turmas";
            break;
          case "faturas":
            data = await humanizeFaturas(maps);
            fileName = "faturas";
            break;
          case "pagamentos":
            data = await humanizePagamentos(maps);
            fileName = "pagamentos";
            break;
          case "despesas":
            data = await humanizeDespesas();
            fileName = "despesas";
            break;
          case "funcionarios":
            data = await humanizeFuncionarios(maps);
            fileName = "funcionarios";
            // Download fotos
            const { data: funcionarios } = await supabase.from("funcionarios").select("nome_completo, foto_url");
            for (const f of funcionarios || []) {
              if (f.foto_url) {
                const blob = await downloadFile(f.foto_url);
                if (blob) {
                  const safeName = f.nome_completo?.replace(/\s+/g, "_").toLowerCase() || "funcionario";
                  arquivosFolder?.folder("funcionarios")?.file(`${safeName}_foto.jpg`, blob);
                }
              }
            }
            break;
          case "cargos":
            data = await humanizeCargosSetores(maps);
            fileName = "cargos_setores";
            break;
          case "contratos":
            data = await humanizeContratos(maps);
            fileName = "contratos";
            break;
          case "folha_pagamento":
            data = await humanizeFolhaPagamento(maps);
            fileName = "folha_pagamento";
            break;
          case "ponto":
            data = await humanizePonto(maps);
            fileName = "ponto_eletronico";
            break;
        }

        if (data.length > 0) {
          if (exportFormat === "xlsx") {
            const workbook = createWorkbook(data, module.name);
            const xlsxBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            planilhasFolder?.file(`${fileName}.xlsx`, xlsxBuffer);
          } else {
            const pdf = createPDF(data, module.name);
            const pdfBlob = pdf.output("blob");
            planilhasFolder?.file(`${fileName}.pdf`, pdfBlob);
          }
        }

        completed++;
        setProgress(10 + Math.round((completed / totalModules) * 80));
      }

      // Add README
      const readme = `BACKUP DO SISTEMA MARANATA
========================

Data de Exportação: ${new Date().toLocaleString("pt-BR")}
Formato: ${exportFormat === "xlsx" ? "Excel (.xlsx)" : "PDF"}
Módulos Exportados: ${selectedList.length}

ESTRUTURA DO BACKUP:
- planilhas/ - Arquivos com dados exportados
- arquivos/ - Fotos e documentos baixados

MÓDULOS INCLUÍDOS:
${selectedList.map(id => {
  const m = exportModules.find(mod => mod.id === id);
  return `- ${m?.name || id}`;
}).join("\n")}

OBSERVAÇÕES:
- Os dados estão humanizados para facilitar leitura
- IDs internos foram substituídos por nomes reais
- Valores monetários estão formatados em Real (R$)
- Datas estão no formato brasileiro (DD/MM/AAAA)

Para migração manual, importe as planilhas no novo sistema.
`;
      zip.file("README.txt", readme);

      setCurrentStep("Gerando arquivo ZIP...");
      setProgress(95);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
      const zipFilename = `backup_maranata_${timestamp}.zip`;
      
      saveAs(zipBlob, zipFilename);

      setProgress(100);
      setExportComplete(true);
      toast.success("Backup gerado com sucesso!", {
        description: `Arquivo: ${zipFilename}`,
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erro ao gerar backup", {
        description: error.message,
      });
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "academico": return "Acadêmico";
      case "financeiro": return "Financeiro";
      case "administrativo": return "Administrativo";
      default: return category;
    }
  };

  const groupedModules = {
    academico: exportModules.filter(m => m.category === "academico"),
    financeiro: exportModules.filter(m => m.category === "financeiro"),
    administrativo: exportModules.filter(m => m.category === "administrativo"),
  };

  return (
    <div className="space-y-5">
      {/* Format Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Formato</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setExportFormat("xlsx")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
              exportFormat === "xlsx"
                ? "bg-primary/10 border-primary/30 text-foreground"
                : "bg-background border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => setExportFormat("pdf")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
              exportFormat === "pdf"
                ? "bg-primary/10 border-primary/30 text-foreground"
                : "bg-background border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant={allSelected ? "default" : "outline"}
          size="sm"
          onClick={toggleAll}
          className="h-7 text-xs"
        >
          {allSelected ? "Desmarcar" : "Selecionar tudo"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectCategory("academico")}
          className="h-7 text-xs"
        >
          Acadêmico
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectCategory("financeiro")}
          className="h-7 text-xs"
        >
          Financeiro
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectCategory("administrativo")}
          className="h-7 text-xs"
        >
          RH
        </Button>
      </div>

      {/* Module Selection */}
      <div className="space-y-4">
        {Object.entries(groupedModules).map(([category, modules]) => {
          const selectedCount = modules.filter(m => selectedModules.has(m.id)).length;
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {getCategoryLabel(category)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedCount}/{modules.length}
                </span>
              </div>
              
              <div className="grid gap-1.5 sm:grid-cols-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md border text-left transition-colors ${
                      selectedModules.has(module.id) 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-background border-border hover:border-primary/20"
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <Checkbox
                      checked={selectedModules.has(module.id)}
                      onCheckedChange={() => toggleModule(module.id)}
                      className="pointer-events-none"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {module.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Progress */}
      {exporting && (
        <div className="space-y-2 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{currentStep || "Preparando..."}</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Export Complete Message */}
      {exportComplete && !exporting && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p className="text-xs">Backup baixado com sucesso</p>
        </div>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={exporting || selectedModules.size === 0}
        className="w-full"
        size="sm"
      >
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            Gerando... {progress}%
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1.5" />
            Baixar backup ({selectedModules.size})
          </>
        )}
      </Button>
    </div>
  );
}
