import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Save, ChevronRight, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const escolaSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  cnpj: z.string().max(20).optional(),
  endereco: z.string().max(500).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  ano_letivo: z.number().min(2000).max(2100),
});

interface Escola {
  id: string;
  nome: string;
  cnpj: string | null;
  logo_url: string | null;
  ano_letivo: number;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
}

const EscolaPage = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    ano_letivo: new Date().getFullYear(),
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [escolaId, setEscolaId] = useState<string | null>(null);

  const { data: escola, isLoading } = useQuery({
    queryKey: ["escola"],
    queryFn: async () => {
      // Primeiro, pegar o tenant_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      
      if (!profile?.tenant_id) return null;
      
      // Buscar escola do tenant específico
      const { data, error } = await supabase
        .from("escola")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();
      if (error) throw error;
      return data as Escola | null;
    },
  });

  useEffect(() => {
    if (escola) {
      setFormData({
        nome: escola.nome,
        cnpj: escola.cnpj || "",
        endereco: escola.endereco || "",
        telefone: escola.telefone || "",
        email: escola.email || "",
        ano_letivo: escola.ano_letivo,
      });
      setLogoUrl(escola.logo_url);
      setEscolaId(escola.id);
    }
  }, [escola]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { logo_url?: string | null }) => {
      const payload = {
        nome: data.nome,
        cnpj: data.cnpj || null,
        endereco: data.endereco || null,
        telefone: data.telefone || null,
        email: data.email || null,
        ano_letivo: data.ano_letivo,
        logo_url: data.logo_url,
      };

      if (escolaId) {
        const { error } = await supabase
          .from("escola")
          .update(payload)
          .eq("id", escolaId);
        if (error) throw error;
      } else {
        const { data: newEscola, error } = await supabase
          .from("escola")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setEscolaId(newEscola.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escola"] });
      toast.success("Dados salvos com sucesso");
    },
    onError: () => toast.error("Erro ao salvar dados"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = escolaSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    saveMutation.mutate({ ...formData, logo_url: logoUrl });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("escola-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("escola-assets")
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success("Logo atualizada");
    } catch (error) {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Configurações</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Escola</span>
        </nav>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Card */}
          <div className="bg-card border border-border rounded-lg">
            {/* Logo Section */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start gap-5">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Label 
                    htmlFor="logo" 
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg"
                  >
                    <Camera className="h-5 w-5 text-white" />
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </Label>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <Label htmlFor="nome" className="text-sm font-medium">
                      Nome da escola
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome da instituição"
                      className="h-9"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-sm font-medium">
                    CNPJ
                  </Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ano_letivo" className="text-sm font-medium">
                    Ano letivo
                  </Label>
                  <Input
                    id="ano_letivo"
                    type="number"
                    value={formData.ano_letivo}
                    onChange={(e) => setFormData({ ...formData, ano_letivo: parseInt(e.target.value) })}
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco" className="text-sm font-medium">
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefone" className="text-sm font-medium">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@escola.com.br"
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              size="sm"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EscolaPage;
