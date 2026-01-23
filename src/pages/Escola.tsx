import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Upload, Save, MapPin, Phone, Mail, Calendar, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

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
      const { data, error } = await supabase
        .from("escola")
        .select("*")
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
      toast.success("Dados da escola salvos com sucesso!");
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
      toast.success("Logo enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Configurações</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Dados da Escola</span>
        </nav>

        {/* Header */}
        <div>
          
          <p className="text-muted-foreground mt-1 text-sm">Configure as informações institucionais</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Main Info Card */}
            <Card className="md:col-span-2 border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>Dados principais da instituição</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-32 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-muted/50 overflow-hidden">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <Label htmlFor="logo" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Upload className="h-4 w-4" />
                        {uploading ? "Enviando..." : "Enviar Logo"}
                      </div>
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
                  <div className="flex-1 grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nome">Nome da Escola *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Escola Maranata"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="ano_letivo">Ano Letivo *</Label>
                        <Input
                          id="ano_letivo"
                          type="number"
                          value={formData.ano_letivo}
                          onChange={(e) => setFormData({ ...formData, ano_letivo: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden animate-fade-in">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(99) 99999-9999"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@escola.com.br"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-6">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending} 
              className="min-w-32 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EscolaPage;
