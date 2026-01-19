import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ComponentProps, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [storageKey, setStorageKey] = useState<string>("theme");

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Set user-specific storage key
          const userStorageKey = `theme-${user.id}`;
          setStorageKey(userStorageKey);
          
          // Load theme from database
          const { data: prefs } = await supabase
            .from("user_preferences")
            .select("theme")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (prefs?.theme) {
            // Update localStorage with user-specific key
            localStorage.setItem(userStorageKey, prefs.theme);
            // Force theme change by updating document class
            document.documentElement.classList.remove("light", "dark");
            if (prefs.theme !== "system") {
              document.documentElement.classList.add(prefs.theme);
            }
          }
        }
      } catch (error) {
        console.error("Error loading user theme:", error);
      }
    };

    loadUserTheme();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userStorageKey = `theme-${session.user.id}`;
        setStorageKey(userStorageKey);
        
        // Load theme from database for the new user
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        if (prefs?.theme) {
          localStorage.setItem(userStorageKey, prefs.theme);
          // Force theme change by updating document class
          document.documentElement.classList.remove("light", "dark");
          if (prefs.theme !== "system") {
            document.documentElement.classList.add(prefs.theme);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setStorageKey("theme");
        // Reset to default theme on logout
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <NextThemesProvider 
      {...props} 
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}
