import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PortalAluno {
  nome: string;
  curso: string;
  nivel: string;
  status: string;
}

export interface PortalFatura {
  referencia: string;
  aluno_nome: string;
  valor: number;
  vencimento: string;
  status: "aberta" | "vencida" | "paga" | "cancelada";
  pix_payload: string | null;
  pix_qrcode: string | null;
  boleto_url: string | null;
  invoice_url: string | null;
}

export interface PortalResponsavel {
  nome: string;
  email_parcial: string;
  telefone_parcial: string;
}

export interface PortalData {
  responsavel: PortalResponsavel;
  alunos: PortalAluno[];
  faturas: PortalFatura[];
  escola: {
    nome: string;
  };
}

export function usePortalResponsavel() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);

  const consultarCpf = async (cpf: string, tenantId: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "portal-consulta-cpf",
        {
          body: { cpf, tenant_id: tenantId },
        }
      );

      if (fnError) {
        console.error("Function error:", fnError);
        setError("Erro ao consultar. Tente novamente.");
        return null;
      }

      if (result?.error) {
        setError(result.error);
        return null;
      }

      setData(result as PortalData);
      return result as PortalData;
    } catch (err) {
      console.error("Error consulting CPF:", err);
      setError("Erro de conexão. Verifique sua internet.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const limparConsulta = () => {
    setData(null);
    setError(null);
  };

  return {
    data,
    isLoading,
    error,
    consultarCpf,
    limparConsulta,
  };
}
