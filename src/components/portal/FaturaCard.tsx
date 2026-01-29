import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Copy,
  ExternalLink,
  FileText,
  Check,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PortalFatura } from "@/hooks/usePortalResponsavel";

interface FaturaCardProps {
  fatura: PortalFatura;
  primaryColor?: string;
}

const statusConfig = {
  aberta: {
    label: "Aberta",
    icon: Clock,
    variant: "outline" as const,
    className: "border-amber-500 text-amber-600 bg-amber-50",
  },
  vencida: {
    label: "Vencida",
    icon: AlertCircle,
    variant: "destructive" as const,
    className: "bg-red-500",
  },
  paga: {
    label: "Paga",
    icon: CheckCircle,
    variant: "default" as const,
    className: "bg-green-500",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    variant: "secondary" as const,
    className: "bg-gray-500",
  },
};

export function FaturaCard({ fatura, primaryColor }: FaturaCardProps) {
  const [copied, setCopied] = useState(false);

  const config = statusConfig[fatura.status] || statusConfig.aberta;
  const StatusIcon = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const handleCopyPix = async () => {
    if (!fatura.pix_payload) return;

    try {
      await navigator.clipboard.writeText(fatura.pix_payload);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar. Tente novamente.");
    }
  };

  const handleOpenBoleto = () => {
    if (fatura.boleto_url) {
      window.open(fatura.boleto_url, "_blank");
    }
  };

  const handleOpenInvoice = () => {
    if (fatura.invoice_url) {
      window.open(fatura.invoice_url, "_blank");
    }
  };

  const isPending = fatura.status === "aberta" || fatura.status === "vencida";

  return (
    <Card className={`overflow-hidden ${fatura.status === "vencida" ? "border-red-200" : ""}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{fatura.referencia}</p>
            <p className="text-sm text-muted-foreground truncate">
              {fatura.aluno_nome}
            </p>
          </div>
          <Badge className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Valor e Vencimento */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(fatura.valor)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {fatura.status === "paga" ? "Pago em" : "Vencimento"}
            </p>
            <p className="text-sm font-medium">{formatDate(fatura.vencimento)}</p>
          </div>
        </div>

        {/* Ações para faturas pendentes */}
        {isPending && (
          <div className="flex flex-col gap-2">
            {/* PIX */}
            {fatura.pix_payload && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2 h-11"
                onClick={handleCopyPix}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Código PIX
                  </>
                )}
              </Button>
            )}

            {/* Boleto */}
            {fatura.boleto_url && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2 h-11"
                onClick={handleOpenBoleto}
              >
                <FileText className="h-4 w-4" />
                Ver Boleto
              </Button>
            )}

            {/* Link de Pagamento */}
            {fatura.invoice_url && (
              <Button
                className="w-full justify-center gap-2 h-11"
                onClick={handleOpenInvoice}
                style={{ backgroundColor: primaryColor }}
              >
                <ExternalLink className="h-4 w-4" />
                Pagar Online
              </Button>
            )}

            {/* Sem opções de pagamento */}
            {!fatura.pix_payload && !fatura.boleto_url && !fatura.invoice_url && (
              <p className="text-sm text-center text-muted-foreground py-2">
                Entre em contato com a escola para obter os dados de pagamento.
              </p>
            )}
          </div>
        )}

        {/* Fatura paga */}
        {fatura.status === "paga" && (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Pagamento confirmado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
