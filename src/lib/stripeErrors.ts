/**
 * Centralised Stripe error translation to Portuguese.
 * Use across all Stripe-related components so users never see English messages.
 */

const codeTranslations: Record<string, string> = {
  // Card validation errors
  card_declined: "Cartão recusado. Verifique os dados ou use outro cartão.",
  expired_card: "Cartão expirado. Use outro cartão.",
  incorrect_cvc: "Código de segurança incorreto.",
  incorrect_number: "Número do cartão incorreto.",
  invalid_expiry_month: "Data de validade inválida.",
  invalid_expiry_year: "Data de validade inválida.",
  incomplete_number: "Número do cartão incompleto.",
  incomplete_cvc: "Código de segurança incompleto.",
  incomplete_expiry: "Data de validade incompleta.",
  incomplete_zip: "CEP incompleto.",
  invalid_number: "Número do cartão inválido.",
  invalid_cvc: "Código de segurança inválido.",
  
  // Processing errors
  processing_error: "Erro ao processar o cartão. Tente novamente.",
  authentication_required: "Seu cartão exige autenticação (3D Secure). Autorize no app do banco ou use outro cartão.",
  insufficient_funds: "Saldo insuficiente. Use outro cartão.",
  invalid_request_error: "Não foi possível processar a solicitação. Tente novamente.",
  
  // Setup/payment errors
  setup_intent_authentication_failure: "Falha na autenticação do cartão. Tente novamente.",
  payment_intent_authentication_failure: "Falha na autenticação do pagamento. Tente novamente.",
  
  // Rate limiting
  rate_limit: "Muitas tentativas. Aguarde um momento e tente novamente.",
};

const declineCodeTranslations: Record<string, string> = {
  insufficient_funds: "Saldo insuficiente. Use outro cartão.",
  do_not_honor: "O banco recusou a transação. Tente novamente ou use outro cartão.",
  generic_decline: "Cartão recusado. Verifique os dados ou use outro cartão.",
  transaction_not_allowed: "Transação não permitida. Ative compras online/internacionais no app do banco.",
  restricted_card: "Cartão com restrição. Use outro cartão.",
  lost_card: "Cartão reportado como perdido. Use outro cartão.",
  stolen_card: "Cartão reportado como roubado. Use outro cartão.",
  fraud: "Transação recusada por segurança. Tente novamente ou use outro cartão.",
  card_not_supported: "Cartão não suportado. Use outro cartão.",
  currency_not_supported: "Moeda não suportada pelo cartão. Use outro cartão.",
  duplicate_transaction: "Transação duplicada. Aguarde e tente novamente.",
  incorrect_pin: "PIN incorreto. Verifique e tente novamente.",
  withdrawal_count_limit_exceeded: "Limite de transações excedido. Tente novamente amanhã.",
  invalid_account: "Conta inválida. Entre em contato com seu banco.",
  new_account_information_available: "Informações da conta atualizadas. Tente novamente.",
  try_again_later: "Não foi possível processar. Tente novamente mais tarde.",
  not_permitted: "Transação não permitida. Entre em contato com seu banco.",
  service_not_allowed: "Serviço não permitido. Entre em contato com seu banco.",
  invalid_amount: "Valor inválido para esta transação.",
  revocation_of_all_authorizations: "Todas as autorizações foram revogadas. Entre em contato com seu banco.",
  revocation_of_authorization: "Autorização revogada. Entre em contato com seu banco.",
  security_violation: "Violação de segurança detectada. Use outro cartão.",
  stop_payment_order: "Ordem de bloqueio de pagamento. Entre em contato com seu banco.",
  testmode_decline: "Cartão de teste recusado. Use um cartão de teste válido.",
  call_issuer: "Entre em contato com seu banco para autorizar a transação.",
  card_velocity_exceeded: "Limite de transações excedido. Aguarde e tente novamente.",
  pickup_card: "Cartão bloqueado. Entre em contato com seu banco.",
};

/**
 * Checks if the Stripe publishable key indicates test mode.
 */
export function isStripeTestMode(): boolean {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  return Boolean(key?.startsWith("pk_test"));
}

/**
 * Translates a Stripe error object to a user-friendly Portuguese message.
 * @param error - The Stripe error object (from confirmCardPayment, confirmCardSetup, CardElement onChange, etc.)
 * @param appendTestModeNotice - Whether to append a notice when in test mode (default: true)
 */
export function translateStripeError(
  error: { code?: string; decline_code?: string; message?: string } | null | undefined,
  appendTestModeNotice = true
): string {
  if (!error) {
    return "Erro desconhecido. Tente novamente.";
  }

  const code = error.code;
  const declineCode = error.decline_code;
  const isTestMode = isStripeTestMode();

  let message: string;

  // For card_declined, prefer decline_code for more specific messages
  if (code === "card_declined" && declineCode && declineCodeTranslations[declineCode]) {
    message = declineCodeTranslations[declineCode];
  } else if (code && codeTranslations[code]) {
    message = codeTranslations[code];
  } else if (declineCode && declineCodeTranslations[declineCode]) {
    message = declineCodeTranslations[declineCode];
  } else {
    // Fallback - never show raw English message
    message = "Não foi possível processar o pagamento. Verifique os dados do cartão ou use outro cartão.";
  }

  if (appendTestModeNotice && isTestMode) {
    message += " (Ambiente de teste: o banco não recebe notificação.)";
  }

  return message;
}

/**
 * Translates a generic Stripe API error (e.g., from edge function responses).
 * @param errorMessage - The error message string
 */
export function translateStripeApiError(errorMessage: string | null | undefined): string {
  if (!errorMessage) {
    return "Erro ao processar pagamento. Tente novamente.";
  }

  // Common API error patterns
  const patterns: [RegExp, string][] = [
    [/no such customer/i, "Cliente não encontrado no sistema de pagamentos. Entre em contato com o suporte."],
    [/no such payment/i, "Pagamento não encontrado. Tente novamente."],
    [/no such subscription/i, "Assinatura não encontrada. Entre em contato com o suporte."],
    [/customer.*deleted/i, "Conta de pagamento foi removida. Entre em contato com o suporte."],
    [/invalid.*api.*key/i, "Erro de configuração do sistema de pagamentos. Entre em contato com o suporte."],
    [/rate.*limit/i, "Muitas tentativas. Aguarde um momento e tente novamente."],
    [/amount.*invalid/i, "Valor inválido para cobrança."],
    [/currency.*not.*supported/i, "Moeda não suportada."],
    [/card.*expired/i, "Cartão expirado. Use outro cartão."],
    [/insufficient.*funds/i, "Saldo insuficiente. Use outro cartão."],
    [/authentication.*required/i, "Autenticação necessária. Autorize no app do banco."],
    [/payment.*failed/i, "Pagamento falhou. Verifique os dados do cartão."],
    [/declined/i, "Pagamento recusado. Use outro cartão."],
  ];

  for (const [pattern, translation] of patterns) {
    if (pattern.test(errorMessage)) {
      return translation;
    }
  }

  // If no pattern matches, return a generic message (never show raw English)
  return "Erro ao processar pagamento. Tente novamente ou entre em contato com o suporte.";
}
