import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  nome_aluno: z.string().min(3, "Nome do aluno é obrigatório"),
  data_nascimento: z.string().optional(),
  nome_responsavel: z.string().min(3, "Nome do responsável é obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().optional(),
  curso_interesse: z.string().optional(),
  mensagem: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PreMatriculaFormProps {
  tenantId: string;
  primaryColor: string;
  fields?: string[];
}

export function PreMatriculaForm({ tenantId, primaryColor, fields = ["nome_aluno", "nome_responsavel", "email", "telefone"] }: PreMatriculaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_aluno: "",
      data_nascimento: "",
      nome_responsavel: "",
      email: "",
      telefone: "",
      curso_interesse: "",
      mensagem: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("prematricula_leads")
        .insert({
          tenant_id: tenantId,
          nome_aluno: data.nome_aluno,
          data_nascimento: data.data_nascimento || null,
          nome_responsavel: data.nome_responsavel,
          email: data.email,
          telefone: data.telefone || null,
          curso_interesse: data.curso_interesse || null,
          mensagem: data.mensagem || null,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error submitting pre-enrollment:", error);
      toast.error("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowField = (field: string) => fields.includes(field);

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <CheckCircle className="h-16 w-16 mx-auto mb-4" style={{ color: primaryColor }} />
        <h3 className="text-xl font-semibold mb-2">Inscrição Enviada!</h3>
        <p className="text-muted-foreground mb-4">
          Em breve entraremos em contato para dar continuidade à matrícula.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
        >
          Fazer Nova Inscrição
        </Button>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {shouldShowField("nome_aluno") && (
          <FormField
            control={form.control}
            name="nome_aluno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Aluno *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome completo do aluno" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("data_nascimento") && (
          <FormField
            control={form.control}
            name="data_nascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("nome_responsavel") && (
          <FormField
            control={form.control}
            name="nome_responsavel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Responsável *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do pai, mãe ou responsável" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("email") && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail *</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="email@exemplo.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("telefone") && (
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone/WhatsApp</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(00) 00000-0000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("curso_interesse") && (
          <FormField
            control={form.control}
            name="curso_interesse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Curso de Interesse</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Qual curso você tem interesse?" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {shouldShowField("mensagem") && (
          <FormField
            control={form.control}
            name="mensagem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Alguma observação adicional?" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Inscrição"
          )}
        </Button>
      </form>
    </Form>
  );
}
