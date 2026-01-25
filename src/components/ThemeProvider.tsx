import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ComponentProps, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useThemeConfig, clearThemeConfigCache } from "@/hooks/useThemeConfig";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

type ThemeValue = "light" | "dark" | "system";

// Cache to avoid repeated DB calls
const themeCache = new Map<string, ThemeValue>();

function ThemeBootstrap({
  userId,
  defaultTheme,
}: {
  userId: string | null;
  defaultTheme: ThemeValue;
}) {
  const { setTheme } = useTheme();
  const lastFetchedUserId = useRef<string | null>(null);

  // Apply custom theme config (colors, layout, typography)
  useThemeConfig(userId);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        setTheme(defaultTheme);
        return;
      }

      // Skip if already fetched for this user
      if (lastFetchedUserId.current === userId) {
        const cached = themeCache.get(userId);
        if (cached) setTheme(cached);
        return;
      }

      // Check cache first
      const cached = themeCache.get(userId);
      if (cached) {
        lastFetchedUserId.current = userId;
        setTheme(cached);
        return;
      }

      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", userId)
          .maybeSingle();

        const theme = (prefs?.theme as ThemeValue | null) ?? null;
        if (!cancelled && theme) {
          themeCache.set(userId, theme);
          lastFetchedUserId.current = userId;
          setTheme(theme);
        }
      } catch (error) {
        console.error("Error loading user theme:", error);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [userId, defaultTheme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  const defaultTheme = (props.defaultTheme ?? "light") as ThemeValue;

  const storageKey = useMemo(() => {
    return userId ? `theme-${userId}` : "theme";
  }, [userId]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user?.id ?? null);
      })
      .catch((error) => {
        console.error("Error reading session:", error);
        setUserId(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setUserId(session?.user?.id ?? null);
        if (!session?.user?.id) {
          themeCache.clear();
          clearThemeConfigCache();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <NextThemesProvider
      key={storageKey}
      {...props}
      storageKey={storageKey}
      defaultTheme={defaultTheme}
    >
      <ThemeBootstrap userId={userId} defaultTheme={defaultTheme} />
      {children}
    </NextThemesProvider>
  );
}

// Export function to update cache when user changes theme
export function updateThemeCache(userId: string, theme: ThemeValue) {
  themeCache.set(userId, theme);
}

