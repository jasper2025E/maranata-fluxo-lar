import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Database,
  AlertTriangle,
  Trash2,
  Loader2,
  Server,
  HardDrive,
  Activity,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BackupExport } from "./BackupExport";

interface SystemTabProps {
  role: string | null;
}

export function SystemTab({ role }: SystemTabProps) {
  const [resettingData, setResettingData] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleResetData = async (tableType: "alunos" | "faturas" | "pagamentos" | "responsaveis" | "all") => {
    if (role !== "admin") {
      toast.error("Apenas administradores podem redefinir dados");
      return;
    }

    setResettingData(true);
    try {
      if (tableType === "all") {
        await supabase.from("pagamentos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("faturas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("alunos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("responsaveis").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("despesas").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        toast.success("Todos os dados foram redefinidos!");
      } else {
        await supabase.from(tableType).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        const labels: Record<string, string> = {
          alunos: "Alunos",
          faturas: "Faturas",
          pagamentos: "Pagamentos",
          responsaveis: "Responsáveis",
        };
        toast.success(`${labels[tableType]} foram excluídos!`);
      }
      setConfirmText("");
    } catch (error: any) {
      console.error("Error resetting data:", error);
      toast.error("Erro ao redefinir dados: " + error.message);
    } finally {
      setResettingData(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* System Status */}
      <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Informações sobre o estado atual do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-success/10">
                <Activity className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium text-success">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-blue-500/10">
                <HardDrive className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Banco de Dados</p>
                <p className="font-medium">PostgreSQL</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Database className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Versão</p>
                <p className="font-medium">1.0.0</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-medium">99.9%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Export Section */}
      <BackupExport />

      {/* Reset Data Section */}
      <Card className="border shadow-sm border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Atenção: Estas ações são irreversíveis e excluirão permanentemente os dados selecionados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Aviso Importante</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ao redefinir os dados, todas as informações selecionadas serão permanentemente excluídas. 
                  Esta ação não pode ser desfeita. Certifique-se de fazer backup dos dados antes de prosseguir.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium text-sm">Redefinir por categoria</h4>
            
            <div className="grid sm:grid-cols-2 gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <div className="text-left">
                      <p className="font-medium">Excluir Alunos</p>
                      <p className="text-xs text-muted-foreground">Remove todos os alunos cadastrados</p>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir todos os alunos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação excluirá permanentemente todos os alunos cadastrados no sistema. 
                      As faturas e pagamentos relacionados também podem ser afetados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleResetData("alunos")}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={resettingData}
                    >
                      {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <div className="text-left">
                      <p className="font-medium">Excluir Responsáveis</p>
                      <p className="text-xs text-muted-foreground">Remove todos os responsáveis</p>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir todos os responsáveis?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação excluirá permanentemente todos os responsáveis cadastrados no sistema.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleResetData("responsaveis")}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={resettingData}
                    >
                      {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <div className="text-left">
                      <p className="font-medium">Excluir Faturas</p>
                      <p className="text-xs text-muted-foreground">Remove todas as faturas</p>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir todas as faturas?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação excluirá permanentemente todas as faturas do sistema, incluindo histórico financeiro.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleResetData("faturas")}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={resettingData}
                    >
                      {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-3 border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <div className="text-left">
                      <p className="font-medium">Excluir Pagamentos</p>
                      <p className="text-xs text-muted-foreground">Remove todos os pagamentos</p>
                    </div>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir todos os pagamentos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação excluirá permanentemente todo o histórico de pagamentos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleResetData("pagamentos")}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={resettingData}
                    >
                      {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Separator />

          {/* Reset All */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-destructive">Redefinir TODOS os dados</h4>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4" />
                  Redefinir Sistema Completo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    ⚠️ Redefinir TODOS os dados do sistema?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      Esta ação excluirá <strong>permanentemente</strong> todos os dados do sistema:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Todos os alunos</li>
                      <li>Todos os responsáveis</li>
                      <li>Todas as faturas</li>
                      <li>Todos os pagamentos</li>
                      <li>Todas as despesas</li>
                    </ul>
                    <div className="pt-2">
                      <p className="text-sm font-medium">
                        Digite "CONFIRMAR" para prosseguir:
                      </p>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="CONFIRMAR"
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleResetData("all")}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={resettingData || confirmText !== "CONFIRMAR"}
                  >
                    {resettingData ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Redefinir Tudo"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
