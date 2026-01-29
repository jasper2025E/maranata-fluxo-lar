import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BuscaCpfProps {
  onSearch: (cpf: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  primaryColor?: string;
}

function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

export function BuscaCpf({ onSearch, isLoading, error, primaryColor }: BuscaCpfProps) {
  const [cpf, setCpf] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.replace(/\D/g, "").length === 11) {
      await onSearch(cpf);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    if (formatted.length <= 14) {
      setCpf(formatted);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor ? `${primaryColor}20` : "hsl(var(--primary) / 0.1)" }}
        >
          <Search
            className="h-8 w-8"
            style={{ color: primaryColor || "hsl(var(--primary))" }}
          />
        </div>
        <CardTitle className="text-2xl">Consulta de Boletos</CardTitle>
        <CardDescription>
          Digite seu CPF para acessar suas faturas e boletos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do Responsável</Label>
            <Input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleChange}
              className="text-center text-lg h-12"
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={cpf.replace(/\D/g, "").length !== 11 || isLoading}
            style={{
              backgroundColor: primaryColor || undefined,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Consultando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Consultar Boletos
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Seus dados estão protegidos. Utilizamos apenas para consultar suas faturas.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
