import { CreditCard, CalendarCheck, Sparkles, FileText, ChevronDown, Mail, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface BlockedTenantScreenProps {
  reason?: string;
  isPastDue?: boolean;
  gracePeriodEndsAt?: Date | null;
  tenantId?: string;
}

interface StepCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}

function StepCard({ icon, iconBg, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 border border-border rounded-xl bg-card">
      <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export function BlockedTenantScreen({ 
  reason, 
  isPastDue, 
  gracePeriodEndsAt,
  tenantId,
}: BlockedTenantScreenProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  const handlePayOverdue = () => {
    navigate("/pagar-fatura");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        {/* Main Card */}
        <Card className="border-border shadow-lg mb-4">
          <CardHeader className="text-center pb-6 pt-8">
            {/* Logo/Brand */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">M</span>
            </div>
            
            <CardTitle className="text-2xl font-semibold text-foreground">
              Houve um problema com seu pagamento
            </CardTitle>
            <CardDescription className="text-base mt-2 max-w-xl mx-auto">
              Sua conta está temporariamente congelada e não pode ser acessada nem atualizada 
              até que a fatura seja paga e você renove seu plano.
            </CardDescription>

            {isPastDue && gracePeriodEndsAt && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 mx-auto">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Prazo para regularização: <strong>{formatDate(gracePeriodEndsAt)}</strong>
                </span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="pb-8">
            {/* Pay Button */}
            <div className="flex justify-center mb-8">
              <Button 
                onClick={handlePayOverdue}
                size="lg" 
                className="gap-2 px-8 py-6 text-base font-medium shadow-md hover:shadow-lg transition-shadow"
              >
                Pagar cobranças em atraso
              </Button>
            </div>

            {/* 3-Step Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              <StepCard
                icon={<CreditCard className="h-6 w-6 text-rose-600" />}
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                title="Pague suas cobranças em atraso"
                description="Não foi possível cobrar sua forma de pagamento por um ou mais ciclos de faturamento."
              />
              
              {/* Connector + */}
              <div className="hidden md:flex absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-muted items-center justify-center text-muted-foreground font-medium text-lg z-10">
                +
              </div>
              
              <StepCard
                icon={<CalendarCheck className="h-6 w-6 text-blue-600" />}
                iconBg="bg-blue-100 dark:bg-blue-900/30"
                title="Renove seu plano"
                description="Você poderá consultar suas cobranças e o plano do sistema na próxima tela."
              />
              
              {/* Connector = */}
              <div className="hidden md:flex absolute left-2/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-muted items-center justify-center text-muted-foreground font-medium text-lg z-10">
                =
              </div>
              
              <StepCard
                icon={<Sparkles className="h-6 w-6 text-emerald-600" />}
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                title="Você está de volta aos negócios!"
                description="Sua conta estará online novamente para você e seus usuários, exatamente como você deixou."
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice History Collapsible */}
        <Card className="border-border shadow-sm">
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">Consultar faturas anteriores</span>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    isHistoryOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Para consultar o histórico completo de faturas, regularize seu acesso primeiro.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Support Link */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Se você tiver dificuldades para resolver o problema,{" "}
            <a 
              href="mailto:suporte@maranata.app" 
              className="text-primary hover:underline font-medium"
            >
              entre em contato com o Atendimento ao cliente
            </a>
          </p>
          
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-muted-foreground text-sm"
          >
            Sair da conta
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
