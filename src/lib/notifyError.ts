import { supabase } from "@/integrations/supabase/client";

/**
 * Cria uma notificação de erro no sistema para alertar o administrador
 * sobre problemas de integração ou falhas em operações críticas.
 * 
 * @param title - Título da notificação
 * @param message - Mensagem descritiva do erro
 * @param link - Link para a página relacionada (padrão: /configuracoes)
 */
export async function notifySystemError(
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type: "error",
      link: link || "/configuracoes"
    });

    if (error) {
      console.error("Failed to create error notification:", error);
    }
  } catch (e) {
    console.error("Failed to create error notification:", e);
  }
}

/**
 * Cria uma notificação de aviso no sistema
 * 
 * @param title - Título da notificação
 * @param message - Mensagem descritiva
 * @param link - Link para a página relacionada
 */
export async function notifySystemWarning(
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type: "warning",
      link: link || "/dashboard"
    });

    if (error) {
      console.error("Failed to create warning notification:", error);
    }
  } catch (e) {
    console.error("Failed to create warning notification:", e);
  }
}

/**
 * Cria uma notificação de sucesso no sistema
 * 
 * @param title - Título da notificação
 * @param message - Mensagem descritiva
 * @param link - Link para a página relacionada
 */
export async function notifySystemSuccess(
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type: "success",
      link: link || "/dashboard"
    });

    if (error) {
      console.error("Failed to create success notification:", error);
    }
  } catch (e) {
    console.error("Failed to create success notification:", e);
  }
}

/**
 * Cria uma notificação informativa no sistema
 * 
 * @param title - Título da notificação
 * @param message - Mensagem descritiva
 * @param link - Link para a página relacionada
 */
export async function notifySystemInfo(
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      title,
      message,
      type: "info",
      link: link || "/dashboard"
    });

    if (error) {
      console.error("Failed to create info notification:", error);
    }
  } catch (e) {
    console.error("Failed to create info notification:", e);
  }
}
