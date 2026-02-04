import { UseQueryOptions } from "@tanstack/react-query";

// Default query configuration - cache agressivo para navegação rápida
export const defaultQueryConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 60 * 5, // 5 minutos - navegação instantânea
  gcTime: 1000 * 60 * 30, // 30 minutos de cache em memória
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

// Short cache for frequently changing data (dashboard, KPIs)
export const shortCacheConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 60 * 2, // 2 minutos
  gcTime: 1000 * 60 * 10,
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

// Long cache for rarely changing data (cursos, turmas, escola)
export const longCacheConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 60 * 10, // 10 minutos
  gcTime: 1000 * 60 * 60, // 1 hora
  retry: 1,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

// Query keys factory for type-safe and consistent keys
export const queryKeys = {
  alunos: {
    all: ["alunos"] as const,
    list: () => [...queryKeys.alunos.all, "list"] as const,
    detail: (id: string) => [...queryKeys.alunos.all, "detail", id] as const,
  },
  cursos: {
    all: ["cursos"] as const,
    list: () => [...queryKeys.cursos.all, "list"] as const,
    detail: (id: string) => [...queryKeys.cursos.all, "detail", id] as const,
  },
  turmas: {
    all: ["turmas"] as const,
    list: () => [...queryKeys.turmas.all, "list"] as const,
    detail: (id: string) => [...queryKeys.turmas.all, "detail", id] as const,
  },
  faturas: {
    all: ["faturas"] as const,
    list: () => [...queryKeys.faturas.all, "list"] as const,
    byMonth: (month: number, year: number) => [...queryKeys.faturas.all, "month", month, year] as const,
    detail: (id: string) => [...queryKeys.faturas.all, "detail", id] as const,
    kpis: () => [...queryKeys.faturas.all, "kpis"] as const,
  },
  pagamentos: {
    all: ["pagamentos"] as const,
    list: () => [...queryKeys.pagamentos.all, "list"] as const,
    byFatura: (faturaId: string) => [...queryKeys.pagamentos.all, "fatura", faturaId] as const,
  },
  despesas: {
    all: ["despesas"] as const,
    list: () => [...queryKeys.despesas.all, "list"] as const,
    detail: (id: string) => [...queryKeys.despesas.all, "detail", id] as const,
  },
  responsaveis: {
    all: ["responsaveis"] as const,
    list: () => [...queryKeys.responsaveis.all, "list"] as const,
    detail: (id: string) => [...queryKeys.responsaveis.all, "detail", id] as const,
  },
  escola: {
    all: ["escola"] as const,
    info: () => [...queryKeys.escola.all, "info"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },
} as const;
