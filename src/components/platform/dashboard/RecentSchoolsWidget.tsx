import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Tenant {
  id: string;
  nome: string;
  cnpj: string | null;
  plano: string;
  subscription_status: string | null;
  created_at: string;
}

interface RecentSchoolsWidgetProps {
  tenants: Tenant[];
}

export function RecentSchoolsWidget({ tenants }: RecentSchoolsWidgetProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        );
      case "trial":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
            <Clock className="h-3 w-3 mr-1" />
            Teste
          </Badge>
        );
      case "past_due":
      case "suspended":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status || "Indefinido"}
          </Badge>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Escolas Recentes</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary text-sm"
          onClick={() => navigate("/platform/tenants")}
        >
          Ver todas
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {tenants.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">Nenhuma escola cadastrada</p>
          <Button
            onClick={() => navigate("/platform/tenants/new")}
            className="mt-3"
            size="sm"
          >
            Cadastrar primeira escola
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tenants.slice(0, 4).map((tenant, index) => (
            <motion.button
              key={tenant.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
              onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
              className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {tenant.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tenant.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {tenant.plano}
                </Badge>
                {getStatusBadge(tenant.subscription_status)}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
