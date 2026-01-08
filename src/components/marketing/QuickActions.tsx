import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Zap, 
  QrCode,
  Share2,
  Check,
  BarChart3,
  Settings,
  Palette
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuickActions() {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const landingPageUrl = `${window.location.origin}/inscricao`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(landingPageUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inscrição Maranata',
          text: 'Faça sua inscrição no sistema Maranata',
          url: landingPageUrl,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTestPixels = () => {
    toast.info("Abrindo página em modo de teste...");
    window.open(`${landingPageUrl}?debug_pixels=true`, '_blank');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesse funcionalidades principais rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <a href="/inscricao" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-5 w-5" />
                <span className="text-sm">Ver Landing Page</span>
              </a>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              <span className="text-sm">Copiar Link</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="h-5 w-5" />
              <span className="text-sm">Gerar QR Code</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm">Compartilhar</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={handleTestPixels}
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">Testar Pixels</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <a href="#reports">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">Ver Relatórios</span>
              </a>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <a href="#editor">
                <Palette className="h-5 w-5" />
                <span className="text-sm">Editar Página</span>
              </a>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <a href="#config">
                <Settings className="h-5 w-5" />
                <span className="text-sm">Configurações</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code da Landing Page</DialogTitle>
            <DialogDescription>
              Escaneie para acessar a página de inscrição
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG 
                value={landingPageUrl}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all">
              {landingPageUrl}
            </p>
            <Button onClick={handleCopyLink} variant="outline" className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
