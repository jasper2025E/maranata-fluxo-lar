import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Ban, 
  Printer, 
  QrCode, 
  Loader2,
  CheckCircle2,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateCarneCompacto } from "@/lib/carneCompactoGenerator";
import { Fatura, formatCurrency, useCancelarFatura } from "@/hooks/useFaturas";
import { useAsaas } from "@/hooks/useAsaas";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  faturas: Fatura[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsBar({ 
  selectedIds, 
  faturas, 
  onClearSelection,
  onActionComplete 
}: BulkActionsBarProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressValue, setProgressValue] = useState(0);
  
  const { createPayment } = useAsaas();
  const cancelMutation = useCancelarFatura();

  // Buscar escola do tenant atual para geração do carnê
  const { data: escola } = useQuery({
    queryKey: ["escola-bulk"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.tenant_id) return null;
      
      const { data } = await supabase
        .from("escola")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();
      return data;
    },
  });

  const selectedFaturas = faturas.filter(f => selectedIds.has(f.id));
  const selectedCount = selectedIds.size;
  
  const pendingCount = selectedFaturas.filter(
    f => f.status === "Aberta" || f.status === "Vencida"
  ).length;
  
  const totalValue = selectedFaturas.reduce((sum, f) => sum + (f.valor || 0), 0);

  if (selectedCount === 0) return null;

  const handleBulkCancel = async () => {
    if (!cancelMotivo.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    const pendingFaturas = selectedFaturas.filter(
      f => f.status === "Aberta" || f.status === "Vencida"
    );

    if (pendingFaturas.length === 0) {
      toast.error("Nenhuma fatura pendente selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let cancelled = 0;

    try {
      for (const fatura of pendingFaturas) {
        setProgressMessage(`Cancelando ${cancelled + 1} de ${pendingFaturas.length}...`);
        
        await cancelMutation.mutateAsync({ 
          id: fatura.id, 
          motivo: cancelMotivo.trim() 
        });
        
        cancelled++;
        setProgressValue((cancelled / pendingFaturas.length) * 100);
      }

      toast.success(`${cancelled} fatura(s) cancelada(s) com sucesso!`);
      onClearSelection();
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao cancelar algumas faturas");
    } finally {
      setIsProcessing(false);
      setIsCancelDialogOpen(false);
      setCancelMotivo("");
      setProgressMessage("");
    }
  };

  const handleGenerateCarne = async () => {
    if (!escola) {
      toast.error("Dados da escola não encontrados");
      return;
    }

    const pendingFaturas = selectedFaturas.filter(
      f => f.status !== "Cancelada"
    );

    if (pendingFaturas.length === 0) {
      toast.error("Nenhuma fatura válida selecionada");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;

    try {
      // Primeiro, criar cobranças Asaas para faturas que não têm
      const faturasWithoutAsaas = pendingFaturas.filter(
        f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
      );

      if (faturasWithoutAsaas.length > 0) {
        setProgressMessage(`Gerando cobranças Asaas (0/${faturasWithoutAsaas.length})...`);
        
        for (const fatura of faturasWithoutAsaas) {
          try {
            await createPayment(fatura.id, "UNDEFINED");
          } catch (err) {
            console.warn(`Erro ao criar cobrança para fatura ${fatura.id}:`, err);
          }
          processed++;
          setProgressMessage(`Gerando cobranças Asaas (${processed}/${faturasWithoutAsaas.length})...`);
          setProgressValue((processed / (faturasWithoutAsaas.length + 1)) * 50);
        }
      }

      // Buscar faturas atualizadas com dados do Asaas
      setProgressMessage("Buscando dados atualizados...");
      const { data: updatedFaturas } = await supabase
        .from("faturas")
        .select(`
          *,
          alunos:aluno_id (nome_completo, email_responsavel, responsavel_id),
          cursos:curso_id (nome),
          responsaveis:responsavel_id (nome, cpf, telefone)
        `)
        .in("id", pendingFaturas.map(f => f.id));

      if (!updatedFaturas || updatedFaturas.length === 0) {
        throw new Error("Não foi possível buscar faturas atualizadas");
      }

      setProgressMessage("Gerando PDF do carnê...");
      setProgressValue(90);

      await generateCarneCompacto(
        updatedFaturas as unknown as Fatura[],
        {
          nome: escola.nome,
          endereco: escola.endereco || "",
          telefone: escola.telefone || "",
          email: escola.email || "",
          cnpj: escola.cnpj || "",
          logo_url: escola.logo_url || undefined,
        }
      );

      setProgressValue(100);
      toast.success(`Carnê gerado com ${updatedFaturas.length} fatura(s)!`);
      onClearSelection();
    } catch (error: any) {
      console.error("Erro ao gerar carnê:", error);
      toast.error(error.message || "Erro ao gerar carnê");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  const handleGenerateAsaas = async () => {
    const faturasWithoutAsaas = selectedFaturas.filter(
      f => !f.asaas_payment_id && (f.status === "Aberta" || f.status === "Vencida")
    );

    if (faturasWithoutAsaas.length === 0) {
      toast.info("Todas as faturas selecionadas já têm cobrança Asaas");
      return;
    }

    setIsProcessing(true);
    setProgressValue(0);
    let processed = 0;
    let success = 0;

    try {
      for (const fatura of faturasWithoutAsaas) {
        setProgressMessage(`Gerando cobrança ${processed + 1} de ${faturasWithoutAsaas.length}...`);
        
        try {
          await createPayment(fatura.id, "UNDEFINED");
          success++;
        } catch (err) {
          console.warn(`Erro na fatura ${fatura.id}:`, err);
        }
        
        processed++;
        setProgressValue((processed / faturasWithoutAsaas.length) * 100);
      }

      toast.success(`${success} cobrança(s) Asaas gerada(s)!`);
      onActionComplete();
    } catch (error) {
      toast.error("Erro ao gerar cobranças");
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-muted/50 border rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-semibold">
            {selectedCount}
          </Badge>
          <span className="text-muted-foreground">
            selecionada{selectedCount !== 1 && "s"} • {formatCurrency(totalValue)}
          </span>
        </div>

        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{progressMessage}</span>
            <Progress value={progressValue} className="h-1.5 w-24" />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateCarne}
              className="h-8 gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Carnê
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAsaas}
              disabled={pendingCount === 0}
              className="h-8 gap-1.5 text-xs"
            >
              <QrCode className="h-3.5 w-3.5" />
              PIX/Boleto
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={pendingCount === 0}
              className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Ban className="h-3.5 w-3.5" />
              Cancelar
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar {pendingCount} fatura(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. As faturas selecionadas serão 
              marcadas como canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo do cancelamento</Label>
            <Input
              id="motivo"
              placeholder="Informe o motivo..."
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkCancel}
              disabled={isProcessing || !cancelMotivo.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
