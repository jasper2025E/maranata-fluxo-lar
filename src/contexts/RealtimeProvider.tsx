import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/hooks/useQueryConfig";
import { useAuth } from "./AuthContext";

interface RealtimeContextType {
  isConnected: boolean;
  reconnecting: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ 
  isConnected: false, 
  reconnecting: false 
});

/**
 * RealtimeProvider - Gerenciador centralizado de subscriptions Supabase Realtime
 * 
 * Consolida todos os channels em um único provider para evitar duplicação
 * e garantir invalidação consistente do cache em todo o sistema.
 * 
 * Implementa reconexão automática com backoff exponencial para garantir
 * resiliência em caso de erros de rede ou token expirado.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 1000;
  const MAX_DELAY_MS = 30000;

  // Cleanup function para remover channel e timers
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
    setReconnecting(false);
  }, []);

  // Função para criar e conectar o channel
  const createChannel = useCallback(() => {
    if (!user) return;

    // Limpar channel anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log("[Realtime] Criando channel global...");

    const channel = supabase
      .channel("global-realtime-sync", {
        config: {
          broadcast: { self: true },
          presence: { key: user.id },
        },
      })
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
      .subscribe((status, err) => {
        console.log("[Realtime] Channel status:", status, err ? `Error: ${err.message}` : "");

        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setReconnecting(false);
          retryCountRef.current = 0;
          console.log("[Realtime] ✅ Conectado com sucesso");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsConnected(false);
          
          // Tentar reconectar com backoff exponencial
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(
              BASE_DELAY_MS * Math.pow(2, retryCountRef.current),
              MAX_DELAY_MS
            );
            
            console.log(`[Realtime] ⚠️ Erro de conexão. Tentando reconectar em ${delay}ms (tentativa ${retryCountRef.current + 1}/${MAX_RETRIES})...`);
            
            setReconnecting(true);
            retryCountRef.current++;

            retryTimeoutRef.current = setTimeout(() => {
              createChannel();
            }, delay);
          } else {
            console.error("[Realtime] ❌ Máximo de tentativas atingido. Reconexão manual necessária.");
            setReconnecting(false);
          }
        } else if (status === "CLOSED") {
          setIsConnected(false);
          setReconnecting(false);
          console.log("[Realtime] Canal fechado");
        }
      });

    channelRef.current = channel;
  }, [user, queryClient]);

  useEffect(() => {
    // Só conectar se tiver usuário autenticado
    if (!user) {
      cleanup();
      return;
    }

    createChannel();

    return cleanup;
  }, [user, createChannel, cleanup]);

  // Retry manual - exposto para possível uso futuro
  const retryConnection = useCallback(() => {
    retryCountRef.current = 0;
    setReconnecting(true);
    createChannel();
  }, [createChannel]);

  return (
    <RealtimeContext.Provider value={{ isConnected, reconnecting }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
