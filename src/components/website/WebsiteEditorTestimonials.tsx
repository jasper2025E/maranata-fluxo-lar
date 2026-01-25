import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Quote, Plus, Trash2, Save, User } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { toast } from "sonner";

interface Testimonial {
  nome: string;
  cargo: string;
  texto: string;
  foto_url: string | null;
}

interface WebsiteEditorTestimonialsProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteEditorTestimonials({ config }: WebsiteEditorTestimonialsProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    config.testimonials || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Testimonial>({
    nome: "",
    cargo: "",
    texto: "",
    foto_url: null,
  });

  const addTestimonial = () => {
    if (!form.nome || !form.texto) {
      toast.error("Nome e depoimento são obrigatórios");
      return;
    }
    if (editingIndex !== null) {
      const updated = [...testimonials];
      updated[editingIndex] = form;
      setTestimonials(updated);
      setEditingIndex(null);
    } else {
      setTestimonials([...testimonials, form]);
    }
    setForm({ nome: "", cargo: "", texto: "", foto_url: null });
  };

  const editTestimonial = (index: number) => {
    setForm(testimonials[index]);
    setEditingIndex(index);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateWebsite.mutate({ testimonials });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Quote className="h-5 w-5" />
          Depoimentos
        </CardTitle>
        <CardDescription>
          Adicione depoimentos de pais, alunos ou ex-alunos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add/Edit Form */}
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <h4 className="font-medium text-sm">
            {editingIndex !== null ? "Editar Depoimento" : "Adicionar Novo Depoimento"}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome da pessoa"
              />
            </div>
            <div>
              <Label htmlFor="cargo">Relação com a escola</Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex: Mãe de aluno, Ex-aluno"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="texto">Depoimento *</Label>
            <Textarea
              id="texto"
              value={form.texto}
              onChange={(e) => setForm({ ...form, texto: e.target.value })}
              placeholder="O que essa pessoa disse sobre a escola..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="foto">URL da Foto (opcional)</Label>
            <Input
              id="foto"
              value={form.foto_url || ""}
              onChange={(e) => setForm({ ...form, foto_url: e.target.value || null })}
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addTestimonial} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {editingIndex !== null ? "Atualizar" : "Adicionar"}
            </Button>
            {editingIndex !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingIndex(null);
                  setForm({ nome: "", cargo: "", texto: "", foto_url: null });
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Testimonials List */}
        {testimonials.length > 0 ? (
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border rounded-lg bg-background"
              >
                <div className="h-12 w-12 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  {testimonial.foto_url ? (
                    <img
                      src={testimonial.foto_url}
                      alt={testimonial.nome}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{testimonial.nome}</h4>
                    {testimonial.cargo && (
                      <span className="text-sm text-muted-foreground">
                        • {testimonial.cargo}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    "{testimonial.texto}"
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editTestimonial(index)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTestimonial(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Quote className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum depoimento adicionado</p>
            <p className="text-sm">Depoimentos ajudam a gerar confiança nos visitantes</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateWebsite.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateWebsite.isPending ? "Salvando..." : "Salvar Depoimentos"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
