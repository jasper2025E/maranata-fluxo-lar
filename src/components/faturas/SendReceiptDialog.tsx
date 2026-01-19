import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle, User, Calendar, Receipt } from "lucide-react";
import { Fatura, meses, formatCurrency, getValorFinal } from "@/hooks/useFaturas";
import { format } from "date-fns";

interface SendReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fatura: Fatura | null;
}

export function SendReceiptDialog({ open, onOpenChange, fatura }: SendReceiptDialogProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  // Pre-fill data when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && fatura) {
      // Try to get email from responsavel or aluno
      const email = fatura.responsaveis?.email || fatura.alunos?.email_responsavel || "";
      const name = fatura.responsaveis?.nome || "Responsável";
      setRecipientEmail(email);
      setRecipientName(name);
      setIsSent(false);
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!fatura) return;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast.error("Por favor, informe um email válido");
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Por favor, informe o nome do destinatário");
      return;
    }

    // Verificar se a fatura está paga
    if (fatura.status.toLowerCase() !== "paga") {
      toast.error("Só é possível enviar recibo de faturas pagas");
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-receipt-email", {
        body: {
          faturaId: fatura.id,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim(),
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setIsSent(true);
      toast.success("Recibo enviado com sucesso!");
      
      // Fechar após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao enviar recibo:", error);
      toast.error(error.message || "Erro ao enviar recibo");
    } finally {
      setIsSending(false);
    }
  };

  if (!fatura) return null;

  const mesReferencia = meses[fatura.mes_referencia - 1];
  const valorPago = getValorFinal(fatura);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Recibo por Email
          </DialogTitle>
          <DialogDescription>
            Envie o comprovante de pagamento para o responsável financeiro.
          </DialogDescription>
        </DialogHeader>

        {isSent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600">Email Enviado!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              O recibo foi enviado para {recipientEmail}
            </p>
          </div>
        ) : (
          <>
            {/* Resumo da Fatura */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Fatura:</span>
                <span className="font-medium">{fatura.codigo_sequencial || fatura.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Referência:</span>
                <span className="font-medium">{mesReferencia}/{fatura.ano_referencia}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Aluno:</span>
                <span className="font-medium">{fatura.alunos?.nome_completo}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t mt-2">
                <span className="text-sm text-muted-foreground">Valor Pago:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(valorPago)}</span>
              </div>
            </div>

            {/* Formulário */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nome do Destinatário</Label>
                <Input
                  id="recipientName"
                  placeholder="Nome completo"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email do Destinatário</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancelar
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Recibo
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
