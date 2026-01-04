import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  FileText, 
  Clock,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";
  const faturaId = searchParams.get("fatura_id");

  // Buscar dados da fatura se disponível
  const { data: fatura } = useQuery({
    queryKey: ["fatura-result", faturaId],
    queryFn: async () => {
      if (!faturaId) return null;
      
      const { data, error } = await supabase
        .from("faturas")
        .select("*, alunos(nome_completo), cursos(nome)")
        .eq("id", faturaId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!faturaId,
  });

  // Countdown para redirecionamento automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/faturas");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/5 via-background to-success/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-success/20 shadow-2xl animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-2xl font-bold text-success">
              Pagamento Confirmado!
            </CardTitle>
            <CardDescription className="text-base">
              Seu pagamento foi processado com sucesso.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {fatura && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {fatura.alunos?.nome_completo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {fatura.cursos?.nome}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    <p>Referência</p>
                    <p className="font-medium text-foreground">
                      {meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor pago</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(fatura.valor)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
              <CreditCard className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Um comprovante foi enviado para seu e-mail.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate("/faturas")}
                className="w-full bg-success hover:bg-success/90"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Faturas
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Redirecionando em {countdown} segundos...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (canceled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warning/5 via-background to-warning/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-warning/20 shadow-2xl animate-fade-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-warning" strokeWidth={1.5} />
            </div>
            <CardTitle className="text-2xl font-bold text-warning">
              Pagamento Cancelado
            </CardTitle>
            <CardDescription className="text-base">
              O pagamento foi cancelado ou não foi concluído.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {fatura && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {fatura.alunos?.nome_completo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {fatura.cursos?.nome}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    <p>Referência</p>
                    <p className="font-medium text-foreground">
                      {meses[fatura.mes_referencia - 1]}/{fatura.ano_referencia}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor pendente</p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(fatura.valor)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted/50 border rounded-xl p-4 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Você pode tentar novamente a qualquer momento.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate("/faturas")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Faturas
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Redirecionando em {countdown} segundos...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de erro/falha
  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-destructive/20 shadow-2xl animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-destructive" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Falha no Pagamento
          </CardTitle>
          <CardDescription className="text-base">
            Ocorreu um erro ao processar seu pagamento.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <p className="text-sm text-muted-foreground text-center">
              Por favor, verifique os dados do cartão ou tente outro método de pagamento.
              Se o problema persistir, entre em contato com a escola.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/faturas")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Redirecionando em {countdown} segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentResult;
