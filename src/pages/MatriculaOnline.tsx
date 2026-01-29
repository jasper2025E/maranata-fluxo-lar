import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, AlertCircle, ArrowLeft, ArrowRight, Check, Plus, Trash2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PortalHeader, PortalFooter } from "@/components/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface TenantData {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
}

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
}

interface AlunoForm {
  nome_completo: string;
  data_nascimento: string;
  curso_id: string;
}

interface ResponsavelForm {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

export default function MatriculaOnline() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [responsavel, setResponsavel] = useState<ResponsavelForm>({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
  });
  
  const [alunos, setAlunos] = useState<AlunoForm[]>([
    { nome_completo: "", data_nascimento: "", curso_id: "" },
  ]);
  
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    async function loadTenantAndCursos() {
      if (!slug) {
        setTenantError("Escola não identificada");
        setIsLoadingTenant(false);
        return;
      }

      try {
        const { data: tenantData, error: tenantErr } = await supabase
          .rpc("get_tenant_by_slug", { p_slug: slug });

        if (tenantErr || !tenantData || tenantData.length === 0) {
          setTenantError("Escola não encontrada");
          setIsLoadingTenant(false);
          return;
        }

        const tenantInfo = tenantData[0];

        if (tenantInfo.blocked_at) {
          setTenantError("Esta escola não está disponível no momento");
          setIsLoadingTenant(false);
          return;
        }

        // Get additional info
        const { data: fullTenant } = await supabase
          .from("tenants")
          .select("slug, telefone, email, endereco")
          .eq("id", tenantInfo.id)
          .single();

        setTenant({
          id: tenantInfo.id,
          nome: tenantInfo.nome,
          slug: fullTenant?.slug || slug || "",
          logo_url: tenantInfo.logo_url,
          primary_color: tenantInfo.primary_color,
          secondary_color: tenantInfo.secondary_color,
          telefone: fullTenant?.telefone || null,
          email: fullTenant?.email || null,
          endereco: fullTenant?.endereco || null,
        });

        // Get available courses
        const { data: cursosData } = await supabase
          .from("cursos")
          .select("id, nome, nivel, mensalidade")
          .eq("tenant_id", tenantInfo.id)
          .eq("ativo", true)
          .order("nome");

        if (cursosData) {
          setCursos(cursosData);
        }
        
        setIsLoadingTenant(false);
      } catch (err) {
        console.error("Error loading tenant:", err);
        setTenantError("Erro ao carregar escola");
        setIsLoadingTenant(false);
      }
    }

