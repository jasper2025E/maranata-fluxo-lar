import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileTabProps {
  user: User | null;
  role: string | null;
  avatarUrl: string | null;
  setAvatarUrl: (url: string) => void;
}

const roleLabels: Record<string, string> = {
  platform_admin: "Gestor da Plataforma",
  admin: "Administrador",
  staff: "Funcionário",
  financeiro: "Financeiro",
  secretaria: "Secretaria",
};

export function ProfileTab({ user, role, avatarUrl, setAvatarUrl }: ProfileTabProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("nome, email")
        .eq("id", user.id)
        .maybeSingle();
      
      if (!error && data) {
        const name = data.nome || user.email?.split("@")[0] || "";
        setProfileName(name);
        setEditName(name);
        setProfileEmail(data.email || user.email || "");
      } else {
        const name = user.email?.split("@")[0] || "";
        setProfileName(name);
        setEditName(name);
        setProfileEmail(user.email || "");
      }
    };
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    setHasChanges(editName !== profileName);
  }, [editName, profileName]);

  const handleSave = async () => {
    if (!user || !editName.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nome: editName.trim() })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setProfileName(editName.trim());
      setHasChanges(false);
      toast.success("Perfil atualizado");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
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
      toast.success("Foto atualizada");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao atualizar foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString("pt-BR", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      })
    : "-";

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-5">
          <div className="relative group">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
              <AvatarFallback className="text-lg font-medium bg-muted text-muted-foreground">
                {profileName?.substring(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
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
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-base font-medium text-foreground">{profileName}</h3>
            <p className="text-sm text-muted-foreground">{profileEmail}</p>
            <p className="text-xs text-muted-foreground">
              {role ? roleLabels[role] : "Usuário"} · Membro desde {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Detalhes do perfil</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Nome</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Seu nome"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">E-mail</Label>
              <Input
                value={profileEmail}
                disabled
                className="h-9 bg-muted/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Função</Label>
              <Input
                value={role ? roleLabels[role] : "Usuário"}
                disabled
                className="h-9 bg-muted/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Último acesso</Label>
              <Input
                value={user?.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) 
                  : "-"
                }
                disabled
                className="h-9 bg-muted/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            size="sm"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
