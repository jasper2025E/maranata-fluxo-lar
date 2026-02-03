import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/hooks/useQueryConfig";
import { useAuth } from "./AuthContext";

interface RealtimeContextType {
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false });

/**
 * RealtimeProvider - Gerenciador centralizado de subscriptions Supabase Realtime
 * 
 * Consolida todos os channels em um único provider para evitar duplicação
 * e garantir invalidação consistente do cache em todo o sistema.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Só conectar se tiver usuário autenticado
    if (!user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Criar channel único para todas as tabelas
    const channel = supabase
      .channel("global-realtime-sync")
      // Faturas - tabela principal financeira
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "faturas" },
        (payload) => {
          console.log("[Realtime] Fatura changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.kpis(), refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(), refetchType: "all" });
        }
      )
      // Pagamentos - atualiza faturas e dashboard
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pagamentos" },
        (payload) => {
          console.log("[Realtime] Pagamento changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.all, refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.faturas.kpis(), refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(), refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: ["pagamentos"], refetchType: "all" });
        }
      )
      // Despesas - afeta dashboard e relatórios
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "despesas" },
        (payload) => {
          console.log("[Realtime] Despesa changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(), refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: ["despesas"], refetchType: "all" });
        }
      )
      // Alunos - afeta dashboard, faturas e listas
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alunos" },
        (payload) => {
          console.log("[Realtime] Aluno changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.alunos.all, refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(), refetchType: "all" });
        }
      )
      // Responsáveis - afeta listas e faturas
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "responsaveis" },
        (payload) => {
          console.log("[Realtime] Responsável changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.responsaveis.all, refetchType: "all" });
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(), refetchType: "all" });
        }
      )
      // Cursos - afeta listas e matrículas
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cursos" },
        (payload) => {
          console.log("[Realtime] Curso changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.cursos.all, refetchType: "all" });
        }
      )
      // Turmas - afeta listas e enturmação
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "turmas" },
        (payload) => {
          console.log("[Realtime] Turma changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: queryKeys.turmas.all, refetchType: "all" });
        }
      )
      // Notificações - atualiza badge de notificações
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          console.log("[Realtime] Notification changed:", payload.eventType);
          queryClient.invalidateQueries({ queryKey: ["notifications"], refetchType: "all" });
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Channel status:", status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected: !!channelRef.current }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
