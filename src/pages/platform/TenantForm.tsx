import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import PlatformLayout from "@/components/platform/PlatformLayout";

interface TenantForm {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  plano: string;
  status: string;
  limite_alunos: number;
  limite_usuarios: number;
}

export default function TenantForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPlatformAdmin } = useAuth();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TenantForm>({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    plano: "basic",
    status: "ativo",
    limite_alunos: 100,
    limite_usuarios: 5,
  });

  useEffect(() => {
    if (!isPlatformAdmin()) {
      navigate("/dashboard");
      return;
    }
    if (isEditing) {
      fetchTenant();
    }
  }, [isPlatformAdmin, navigate, id]);

  const fetchTenant = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        nome: data.nome,
        cnpj: data.cnpj || "",
        email: data.email || "",
        telefone: data.telefone || "",
        endereco: data.endereco || "",
        plano: data.plano,
        status: data.status,
        limite_alunos: data.limite_alunos,
        limite_usuarios: data.limite_usuarios,
      });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      toast.error("Erro ao carregar dados da escola");
      navigate("/platform/tenants");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from("tenants")
          .update({
            nome: form.nome,
            cnpj: form.cnpj || null,
            email: form.email || null,
            telefone: form.telefone || null,
            endereco: form.endereco || null,
            plano: form.plano,
            status: form.status,
            limite_alunos: form.limite_alunos,
            limite_usuarios: form.limite_usuarios,
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Escola atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("tenants")
          .insert({
            nome: form.nome,
            cnpj: form.cnpj || null,
            email: form.email || null,
            telefone: form.telefone || null,
            endereco: form.endereco || null,
            plano: form.plano,
            status: form.status,
            limite_alunos: form.limite_alunos,
            limite_usuarios: form.limite_usuarios,
          });

        if (error) throw error;
        toast.success("Escola criada com sucesso");
      }
      navigate("/platform/tenants");
    } catch (error) {
      console.error("Error saving tenant:", error);
      toast.error("Erro ao salvar escola");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-400">Carregando...</p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/platform/tenants")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {isEditing ? "Editar Escola" : "Nova Escola"}
            </h1>
            <p className="text-slate-400">
              {isEditing ? "Atualize os dados da escola" : "Cadastre uma nova escola na plataforma"}
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit}>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados da Escola
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Informações básicas da escola
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Nome *</Label>
                    <Input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome da escola"
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">CNPJ</Label>
                    <Input
                      value={form.cnpj}
                      onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@escola.com"
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Telefone</Label>
                    <Input
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Endereço</Label>
                  <Input
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Endereço completo"
                    className="bg-slate-900/50 border-slate-700 text-white"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Plano</Label>
                    <Select value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Limite de Alunos</Label>
                    <Input
                      type="number"
                      value={form.limite_alunos}
                      onChange={(e) => setForm({ ...form, limite_alunos: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Limite de Usuários</Label>
                    <Input
                      type="number"
                      value={form.limite_usuarios}
                      onChange={(e) => setForm({ ...form, limite_usuarios: parseInt(e.target.value) || 0 })}
                      className="bg-slate-900/50 border-slate-700 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/platform/tenants")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
