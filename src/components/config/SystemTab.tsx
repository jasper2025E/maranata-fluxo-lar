import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
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
        toast.success("Dados redefinidos");
      } else {
        await supabase.from(tableType).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        toast.success("Dados excluídos");
      }
      setConfirmText("");
    } catch (error: any) {
      toast.error("Erro ao redefinir dados");
    } finally {
      setResettingData(false);
    }
  };

  const ResetButton = ({ 
    label, 
    description, 
    tableType 
  }: { 
    label: string; 
    description: string; 
    tableType: "alunos" | "faturas" | "pagamentos" | "responsaveis"; 
  }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-colors">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {label.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e excluirá permanentemente todos os dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleResetData(tableType)}
            className="bg-destructive hover:bg-destructive/90"
            disabled={resettingData}
          >
            {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Status do sistema</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-medium text-green-600">Online</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Banco de dados</p>
              <p className="text-sm font-medium text-foreground">PostgreSQL</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Versão</p>
              <p className="text-sm font-medium text-foreground">1.0.0</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="text-sm font-medium text-foreground">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Backup e exportação</h3>
        </div>
        <div className="p-6">
          <BackupExport />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-lg">
        <div className="px-6 py-4 border-b border-destructive/30">
          <h3 className="text-sm font-medium text-destructive">Zona de perigo</h3>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            Atenção: estas ações são irreversíveis e excluirão permanentemente os dados.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <ResetButton label="Alunos" description="Remove todos os alunos" tableType="alunos" />
            <ResetButton label="Responsáveis" description="Remove todos os responsáveis" tableType="responsaveis" />
            <ResetButton label="Faturas" description="Remove todas as faturas" tableType="faturas" />
            <ResetButton label="Pagamentos" description="Remove todos os pagamentos" tableType="pagamentos" />
          </div>

          <div className="pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Redefinir sistema completo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    Redefinir todos os dados?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>Esta ação excluirá permanentemente todos os dados do sistema.</p>
                    <div>
                      <p className="text-sm font-medium mb-2">Digite "CONFIRMAR" para prosseguir:</p>
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="CONFIRMAR"
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
                    {resettingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
