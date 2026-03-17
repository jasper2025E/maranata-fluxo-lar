import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  is_active: boolean;
  content_hash: string;
}

export interface UserAcceptance {
  id: string;
  document_id: string;
  document_version: string;
  document_hash: string;
  accepted_at: string;
}

export function useLegalDocuments() {
  const { user } = useAuth();

  const documentsQuery = useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("id, slug, title, content, version, effective_date, is_active, content_hash")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data as LegalDocument[];
    },
    enabled: !!user,
  });

  const acceptancesQuery = useQuery({
    queryKey: ["legal-acceptances", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_legal_acceptances")
        .select("id, document_id, document_version, document_hash, accepted_at");
      if (error) throw error;
      return data as UserAcceptance[];
    },
    enabled: !!user,
  });

  const pendingDocuments = (() => {
    if (!documentsQuery.data || !acceptancesQuery.data) return [];
    const accepted = new Set(
      acceptancesQuery.data.map((a) => `${a.document_id}:${a.document_version}`)
    );
    return documentsQuery.data.filter(
      (d) => !accepted.has(`${d.id}:${d.version}`)
    );
  })();

  const hasPendingTerms =
    documentsQuery.isSuccess &&
    acceptancesQuery.isSuccess &&
    pendingDocuments.length > 0;

  const termsLoading = documentsQuery.isLoading || acceptancesQuery.isLoading;

  return {
    documents: documentsQuery.data ?? [],
    acceptances: acceptancesQuery.data ?? [],
    pendingDocuments,
    hasPendingTerms,
    termsLoading,
  };
}

export function useAcceptLegalDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      documentId: string;
      documentVersion: string;
      documentHash: string;
      userName: string;
      userCpfCnpj?: string;
    }) => {
      const { data, error } = await supabase.rpc("accept_legal_document", {
        p_document_id: params.documentId,
        p_document_version: params.documentVersion,
        p_document_hash: params.documentHash,
        p_user_name: params.userName,
        p_user_email: user?.email ?? "",
        p_user_cpf_cnpj: params.userCpfCnpj || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal-acceptances"] });
    },
  });
}
