import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

type ThemeValue = "light" | "dark" | "system";

function ThemeBootstrap({
  userId,
  defaultTheme,
}: {
  userId: string | null;
  defaultTheme: ThemeValue;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Sem usuário: aplica o tema default do app (não bloqueia render).
      if (!userId) {
        setTheme(defaultTheme);
        return;
      }

      // Com usuário: tenta buscar a preferência no banco.
      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme")
          .eq("user_id", userId)
          .maybeSingle();

        const theme = (prefs?.theme as ThemeValue | null) ?? null;
        if (!cancelled && theme) {
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

  // Se não vier, usamos light (mantém consistência com App.tsx)
  const defaultTheme = (props.defaultTheme ?? "light") as ThemeValue;

  const storageKey = useMemo(() => {
    return userId ? `theme-${userId}` : "theme";
  }, [userId]);

  useEffect(() => {
    // Carrega sessão atual (rápido: vem do cache local)
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUserId(data.session?.user?.id ?? null);
      })
      .catch((error) => {
        console.error("Error reading session:", error);
        setUserId(null);
      });

    // Mantém em sync quando o usuário entra/sai
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
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

