import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  avatar_url: string | null;
  nome: string | null;
}

export function useProfileData(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-data", userId],
    queryFn: async (): Promise<ProfileData> => {
      if (!userId) {
        return { avatar_url: null, nome: null };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, nome")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return { avatar_url: null, nome: null };
      }

      return {
        avatar_url: data?.avatar_url || null,
        nome: data?.nome || null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
