import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ComponentProps, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [storageKey, setStorageKey] = useState<string>("theme");
  const [initialTheme, setInitialTheme] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

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
            setInitialTheme(prefs.theme);
            // Also update localStorage with user-specific key
            localStorage.setItem(userStorageKey, prefs.theme);
          }
        } else {
          // No user logged in - use default storage key
          setStorageKey("theme");
        }
      } catch (error) {
        console.error("Error loading user theme:", error);
      } finally {
        setIsReady(true);
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
          setInitialTheme(prefs.theme);
          localStorage.setItem(userStorageKey, prefs.theme);
          // Force theme change by updating document class
          document.documentElement.classList.remove("light", "dark");
          if (prefs.theme !== "system") {
            document.documentElement.classList.add(prefs.theme);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setStorageKey("theme");
        setInitialTheme("light");
        // Reset to default theme on logout
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Wait until we've checked for user theme
  if (!isReady) {
    return null;
  }

  return (
    <NextThemesProvider 
      {...props} 
      storageKey={storageKey}
      defaultTheme={initialTheme || props.defaultTheme}
    >
      {children}
    </NextThemesProvider>
  );
}
