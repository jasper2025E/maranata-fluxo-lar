import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, QrCode, FileText, CreditCard, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAsaas } from "@/hooks/useAsaas";
import type { Fatura } from "@/hooks/useFaturas";

interface AsaasPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura | null;
  onSuccess?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const AsaasPaymentDialog = ({ open, onOpenChange, fatura, onSuccess }: AsaasPaymentDialogProps) => {
  const { isLoading, createPayment, getPayment } = useAsaas();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("pix");

  useEffect(() => {
    if (open && fatura) {
      loadPaymentData();
    }
  }, [open, fatura?.id]);

  const loadPaymentData = async () => {
    if (!fatura) return;

    // Se já tem cobrança, buscar dados
    if (fatura.asaas_payment_id) {
      const result = await getPayment(fatura.id);
      if (result.success) {
        setPaymentData(result);
      }
    } else {
      // Criar nova cobrança
      const result = await createPayment(fatura.id, "BOLETO");
      if (result.success) {
        setPaymentData(result);
        onSuccess?.();
      }
    }
  };

  const handleRefresh = async () => {
    await loadPaymentData();
    toast.success("Dados atualizados");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const openInvoice = () => {
    if (paymentData?.invoiceUrl) {
      window.open(paymentData.invoiceUrl, "_blank");
    }
  };

  if (!fatura) return null;

  const valor = fatura.valor_total || fatura.valor || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento via Asaas
          </DialogTitle>
          <DialogDescription>
            {fatura.alunos?.nome_completo} - {formatCurrency(valor)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : paymentData ? (
            <>
              <div className="flex items-center justify-between">
                <Badge variant={paymentData.payment?.status === "PENDING" ? "secondary" : "default"}>
                  Status: {paymentData.payment?.status || "PENDING"}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pix" className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    PIX
                  </TabsTrigger>
                  <TabsTrigger value="boleto" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Boleto
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Link
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pix">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pagar com PIX</CardTitle>
                      <CardDescription>Escaneie o QR Code ou copie o código</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentData.pixQrCode ? (
                        <>
                          <div className="flex justify-center">
                            <img
                              src={`data:image/png;base64,${paymentData.pixQrCode}`}
                              alt="QR Code PIX"
                              className="w-48 h-48 border rounded-lg"
                            />
                          </div>
                          {paymentData.pixPayload && (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground text-center">
                                PIX Copia e Cola:
                              </p>
                              <div className="flex gap-2">
                                <code className="flex-1 p-2 bg-muted rounded text-xs break-all max-h-20 overflow-y-auto">
                                  {paymentData.pixPayload}
                                </code>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(paymentData.pixPayload, "Código PIX")}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          QR Code PIX não disponível
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="boleto">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Pagar com Boleto</CardTitle>
                      <CardDescription>Copie a linha digitável ou baixe o boleto</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentData.boletoBarcode ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Linha digitável:</p>
                            <div className="flex gap-2">
                              <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                                {paymentData.boletoBarcode}
                              </code>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(paymentData.boletoBarcode, "Linha digitável")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {paymentData.boletoUrl && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(paymentData.boletoUrl, "_blank")}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Baixar Boleto PDF
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Boleto não disponível
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="link">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Link de Pagamento</CardTitle>
                      <CardDescription>Compartilhe o link com o responsável</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentData.invoiceUrl ? (
                        <>
                          <div className="flex gap-2">
                            <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                              {paymentData.invoiceUrl}
                            </code>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(paymentData.invoiceUrl, "Link")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button className="w-full" onClick={openInvoice}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Página de Pagamento
                          </Button>
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground">
                          Link não disponível
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-8">
              <Button onClick={loadPaymentData} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando cobrança...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Gerar Cobrança no Asaas
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
