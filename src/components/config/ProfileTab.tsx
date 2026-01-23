import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User as UserIcon, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  Camera, 
  Upload,
  Mail,
  Calendar,
  BadgeCheck,
  Save,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  user: User | null;
  role: string | null;
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
}

const roleLabels: Record<string, string> = {
  platform_admin: "Platform Admin",
  admin: "Administrador",
  staff: "Funcionário",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

const roleColors: Record<string, string> = {
  platform_admin: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30",
  admin: "bg-primary/10 text-primary border-primary/20",
  staff: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  financeiro: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  secretaria: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const accessLevelLabels: Record<string, string> = {
  platform_admin: "Total",
  admin: "Completo",
  staff: "Padrão",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

export function ProfileTab({ user, role, avatarUrl, setAvatarUrl }: ProfileTabProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email")
        .eq("id", user.id)
        .maybeSingle();
      
      if (!error && data) {
        setProfileName(data.nome || user.email?.split("@")[0] || "");
        setProfileEmail(data.email || user.email || "");
      } else {
        setProfileName(user.email?.split("@")[0] || "");
        setProfileEmail(user.email || "");
      }
    };
    
    fetchProfile();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !editName.trim()) return;
    
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome: editName.trim() })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfileName(editName.trim());
      setIsEditingName(false);
      toast.success("Nome atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating name:", error);
      toast.error("Erro ao atualizar nome");
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao atualizar foto de perfil");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={avatarUrl || undefined} alt="Foto de perfil" />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {profileName?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 w-48"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={handleSaveName}
                      disabled={savingName}
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">{profileName}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditName(profileName);
                        setIsEditingName(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm font-medium text-foreground">{profileEmail}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className={role ? roleColors[role] : ""}>
                  <Shield className="h-3 w-3 mr-1" />
                  {role ? roleLabels[role] : "Usuário"}
                </Badge>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Conta verificada
                </Badge>
              </div>
            </div>
            <label htmlFor="avatar-upload-btn">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                disabled={uploadingAvatar}
                asChild
              >
                <span>
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Alterar foto
                </span>
              </Button>
            </label>
            <input
              id="avatar-upload-btn"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="h-5 w-5 text-primary" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Detalhes da sua conta no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Nome
              </Label>
              <Input 
                value={profileName} 
                disabled 
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={profileEmail} 
                  disabled 
                  className="bg-muted/50"
                />
                <Badge variant="outline" className="gap-1 shrink-0 bg-success/10 text-success border-success/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Verificado
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Função no Sistema
              </Label>
              <Input 
                value={role ? roleLabels[role] : "Usuário"} 
                disabled 
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membro desde
              </Label>
              <Input 
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                }) : "-"} 
                disabled 
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Último acesso
              </Label>
              <Input 
                value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "-"} 
                disabled 
                className="bg-muted/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className={cn(
          "border shadow-sm",
          role === "platform_admin" && "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-full",
                role === "platform_admin" 
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20" 
                  : "bg-primary/10"
              )}>
                <Shield className={cn(
                  "h-5 w-5",
                  role === "platform_admin" ? "text-amber-600" : "text-primary"
                )} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nível de acesso</p>
                <p className={cn(
                  "text-lg font-semibold",
                  role === "platform_admin" && "text-amber-600"
                )}>
                  {role ? accessLevelLabels[role] || roleLabels[role] || "Básico" : "Básico"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status da conta</p>
                <p className="text-lg font-semibold text-success">Ativa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo de uso</p>
                <p className="text-lg font-semibold">
                  {user?.created_at 
                    ? `${Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias`
                    : "-"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
