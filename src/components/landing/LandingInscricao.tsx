import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Loader2, User, Users, CheckCircle2, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackLeadStart, trackInitiateCheckout, trackPurchase } from "./LandingPixels";
import type { LandingConfig } from "@/pages/LandingPage";

interface Curso {
  id: string;
  nome: string;
  nivel: string;
  mensalidade: number;
  duracao_meses: number;
  tenant_id?: string;
}

interface LandingInscricaoProps {
  config: LandingConfig;
  cursos: Curso[];
  tenantId?: string;
  utmParams: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
}

const alunoSchema = z.object({
  nome_completo: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  data_nascimento: z.string().optional(),
  curso_id: z.string().min(1, "Selecione um curso"),
});

const inscricaoSchema = z.object({
  // Responsável
  responsavel_nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  responsavel_cpf: z.string().min(11, "CPF inválido").max(14),
  responsavel_telefone: z.string().min(10, "Telefone inválido"),
  responsavel_email: z.string().email("E-mail inválido"),
  
  // Alunos
  alunos: z.array(alunoSchema).min(1, "Adicione pelo menos um aluno"),
  
  // Termos
  aceite_termos: z.boolean().refine(val => val === true, "Você deve aceitar os termos"),
});

type InscricaoFormValues = z.infer<typeof inscricaoSchema>;

type Step = "responsavel" | "alunos" | "confirmacao" | "sucesso";