    loadTenantAndCursos();
  }, [slug]);

  const handleResponsavelChange = (field: keyof ResponsavelForm, value: string) => {
    if (field === "cpf") {
      value = formatCPF(value);
      if (value.length > 14) return;
    }
    if (field === "telefone") {
      value = formatPhone(value);
      if (value.length > 15) return;
    }
    setResponsavel(prev => ({ ...prev, [field]: value }));
  };

  const handleAlunoChange = (index: number, field: keyof AlunoForm, value: string) => {
    setAlunos(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const addAluno = () => {
    if (alunos.length < 5) {
      setAlunos(prev => [...prev, { nome_completo: "", data_nascimento: "", curso_id: "" }]);
    }
  };

  const removeAluno = (index: number) => {
    if (alunos.length > 1) {
      setAlunos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    if (!responsavel.nome.trim() || responsavel.nome.length < 3) {
      toast.error("Informe o nome completo");
      return false;
    }
    if (responsavel.cpf.replace(/\D/g, "").length !== 11) {
      toast.error("Informe um CPF válido");
      return false;
    }
    if (!responsavel.email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return false;
    }
    if (responsavel.telefone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um telefone válido");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < alunos.length; i++) {
      if (!alunos[i].nome_completo.trim()) {
        toast.error(`Informe o nome do aluno ${i + 1}`);
        return false;
      }
      if (!alunos[i].curso_id) {
        toast.error(`Selecione o curso do aluno ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }
    if (!tenant) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("register-prematricula", {
        body: {
          responsavel: {
            nome: responsavel.nome,
            cpf: responsavel.cpf.replace(/\D/g, ""),
            telefone: responsavel.telefone,
            email: responsavel.email,
          },
          alunos: alunos.map(a => ({
            nome_completo: a.nome_completo,
            data_nascimento: a.data_nascimento || null,
            curso_id: a.curso_id,
          })),
          tenant_id: tenant.id,
        },
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Pré-matrícula enviada com sucesso!");
    } catch (err: any) {
      console.error("Error submitting:", err);
      toast.error(err.message || "Erro ao enviar pré-matrícula");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (isLoadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Escola não encontrada</h1>
          <p className="text-muted-foreground">{tenantError}</p>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.primary_color || "#3b82f6";

  const getCursoInfo = (cursoId: string) => cursos.find(c => c.id === cursoId);

  const totalMensalidade = alunos.reduce((sum, a) => {
    const curso = getCursoInfo(a.curso_id);
    return sum + (curso?.mensalidade || 0);
  }, 0);

  // Success screen
  if (submitted) {
    return (
      <>
        <Helmet>
          <title>Matrícula Enviada - {tenant.nome}</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <PortalHeader escolaNome={tenant.nome} escolaLogo={tenant.logo_url} primaryColor={primaryColor} />
          <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Pré-Matrícula Enviada!</h1>
                <p className="text-muted-foreground mb-6">
                  Sua solicitação foi recebida com sucesso. Em breve a escola entrará em contato para finalizar o processo.
                </p>
                <Button onClick={() => navigate(`/escola/${slug}`)} style={{ backgroundColor: primaryColor }}>
                  Voltar para o site
                </Button>
              </CardContent>
            </Card>
          </main>
          <PortalFooter escolaNome={tenant.nome} escolaLogo={tenant.logo_url} primaryColor={primaryColor} />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Matricule-se - {tenant.nome}</title>
        <meta name="description" content={`Faça sua matrícula online na ${tenant.nome}`} />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted/20">
        <PortalHeader escolaNome={tenant.nome} escolaLogo={tenant.logo_url} primaryColor={primaryColor} />

        <main className="flex-1 container py-8 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s <= step ? "text-white" : "bg-muted text-muted-foreground"
                    }`}
                    style={{ backgroundColor: s <= step ? primaryColor : undefined }}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={`w-12 h-0.5 ${s < step ? "bg-primary" : "bg-muted"}`} style={s < step ? { backgroundColor: primaryColor } : {}} />}
                </div>
              ))}
            </div>

            {/* Step 1: Responsável */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Responsável</CardTitle>
                  <CardDescription>Informações do responsável financeiro</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input id="nome" value={responsavel.nome} onChange={e => handleResponsavelChange("nome", e.target.value)} placeholder="Digite o nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input id="cpf" inputMode="numeric" value={responsavel.cpf} onChange={e => handleResponsavelChange("cpf", e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" type="email" value={responsavel.email} onChange={e => handleResponsavelChange("email", e.target.value)} placeholder="seu@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                    <Input id="telefone" inputMode="numeric" value={responsavel.telefone} onChange={e => handleResponsavelChange("telefone", e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Alunos */}
            {step === 2 && (
              <div className="space-y-4">
                {alunos.map((aluno, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Aluno {index + 1}</CardTitle>
                        {alunos.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeAluno(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Aluno *</Label>
                        <Input value={aluno.nome_completo} onChange={e => handleAlunoChange(index, "nome_completo", e.target.value)} placeholder="Nome completo do aluno" />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Nascimento</Label>
                        <Input type="date" value={aluno.data_nascimento} onChange={e => handleAlunoChange(index, "data_nascimento", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Curso/Turma *</Label>
                        <Select value={aluno.curso_id} onValueChange={value => handleAlunoChange(index, "curso_id", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos.map(curso => (
                              <SelectItem key={curso.id} value={curso.id}>
                                {curso.nome} - {curso.nivel} (R$ {curso.mensalidade.toFixed(2)}/mês)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {alunos.length < 5 && (
                  <Button variant="outline" className="w-full" onClick={addAluno}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outro aluno
                  </Button>
                )}
              </div>
            )}

            {/* Step 3: Confirmação */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirmação</CardTitle>
                  <CardDescription>Revise os dados antes de enviar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Responsável</h3>
                    <p className="text-sm">{responsavel.nome}</p>
                    <p className="text-sm text-muted-foreground">CPF: {responsavel.cpf}</p>
                    <p className="text-sm text-muted-foreground">{responsavel.email}</p>
                    <p className="text-sm text-muted-foreground">{responsavel.telefone}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Alunos</h3>
                    {alunos.map((aluno, i) => {
                      const curso = getCursoInfo(aluno.curso_id);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{aluno.nome_completo}</p>
                            <p className="text-sm text-muted-foreground">{curso?.nome} - {curso?.nivel}</p>
                          </div>
                          <p className="font-medium" style={{ color: primaryColor }}>
                            R$ {curso?.mensalidade.toFixed(2)}/mês
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Mensal Estimado:</span>
                      <span style={{ color: primaryColor }}>R$ {totalMensalidade.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Checkbox id="terms" checked={acceptTerms} onCheckedChange={(c) => setAcceptTerms(c === true)} />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Declaro que as informações prestadas são verdadeiras e concordo com os termos de uso e política de privacidade da escola.
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-6">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting || !acceptTerms} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Enviar Matrícula
                </Button>
              )}
            </div>
          </div>
        </main>

        <PortalFooter escolaNome={tenant.nome} escolaLogo={tenant.logo_url} primaryColor={primaryColor} />
      </div>
    </>
  );
}
