import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConfiguracaoCobranca {
  juros_percentual_diario_padrao: number;
  juros_percentual_mensal_padrao: number;
  multa_fixa_padrao: number;
  multa_percentual_padrao: number;
  dias_carencia_juros: number;
  desconto_pontualidade_percentual: number;
  dias_desconto_pontualidade: number;
}

export function ConfiguracoesCobranca() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoCobranca>({
    juros_percentual_diario_padrao: 0.033,
    juros_percentual_mensal_padrao: 1,
    multa_fixa_padrao: 0,
    multa_percentual_padrao: 2,
    dias_carencia_juros: 0,
    desconto_pontualidade_percentual: 0,
    dias_desconto_pontualidade: 0,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("escola")
        .select(`
          juros_percentual_diario_padrao,
          juros_percentual_mensal_padrao,
          multa_fixa_padrao,
          multa_percentual_padrao,
          dias_carencia_juros,
          desconto_pontualidade_percentual,
          dias_desconto_pontualidade
        `)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          juros_percentual_diario_padrao: data.juros_percentual_diario_padrao || 0.033,
          juros_percentual_mensal_padrao: data.juros_percentual_mensal_padrao || 1,
          multa_fixa_padrao: data.multa_fixa_padrao || 0,
          multa_percentual_padrao: data.multa_percentual_padrao || 2,
          dias_carencia_juros: data.dias_carencia_juros || 0,
          desconto_pontualidade_percentual: data.desconto_pontualidade_percentual || 0,
          dias_desconto_pontualidade: data.dias_desconto_pontualidade || 0,
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("escola")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("escola")
          .update(config)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("escola")
          .insert({ nome: "Minha Escola", ...config });
        if (error) throw error;
      }

      toast.success("Configurações salvas");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const valorExemplo = 500;
  const diasAtrasoExemplo = 15;
  const jurosDiario = valorExemplo * (config.juros_percentual_diario_padrao / 100) * diasAtrasoExemplo;
  const multaPercentual = valorExemplo * (config.multa_percentual_padrao / 100);
  const totalExemplo = valorExemplo + jurosDiario + multaPercentual + config.multa_fixa_padrao;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ConfigField = ({ 
    id, 
    label, 
    value, 
    onChange, 
    hint,
    suffix,
    prefix,
    step = "0.01"
  }: { 
    id: string; 
    label: string; 
    value: number; 
    onChange: (v: number) => void; 
    hint?: string;
    suffix?: string;
    prefix?: string;
    step?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>
        )}
        <Input
          id={id}
          type="number"
          step={step}
          min="0"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`h-9 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Juros */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Juros por atraso</h3>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ConfigField
              id="jurosDiario"
              label="Taxa diária"
              value={config.juros_percentual_diario_padrao}
              onChange={(v) => setConfig({ ...config, juros_percentual_diario_padrao: v })}
              suffix="%"
              hint="Ex: 0.033% = ~1% ao mês"
              step="0.001"
            />
            <ConfigField
              id="jurosMensal"
              label="Taxa mensal"
              value={config.juros_percentual_mensal_padrao}
              onChange={(v) => setConfig({ ...config, juros_percentual_mensal_padrao: v })}
              suffix="%"
              hint="Usado quando juros diário = 0"
              step="0.1"
            />
          </div>
          <ConfigField
            id="diasCarencia"
            label="Dias de carência"
            value={config.dias_carencia_juros}
            onChange={(v) => setConfig({ ...config, dias_carencia_juros: v })}
            hint="Dias após vencimento antes de cobrar juros"
            step="1"
          />
        </div>
      </div>

      {/* Multa */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Multa por atraso</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ConfigField
              id="multaPercentual"
              label="Multa percentual"
              value={config.multa_percentual_padrao}
              onChange={(v) => setConfig({ ...config, multa_percentual_padrao: v })}
              suffix="%"
              hint="Máximo legal: 2%"
              step="0.1"
            />
            <ConfigField
              id="multaFixa"
              label="Multa fixa"
              value={config.multa_fixa_padrao}
              onChange={(v) => setConfig({ ...config, multa_fixa_padrao: v })}
              prefix="R$"
              hint="Valor fixo adicional"
            />
          </div>
        </div>
      </div>

      {/* Desconto */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Desconto por pontualidade</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ConfigField
              id="descontoPontualidade"
              label="Desconto"
              value={config.desconto_pontualidade_percentual}
              onChange={(v) => setConfig({ ...config, desconto_pontualidade_percentual: v })}
              suffix="%"
              hint="Desconto para pagamento antecipado"
              step="0.1"
            />
            <ConfigField
              id="diasDesconto"
              label="Dias antes do vencimento"
              value={config.dias_desconto_pontualidade}
              onChange={(v) => setConfig({ ...config, dias_desconto_pontualidade: v })}
              hint="Prazo para aplicar o desconto"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-muted/50 border border-border rounded-lg p-6">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Simulação: fatura de {formatCurrency(valorExemplo)} vencida há {diasAtrasoExemplo} dias
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor original</span>
            <span>{formatCurrency(valorExemplo)}</span>
          </div>
          <div className="flex justify-between text-destructive">
            <span>Juros ({diasAtrasoExemplo} dias)</span>
            <span>+{formatCurrency(jurosDiario)}</span>
          </div>
          {config.multa_percentual_padrao > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Multa ({config.multa_percentual_padrao}%)</span>
              <span>+{formatCurrency(multaPercentual)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatCurrency(totalExemplo)}</span>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
