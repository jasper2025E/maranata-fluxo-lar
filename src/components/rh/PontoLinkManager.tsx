import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Funcionario, rhQueryKeys } from "@/hooks/useRH";
import { Link2, Copy, RefreshCw, QrCode, Check, ExternalLink, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface PontoLinkManagerProps {
  funcionario: Funcionario;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PontoLinkManager({ funcionario, open, onOpenChange }: PontoLinkManagerProps) {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(funcionario.ponto_token ?? null);
  const queryClient = useQueryClient();

  // Mantém o modal atualizado mesmo quando o state do funcionário foi capturado antes do refetch
  useEffect(() => {
    setToken(funcionario.ponto_token ?? null);
  }, [funcionario.id, funcionario.ponto_token]);

  const pontoLink = token ? `${window.location.origin}/ponto/${token}` : null;

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_ponto_token", {
        p_funcionario_id: funcionario.id,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (newToken) => {
      setToken(newToken);
      queryClient.invalidateQueries({ queryKey: rhQueryKeys.funcionarios });
      toast.success("Link gerado com sucesso!");
    },
    onError: (err: any) => {
      console.error("Erro ao gerar link de ponto:", err);
      toast.error(err?.message ? `Erro ao gerar link: ${err.message}` : "Erro ao gerar link");
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

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-ponto-${funcionario.nome_completo.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    toast.success('QR Code baixado!');
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
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">
                  <Link2 className="h-4 w-4 mr-2" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="qrcode">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
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
              </TabsContent>
              
              <TabsContent value="qrcode" className="space-y-4 mt-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCodeSVG 
                      id="qr-code-svg"
                      value={pontoLink} 
                      size={200}
                      level="H"
                      includeMargin
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    {funcionario.nome_completo}
                  </p>

                  {funcionario.ponto_token_expires_at && (
                    <Badge variant="outline" className="text-xs">
                      Expira em: {format(new Date(funcionario.ponto_token_expires_at), "dd/MM/yyyy")}
                    </Badge>
                  )}
                  
                  <Button onClick={downloadQRCode} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar QR Code
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">📷 Como usar:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Baixe ou imprima o QR Code</li>
                    <li>Entregue ao funcionário</li>
                    <li>Ele escaneia com a câmera do celular</li>
                    <li>Abre automaticamente a página de ponto!</li>
                  </ol>
                </div>
              </TabsContent>
            </Tabs>
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