export function LandingInscricao({ config, cursos, tenantId, utmParams }: LandingInscricaoProps) {
  const [step, setStep] = useState<Step>("responsavel");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InscricaoFormValues>({
    resolver: zodResolver(inscricaoSchema),
    defaultValues: {
      responsavel_nome: "",
      responsavel_cpf: "",
      responsavel_telefone: "",
      responsavel_email: "",
      alunos: [{ nome_completo: "", data_nascimento: "", curso_id: "" }],
      aceite_termos: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "alunos",
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularTotal = () => {
    const alunos = form.watch("alunos");
    return alunos.reduce((total, aluno) => {
      const curso = cursos.find(c => c.id === aluno.curso_id);
      return total + (curso?.mensalidade || 0);
    }, 0);
  };

  const handleNextStep = async () => {
    if (step === "responsavel") {
      const isValid = await form.trigger([
        "responsavel_nome",
        "responsavel_cpf",
        "responsavel_telefone",
        "responsavel_email",
      ]);
      if (isValid) {
        trackLeadStart();
        setStep("alunos");
      }
    } else if (step === "alunos") {
      const isValid = await form.trigger("alunos");
      if (isValid) {
        setStep("confirmacao");
        trackInitiateCheckout(calcularTotal());
      }
    }
  };

  const handlePreviousStep = () => {
    if (step === "alunos") setStep("responsavel");
    if (step === "confirmacao") setStep("alunos");
  };

  const onSubmit = async (data: InscricaoFormValues) => {
    setIsLoading(true);
    
    try {
      // Obter tenant_id do primeiro curso (todos são do mesmo tenant)
      const firstCurso = cursos.find(c => c.id === data.alunos[0]?.curso_id);
      const effectiveTenantId = tenantId || firstCurso?.tenant_id;

      if (!effectiveTenantId) {
        toast.error("Erro: escola não identificada");
        return;
      }

      // Usar edge function para registrar pré-matrícula
      const { data: result, error } = await supabase.functions.invoke('register-prematricula', {
        body: {
          responsavel: {
            nome: data.responsavel_nome,
            cpf: data.responsavel_cpf.replace(/\D/g, ""),
            telefone: data.responsavel_telefone,
            email: data.responsavel_email,
          },
          alunos: data.alunos.map(aluno => ({
            nome_completo: aluno.nome_completo,
            data_nascimento: aluno.data_nascimento || null,
            curso_id: aluno.curso_id,
          })),
          tenant_id: effectiveTenantId,
          utm_params: utmParams,
        },
      });

      if (error) throw error;

      if (result?.success) {
        trackPurchase(calcularTotal(), result.responsavel_id || "unknown");
        toast.success("Pré-matrícula registrada com sucesso!");
        setStep("sucesso");
      } else {
        throw new Error(result?.error || "Erro ao processar inscrição");
      }
    } catch (error: any) {
      console.error("Erro na inscrição:", error);
      toast.error(error.message || "Erro ao processar inscrição. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "sucesso") {
    return (
      <section id="inscricao" className="py-20 bg-background">
        <div className="container px-4">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Inscrição Realizada com Sucesso!
              </h2>
              <p className="text-muted-foreground mb-6">
                Obrigado por escolher o {config.escola.nome}. Você receberá um e-mail 
                com os detalhes da matrícula e próximos passos.
              </p>
              <div className="bg-muted rounded-lg p-4 text-sm text-left">
                <p className="font-medium mb-2">Próximos passos:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Verifique seu e-mail para confirmação</li>
                  <li>Aguarde o contato da nossa equipe</li>
                  <li>Prepare a documentação necessária</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="inscricao" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {config.inscricao.titulo}
          </h2>
          <p className="text-lg text-muted-foreground">
            {config.inscricao.subtitulo}
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[
              { id: "responsavel", label: "Responsável", icon: User },
              { id: "alunos", label: "Alunos", icon: Users },
              { id: "confirmacao", label: "Confirmação", icon: ClipboardCheck },
            ].map((s, index) => (
              <div key={s.id} className="flex items-center">
                <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step === s.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <s.icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </div>
                {index < 2 && (
                  <div className="w-8 h-0.5 bg-muted mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {step === "responsavel" && "Dados do Responsável"}
              {step === "alunos" && "Dados dos Alunos"}
              {step === "confirmacao" && "Confirmar Pré-Matrícula"}
            </CardTitle>
            <CardDescription>
              {step === "responsavel" && "Preencha seus dados pessoais"}
              {step === "alunos" && "Adicione os alunos que deseja matricular"}
              {step === "confirmacao" && "Revise os dados e confirme a pré-matrícula"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Responsável */}
                {step === "responsavel" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="responsavel_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="responsavel_cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000.000.000-00" 
                                {...field}
                                onChange={(e) => field.onChange(formatCPF(e.target.value))}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responsavel_telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                {...field}
                                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                                maxLength={15}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="responsavel_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Alunos */}
                {step === "alunos" && (
                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Aluno {index + 1}</Label>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name={`alunos.${index}.nome_completo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Aluno</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo do aluno" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`alunos.${index}.data_nascimento`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Nascimento</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`alunos.${index}.curso_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Curso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o curso" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {cursos.map((curso) => (
                                      <SelectItem key={curso.id} value={curso.id}>
                                        {curso.nome} - {formatCurrency(curso.mensalidade)}/mês
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => append({ nome_completo: "", data_nascimento: "", curso_id: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar outro aluno
                    </Button>
                  </div>
                )}

                {/* Step 3: Confirmação */}
                {step === "confirmacao" && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-4">Resumo da Inscrição</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Responsável:</span>
                          <span>{form.getValues("responsavel_nome")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">E-mail:</span>
                          <span>{form.getValues("responsavel_email")}</span>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        {form.getValues("alunos").map((aluno, index) => {
                          const curso = cursos.find(c => c.id === aluno.curso_id);
                          return (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{aluno.nome_completo} - {curso?.nome}</span>
                              <span className="font-medium">{formatCurrency(curso?.mensalidade || 0)}/mês</span>
                            </div>
                          );
                        })}
                      </div>

                      <Separator className="my-4" />

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Mensal:</span>
                        <span className="text-primary">{formatCurrency(calcularTotal())}</span>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="aceite_termos"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              Li e aceito os termos de matrícula e a política de privacidade
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-4 pt-4">
                  {step !== "responsavel" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                  )}

                  {step !== "confirmacao" ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1"
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Confirmar Pré-Matrícula
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
