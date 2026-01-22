import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Fatura, formatCurrency, meses } from "@/hooks/useFaturas";
import { format } from "date-fns";
import { 
  Building2, 
  User, 
  Calendar, 
  QrCode, 
  Barcode,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileStack,
  LayoutGrid
} from "lucide-react";
import type { CarneLayout } from "./CarneDialog";

interface EscolaInfo {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
  logo_url?: string | null;
}

interface Responsavel {
  id: string;
  nome: string;
  cpf: string | null;
}

interface CarnePreviewProps {
  faturas: Fatura[];
  escola: EscolaInfo | null;
  responsavel: Responsavel | null;
  integrarAsaas: boolean;
  carneLayout: CarneLayout;
}

export function CarnePreview({ faturas, escola, responsavel, integrarAsaas, carneLayout }: CarnePreviewProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "paga":
        return { 
          color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircle2,
          label: "Paga"
        };
      case "vencida":
        return { 
          color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          icon: AlertCircle,
          label: "Vencida"
        };
      default:
        return { 
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: Clock,
          label: "Aberta"
        };
    }
  };

  const valorTotal = faturas.reduce((acc, f) => acc + (f.valor_total || f.valor), 0);
  const faturasPagas = faturas.filter(f => f.status.toLowerCase() === "paga").length;
  const faturasAbertas = faturas.filter(f => f.status.toLowerCase() !== "paga").length;

  const paginasNecessarias = carneLayout === "compacto" 
    ? Math.ceil(faturas.length / 3) 
    : faturas.length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="p-3 text-center bg-muted/30">
          <p className="text-2xl font-bold text-primary">{faturas.length}</p>
          <p className="text-xs text-muted-foreground">Faturas</p>
        </Card>
        <Card className="p-3 text-center bg-success/10">
          <p className="text-2xl font-bold text-success">{faturasPagas}</p>
          <p className="text-xs text-muted-foreground">Pagas</p>
        </Card>
        <Card className="p-3 text-center bg-warning/10">
          <p className="text-2xl font-bold text-warning">{faturasAbertas}</p>
          <p className="text-xs text-muted-foreground">Abertas</p>
        </Card>
        <Card className="p-3 text-center bg-secondary/10">
          <p className="text-2xl font-bold text-secondary-foreground">{paginasNecessarias}</p>
          <p className="text-xs text-muted-foreground">Páginas</p>
        </Card>
      </div>

      {/* Layout Info */}
      <Card className="p-3 flex items-center gap-3 border-dashed">
        {carneLayout === "compacto" ? (
          <>
            <LayoutGrid className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Layout Econômico</p>
              <p className="text-xs text-muted-foreground">3 carnês por página A4 • Economia de {Math.max(0, faturas.length - paginasNecessarias)} páginas</p>
            </div>
          </>
        ) : (
          <>
            <FileStack className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Layout Individual</p>
              <p className="text-xs text-muted-foreground">1 carnê por página (105x210mm)</p>
            </div>
          </>
        )}
      </Card>

      {/* Header - Escola */}
      <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start gap-3">
          {escola?.logo_url ? (
            <img 
              src={escola.logo_url} 
              alt="Logo" 
              className="h-12 w-12 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{escola?.nome || "Escola"}</h3>
            {escola?.cnpj && (
              <p className="text-xs text-muted-foreground">CNPJ: {escola.cnpj}</p>
            )}
            {escola?.endereco && (
              <p className="text-xs text-muted-foreground truncate">{escola.endereco}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Responsável */}
      {responsavel && (
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-medium">{responsavel.nome}</p>
              {responsavel.cpf && (
                <p className="text-xs text-muted-foreground">CPF: {responsavel.cpf}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Separator />

      {/* Lista de Faturas - Preview */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Preview das Faturas
        </h4>
        
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-2">
            {faturas.map((fatura, index) => {
              const statusConfig = getStatusConfig(fatura.status);
              const StatusIcon = statusConfig.icon;
              const hasAsaas = !!fatura.asaas_payment_id;
              
              return (
                <Card key={fatura.id} className="p-3 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Header da Fatura */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">
                          #{index + 1}
                        </span>
                        <span className="font-semibold">
                          {meses[fatura.mes_referencia - 1]} / {fatura.ano_referencia}
                        </span>
                        <Badge className={`text-xs ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      {/* Detalhes */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p className="truncate">
                          <span className="font-medium">Aluno:</span> {fatura.alunos?.nome_completo || "—"}
                        </p>
                        <p>
                          <span className="font-medium">Curso:</span> {fatura.cursos?.nome || "—"}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Venc: {format(new Date(fatura.data_vencimento), "dd/MM/yyyy")}
                          </span>
                          {fatura.codigo_sequencial && (
                            <span className="font-mono">{fatura.codigo_sequencial}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Indicadores de integração */}
                      {integrarAsaas && (
                        <div className="flex items-center gap-2 mt-2">
                          {hasAsaas ? (
                            <>
                              {fatura.asaas_pix_qrcode && (
                                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-200">
                                  <QrCode className="h-3 w-3" />
                                  PIX
                                </Badge>
                              )}
                              {fatura.asaas_boleto_barcode && (
                                <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-200">
                                  <Barcode className="h-3 w-3" />
                                  Boleto
                                </Badge>
                              )}
                            </>
                          ) : fatura.status.toLowerCase() !== "paga" ? (
                            <Badge variant="outline" className="text-xs gap-1 text-yellow-600 border-yellow-200">
                              <AlertCircle className="h-3 w-3" />
                              Será gerado
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                    
                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">
                        {formatCurrency(fatura.valor_total || fatura.valor)}
                      </p>
                      {fatura.valor_desconto_aplicado > 0 && (
                        <p className="text-xs text-green-600">
                          -{formatCurrency(fatura.valor_desconto_aplicado)}
                        </p>
                      )}
                      {fatura.valor_juros_aplicado > 0 && (
                        <p className="text-xs text-red-600">
                          +{formatCurrency(fatura.valor_juros_aplicado)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Valor Total */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <span className="font-medium">Valor Total do Carnê</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(valorTotal)}
          </span>
        </div>
      </Card>
    </div>
  );
}
