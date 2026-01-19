import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Percent, 
  DollarSign, 
  Calendar, 
  Save,
  Loader2,
  Receipt,
  Clock,
  AlertCircle,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AsaasWebhookConfig } from "./AsaasWebhookConfig";

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
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações de cobrança");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if escola record exists
      const { data: existing } = await supabase
        .from("escola")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("escola")
          .update({
            juros_percentual_diario_padrao: config.juros_percentual_diario_padrao,
            juros_percentual_mensal_padrao: config.juros_percentual_mensal_padrao,
            multa_fixa_padrao: config.multa_fixa_padrao,
            multa_percentual_padrao: config.multa_percentual_padrao,
            dias_carencia_juros: config.dias_carencia_juros,
            desconto_pontualidade_percentual: config.desconto_pontualidade_percentual,
            dias_desconto_pontualidade: config.dias_desconto_pontualidade,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new escola record with defaults
        const { error } = await supabase
          .from("escola")
          .insert({
            nome: "Minha Escola",
            ...config,
          });

        if (error) throw error;
      }

      toast.success("Configurações de cobrança salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Calculate example values
  const valorExemplo = 500;
  const diasAtrasoExemplo = 15;
  const jurosDiario = valorExemplo * (config.juros_percentual_diario_padrao / 100) * diasAtrasoExemplo;
  const multaPercentual = valorExemplo * (config.multa_percentual_padrao / 100);
  const totalExemplo = valorExemplo + jurosDiario + multaPercentual + config.multa_fixa_padrao;

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Juros por Atraso */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            Juros por Atraso
          </CardTitle>
          <CardDescription>
            Configure as taxas de juros aplicadas automaticamente após o vencimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jurosDiario">Taxa de Juros Diária (%)</Label>
              <div className="relative">
                <Input
                  id="jurosDiario"
                  type="number"
                  step="0.001"
                  min="0"
                  value={config.juros_percentual_diario_padrao}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    juros_percentual_diario_padrao: parseFloat(e.target.value) || 0 
                  })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Aplicado por dia de atraso. Ex: 0.033% = ~1% ao mês
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurosMensal">Taxa de Juros Mensal (%)</Label>
              <div className="relative">
                <Input
                  id="jurosMensal"
                  type="number"
                  step="0.1"
                  min="0"
                  value={config.juros_percentual_mensal_padrao}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    juros_percentual_mensal_padrao: parseFloat(e.target.value) || 0 
                  })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Usado quando juros diário = 0. Dividido proporcionalmente
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diasCarencia">Dias de Carência</Label>
            <div className="relative">
              <Input
                id="diasCarencia"
                type="number"
                min="0"
                value={config.dias_carencia_juros}
                onChange={(e) => setConfig({ 
                  ...config, 
                  dias_carencia_juros: parseInt(e.target.value) || 0 
                })}
                className="max-w-[200px]"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Dias após o vencimento antes de começar a cobrar juros
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multa por Atraso */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Multa por Atraso
          </CardTitle>
          <CardDescription>
            Configure a multa aplicada quando a fatura vence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="multaPercentual">Multa Percentual (%)</Label>
              <div className="relative">
                <Input
                  id="multaPercentual"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={config.multa_percentual_padrao}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    multa_percentual_padrao: parseFloat(e.target.value) || 0 
                  })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Multa sobre o valor da fatura. Máximo legal: 2%
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="multaFixa">Multa Fixa (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="multaFixa"
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.multa_fixa_padrao}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    multa_fixa_padrao: parseFloat(e.target.value) || 0 
                  })}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Valor fixo adicional cobrado por atraso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desconto por Pontualidade */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-success" />
            Desconto por Pontualidade
          </CardTitle>
          <CardDescription>
            Configure descontos para pagamentos antecipados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descontoPontualidade">Desconto (%)</Label>
              <div className="relative">
                <Input
                  id="descontoPontualidade"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={config.desconto_pontualidade_percentual}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    desconto_pontualidade_percentual: parseFloat(e.target.value) || 0 
                  })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Desconto para pagamentos antes do vencimento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasDesconto">Dias antes do vencimento</Label>
              <Input
                id="diasDesconto"
                type="number"
                min="0"
                value={config.dias_desconto_pontualidade}
                onChange={(e) => setConfig({ 
                  ...config, 
                  dias_desconto_pontualidade: parseInt(e.target.value) || 0 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Quantos dias antes do vencimento o desconto é aplicado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview/Simulação */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Simulação de Cobrança
          </CardTitle>
          <CardDescription>
            Exemplo com fatura de {formatCurrency(valorExemplo)} vencida há {diasAtrasoExemplo} dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor Original:</span>
              <span className="font-medium">{formatCurrency(valorExemplo)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Juros ({config.juros_percentual_diario_padrao}% × {diasAtrasoExemplo} dias):</span>
              <span>+ {formatCurrency(jurosDiario)}</span>
            </div>
            {config.multa_percentual_padrao > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Multa ({config.multa_percentual_padrao}%):</span>
                <span>+ {formatCurrency(multaPercentual)}</span>
              </div>
            )}
            {config.multa_fixa_padrao > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Multa Fixa:</span>
                <span>+ {formatCurrency(config.multa_fixa_padrao)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Valor Final:</span>
              <span className="text-primary">{formatCurrency(totalExemplo)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações de Cobrança
            </>
          )}
        </Button>
      </div>

      {/* Asaas Webhook Config */}
      <Separator className="my-8" />
      <AsaasWebhookConfig />
    </div>
  );
}
