import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Users, 
  FileText, 
  GraduationCap, 
  Search,
  Loader2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "aluno" | "responsavel" | "fatura";
  title: string;
  subtitle: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();


  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search alunos
      const { data: alunos } = await supabase
        .from("alunos")
        .select("id, nome_completo, email_responsavel")
        .ilike("nome_completo", `%${searchQuery}%`)
        .limit(5);

      if (alunos) {
        alunos.forEach((aluno) => {
          searchResults.push({
            id: aluno.id,
            type: "aluno",
            title: aluno.nome_completo,
            subtitle: aluno.email_responsavel || "Aluno",
          });
        });
      }

      // Search responsaveis
      const { data: responsaveis } = await supabase
        .from("responsaveis")
        .select("id, nome, email")
        .or(`nome.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      if (responsaveis) {
        responsaveis.forEach((resp) => {
          searchResults.push({
            id: resp.id,
            type: "responsavel",
            title: resp.nome,
            subtitle: resp.email || "Responsável",
          });
        });
      }

      // Search faturas by codigo
      const { data: faturas } = await supabase
        .from("faturas")
        .select("id, codigo_sequencial, valor, alunos(nome_completo)")
        .ilike("codigo_sequencial", `%${searchQuery}%`)
        .limit(5);

      if (faturas) {
        faturas.forEach((fatura) => {
          const alunoData = fatura.alunos as unknown as { nome_completo: string };
          searchResults.push({
            id: fatura.id,
            type: "fatura",
            title: fatura.codigo_sequencial || `Fatura #${fatura.id.slice(0, 8)}`,
            subtitle: `${alunoData?.nome_completo || "Aluno"} - R$ ${fatura.valor?.toFixed(2) || "0,00"}`,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");

    switch (result.type) {
      case "aluno":
        navigate("/alunos");
        break;
      case "responsavel":
        navigate("/responsaveis");
        break;
      case "fatura":
        navigate("/faturas");
        break;
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "aluno":
        return <GraduationCap className="h-4 w-4" />;
      case "responsavel":
        return <Users className="h-4 w-4" />;
      case "fatura":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "aluno":
        return "Alunos";
      case "responsavel":
        return "Responsáveis";
      case "fatura":
        return "Faturas";
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim().length >= 2) {
      setQuery(inputValue);
      setOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Sync query when dialog opens with input value
  useEffect(() => {
    if (open && inputValue.trim().length >= 2) {
      setQuery(inputValue);
    }
  }, [open, inputValue]);

  // Clear input when dialog closes
  useEffect(() => {
    if (!open) {
      setInputValue("");
      setQuery("");
    }
  }, [open]);

  return (
    <>
      {/* Search Input */}
      <div className="hidden md:flex relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("common.searchPlaceholder")}
          className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
      </div>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Buscar alunos, responsáveis, faturas..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Buscando...
            </div>
          )}
          
          {!loading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {!loading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar...
            </div>
          )}

          {!loading && Object.entries(groupedResults).map(([type, items]) => (
            <CommandGroup key={type} heading={getTypeLabel(type as SearchResult["type"])}>
              {items.map((result) => (
                <CommandItem
                  key={result.id}
                  value={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
