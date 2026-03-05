import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { TwoFactorSetup } from "./TwoFactorSetup";

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export function SecurityTab() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 20;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 20;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(passwordData.newPassword);
  const strengthLabel = passwordStrength <= 20 ? "Muito fraca" : 
                        passwordStrength <= 40 ? "Fraca" :
                        passwordStrength <= 60 ? "Média" :
                        passwordStrength <= 80 ? "Forte" : "Muito forte";

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse(passwordData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    show, 
    onToggle,
    hint 
  }: { 
    id: string; 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    show: boolean; 
    onToggle: () => void;
    hint?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="h-9 pr-10"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Alterar senha</h3>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
          <PasswordInput
            id="currentPassword"
            label="Senha atual"
            value={passwordData.currentPassword}
            onChange={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
            show={showCurrentPassword}
            onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
          />

          <PasswordInput
            id="newPassword"
            label="Nova senha"
            value={passwordData.newPassword}
            onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })}
            show={showNewPassword}
            onToggle={() => setShowNewPassword(!showNewPassword)}
            hint="Use pelo menos 8 caracteres com letras, números e símbolos."
          />

          {passwordData.newPassword && (
            <div className="flex items-center gap-2 text-xs">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    passwordStrength <= 40 ? 'bg-destructive' : 
                    passwordStrength <= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
              <span className="text-muted-foreground">{strengthLabel}</span>
            </div>
          )}

          <PasswordInput
            id="confirmPassword"
            label="Confirmar nova senha"
            value={passwordData.confirmPassword}
            onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
            show={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <p className="text-xs text-destructive">As senhas não coincidem</p>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={loading} size="sm">
              {loading ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </form>
      </div>

      {/* Two Factor Authentication */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Autenticação em dois fatores</h3>
        </div>
        <div className="p-6">
          <TwoFactorSetup onStatusChange={setMfaEnabled} />
        </div>
      </div>

      {/* Security Status */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Status de segurança</h3>
        </div>
        <div className="divide-y divide-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">E-mail verificado</p>
              <p className="text-xs text-muted-foreground">Conta protegida</p>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
              Ativo
            </span>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Autenticação 2FA</p>
              <p className="text-xs text-muted-foreground">Camada extra de proteção</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              mfaEnabled 
                ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                : 'text-muted-foreground bg-muted'
            }`}>
              {mfaEnabled ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
