import { AlertTriangle, CreditCard, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface BlockedTenantScreenProps {
  reason?: string;
  isPastDue?: boolean;
  gracePeriodEndsAt?: Date | null;
}

export function BlockedTenantScreen({ 
  reason, 
  isPastDue, 
  gracePeriodEndsAt 
}: BlockedTenantScreenProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg"
      >
        <Card className="border-rose-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            </div>
            <CardTitle className="text-2xl text-rose-900">
              {isPastDue ? "Pagamento Pendente" : "Acesso Suspenso"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isPastDue 
                ? "Sua assinatura está com pagamento pendente."
                : "O acesso ao sistema foi temporariamente suspenso."
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isPastDue && gracePeriodEndsAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Período de carência:</strong> Você tem até{" "}
                  <span className="font-semibold">{formatDate(gracePeriodEndsAt)}</span>{" "}
                  para regularizar o pagamento antes que o acesso seja completamente suspenso.
                </p>
              </div>
            )}

            {reason && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Motivo:</strong> {reason}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Para regularizar sua situação, entre em contato:
              </p>
              
              <div className="flex flex-col gap-2">
                <a 
                  href="mailto:suporte@wevessistem.com.br" 
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">suporte@wevessistem.com.br</span>
                </a>
                
                <a 
                  href="tel:+5511999999999" 
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">(11) 99999-9999</span>
                </a>
              </div>
            </div>

            {isPastDue && (
              <Button className="w-full gap-2" size="lg">
                <CreditCard className="h-4 w-4" />
                Regularizar Pagamento
              </Button>
            )}

            <div className="pt-2 border-t">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full text-muted-foreground"
              >
                Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Wevessistem. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
}
