import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Smartphone,
  Loader2,
  CheckCircle2,
  Copy,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  onStatusChange?: (enabled: boolean) => void;
}

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  
  // Setup dialog state
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  
  // Disable dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error("Error checking MFA status:", error);
        return;
      }

      const verifiedFactors = data.totp.filter((f) => f.status === "verified");
      setFactors(verifiedFactors as unknown as MFAFactor[]);
      const isEnabled = verifiedFactors.length > 0;
      setMfaEnabled(isEnabled);
      onStatusChange?.(isEnabled);
    } catch (error) {
      console.error("Error checking MFA:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Autenticador",
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setShowSetupDialog(true);
      }
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast.error(error.message || "Erro ao configurar 2FA");
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      toast.success("Autenticação de dois fatores ativada com sucesso!");
      setShowSetupDialog(false);
      setVerificationCode("");
      setQrCode("");
      setSecret("");
      await checkMFAStatus();
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      if (error.message?.includes("Invalid")) {
        toast.error("Código inválido. Verifique e tente novamente.");
      } else {
        toast.error(error.message || "Erro ao verificar código");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (factors.length === 0) return;

    setDisabling(true);
    try {
      // First verify the code
      const factor = factors[0];
      
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code: disableCode,
      });

      if (verifyError) throw verifyError;

      // Now unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) throw unenrollError;

      toast.success("Autenticação de dois fatores desativada");
      setShowDisableDialog(false);
      setDisableCode("");
      await checkMFAStatus();
    } catch (error: any) {
      console.error("Error disabling MFA:", error);
      if (error.message?.includes("Invalid")) {
        toast.error("Código inválido. Verifique e tente novamente.");
      } else {
        toast.error(error.message || "Erro ao desativar 2FA");
      }
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Chave copiada para a área de transferência");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Autenticação em dois fatores (2FA)</p>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </div>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center justify-between p-4 rounded-lg border ${
        mfaEnabled 
          ? "bg-success/5 border-success/20" 
          : "bg-muted/50"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${mfaEnabled ? "bg-success/10" : "bg-muted"}`}>
            {mfaEnabled ? (
              <ShieldCheck className="h-5 w-5 text-success" />
            ) : (
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm">Autenticação em dois fatores (2FA)</p>
            <p className="text-xs text-muted-foreground">
              {mfaEnabled 
                ? "Sua conta está protegida com 2FA" 
                : "Adicione uma camada extra de segurança"}
            </p>
          </div>
        </div>
        
        {mfaEnabled ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
              Ativo
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDisableDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-1" />
              Desativar
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleStartEnrollment} 
            disabled={enrolling}
            size="sm"
          >
            {enrolling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-1" />
            )}
            Ativar
          </Button>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Configurar Autenticação 2FA
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl shadow-inner border">
                {qrCode ? (
                  <QRCodeSVG value={qrCode} size={180} />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Ou digite a chave manualmente:
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={secret} 
                  readOnly 
                  className="font-mono text-xs bg-muted"
                />
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verification Code */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">
                Digite o código de 6 dígitos do app:
              </Label>
              <div className="flex gap-2">
                <Input
                  id="verification-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSetupDialog(false);
                setVerificationCode("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleVerifyAndEnable}
              disabled={verifying || verificationCode.length !== 6}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Verificar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldOff className="h-5 w-5" />
              Desativar Autenticação 2FA?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Desativar a autenticação de dois fatores tornará sua conta menos segura.
                Para confirmar, digite o código atual do seu app autenticador.
              </p>
              <div className="space-y-2">
                <Label htmlFor="disable-code">Código de verificação:</Label>
                <Input
                  id="disable-code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableCode("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={disabling || disableCode.length !== 6}
              className="bg-destructive hover:bg-destructive/90"
            >
              {disabling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Desativar 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
