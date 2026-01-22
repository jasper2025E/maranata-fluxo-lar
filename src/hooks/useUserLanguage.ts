import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to load and sync user's language preference from the database.
 * Should be called once at app initialization after auth is ready.
 */
export function useUserLanguage() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("language")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefs?.language && prefs.language !== i18n.language) {
          await i18n.changeLanguage(prefs.language);
        }
      } catch (error) {
        console.error("Error loading user language preference:", error);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        loadUserLanguage();
      }
    });

    // Also load on initial mount if user is already signed in
    loadUserLanguage();

    return () => {
      subscription.unsubscribe();
    };
  }, [i18n]);
}
