import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Funcionario, rhQueryKeys } from "@/hooks/useRH";
import { Link2, Copy, RefreshCw, QrCode, Check, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PontoLinkManagerProps {
  funcionario: Funcionario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PontoLinkManager({ funcionario, open, onOpenChange }: PontoLinkManagerProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const pontoLink = funcionario.ponto_token 
    ? `${window.location.origin}/ponto/${funcionario.ponto_token}`
    : null;

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_ponto_token', {
        p_funcionario_id: funcionario.id
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios });
      toast.success('Link gerado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    },
  });

  const copyToClipboard = async () => {
    if (!pontoLink) return;
    
    try {
      await navigator.clipboard.writeText(pontoLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const openLink = () => {
    if (pontoLink) {
      window.open(pontoLink, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link de Ponto Eletrônico
          </DialogTitle>
          <DialogDescription>
            Gere um link exclusivo para {funcionario.nome_completo} bater ponto pelo celular.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {pontoLink ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link do Funcionário</label>
                <div className="flex gap-2">
                  <Input 
                    value={pontoLink} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {funcionario.ponto_token_expires_at && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Expira em: {format(new Date(funcionario.ponto_token_expires_at), "dd/MM/yyyy")}
                  </Badge>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={openLink}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Testar Link
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => generateTokenMutation.mutate()}
                  disabled={generateTokenMutation.isPending}
                >
                  {generateTokenMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Renovar
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">📱 Como usar:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie o link acima</li>
                  <li>Envie para o funcionário via WhatsApp</li>
                  <li>O funcionário salva o link no celular</li>
                  <li>Basta abrir o link para bater ponto!</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum link de ponto configurado para este funcionário.
              </p>
              <Button 
                onClick={() => generateTokenMutation.mutate()}
                disabled={generateTokenMutation.isPending}
              >
                {generateTokenMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Gerar Link de Ponto
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
