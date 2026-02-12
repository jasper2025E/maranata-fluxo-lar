import { parseISO } from "date-fns";

// Utility functions for formatting
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const toDate = (date: string | Date): Date => {
  if (date instanceof Date) return date;
  // Use parseISO for string dates to avoid timezone issues with "YYYY-MM-DD" format
  return parseISO(date);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(toDate(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date));
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, "");
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

// Status helpers
export const getStatusColor = (status: string): "default" | "success" | "warning" | "destructive" => {
  const statusMap: Record<string, "default" | "success" | "warning" | "destructive"> = {
    ativo: "success",
    pago: "success",
    paga: "success",
    aberta: "default",
    aberto: "default",
    pendente: "warning",
    vencida: "destructive",
    vencido: "destructive",
    cancelado: "destructive",
    cancelada: "destructive",
    trancado: "warning",
    transferido: "default",
  };
  return statusMap[status.toLowerCase()] || "default";
};

// Month names in Portuguese
export const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const getMonthName = (month: number): string => {
  return monthNames[month - 1] || "";
};
