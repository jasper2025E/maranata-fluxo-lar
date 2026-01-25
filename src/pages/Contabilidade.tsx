import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { 
  BookOpen, 
  ChevronRight, 
  Receipt, 
  FileText, 
  Building2, 
  Calculator,
  TrendingUp,
  AlertCircle,
  Package,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FinancialLayout } from "@/components/layouts";
import { PremiumGate } from "@/components/premium";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FinancialKPICard } from "@/components/dashboard";
import { formatCurrency } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TabType = "overview" | "lancamentos" | "dre" | "patrimonio" | "impostos";

const tabs: { id: TabType; labelKey: string; icon: React.ElementType }[] = [
  { id: "overview", labelKey: "accounting.tabs.overview", icon: BarChart3 },
  { id: "lancamentos", labelKey: "accounting.tabs.entries", icon: Receipt },
  { id: "dre", labelKey: "accounting.tabs.dre", icon: FileText },
  { id: "patrimonio", labelKey: "accounting.tabs.assets", icon: Package },
  { id: "impostos", labelKey: "accounting.tabs.taxes", icon: Calculator },
];

// Hook para buscar resumo contábil
function useAccountingSummary() {
  return useQuery({
    queryKey: ["accounting-summary"],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const [lancamentosResult, bensResult, impostosResult] = await Promise.all([
        supabase
          .from("lancamentos_contabeis")
          .select("tipo, natureza, valor")
          .gte("data_competencia", `${currentYear}-01-01`),
        supabase
          .from("bens_patrimoniais")
          .select("valor_aquisicao, depreciacao_acumulada, valor_contabil_atual")
          .eq("status", "ativo"),
        supabase
          .from("impostos_estimados")
          .select("valor_estimado, valor_pago, status")
          .eq("ano_referencia", currentYear),
      ]);

      const lancamentos = lancamentosResult.data || [];
      const bens = bensResult.data || [];
      const impostos = impostosResult.data || [];

      const totalReceitas = lancamentos
        .filter(l => l.tipo === "receita")
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const totalDespesas = lancamentos
        .filter(l => l.tipo === "despesa")
        .reduce((sum, l) => sum + Number(l.valor), 0);

      const resultadoLiquido = totalReceitas - totalDespesas;

      const valorPatrimonio = bens.reduce((sum, b) => sum + Number(b.valor_contabil_atual || 0), 0);
      const depreciacaoTotal = bens.reduce((sum, b) => sum + Number(b.depreciacao_acumulada || 0), 0);

      const impostosEstimados = impostos.reduce((sum, i) => sum + Number(i.valor_estimado), 0);
      const impostosPagos = impostos.reduce((sum, i) => sum + Number(i.valor_pago), 0);
      const impostosPendentes = impostos.filter(i => i.status === "pendente").length;

      return {
        totalReceitas,
        totalDespesas,
        resultadoLiquido,
        margemLiquida: totalReceitas > 0 ? (resultadoLiquido / totalReceitas) * 100 : 0,
        valorPatrimonio,
        depreciacaoTotal,
        totalBens: bens.length,
        impostosEstimados,
        impostosPagos,
        impostosPendentes,
        totalLancamentos: lancamentos.length,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

const Contabilidade = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as TabType) || "overview";
  
  const { data: summary, isLoading } = useAccountingSummary();

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  return (
    <FinancialLayout>
      <PremiumGate feature="accounting">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("nav.finance")}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{t("accounting.title")}</span>
            </nav>

            {/* Tabs for sub-navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}

            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-card border rounded-2xl p-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {t("common.loading")}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            {!isLoading && summary && (
              <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {currentTab === "overview" && (
                    <>
                      {/* KPIs */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FinancialKPICard
                          title={t("accounting.totalRevenue")}
                          value={formatCurrency(summary.totalReceitas)}
                          subtitle={t("accounting.yearToDate")}
                          icon={TrendingUp}
                          variant="success"
                          index={0}
                        />
                        <FinancialKPICard
                          title={t("accounting.totalExpenses")}
                          value={formatCurrency(summary.totalDespesas)}
                          subtitle={t("accounting.yearToDate")}
                          icon={Receipt}
                          variant="danger"
                          index={1}
                        />
                        <FinancialKPICard
                          title={t("accounting.netResult")}
                          value={formatCurrency(summary.resultadoLiquido)}
                          subtitle={summary.resultadoLiquido >= 0 ? t("dashboard.surplus") : t("dashboard.deficit")}
                          icon={Calculator}
                          variant={summary.resultadoLiquido >= 0 ? "success" : "danger"}
                          index={2}
                        />
                        <FinancialKPICard
                          title={t("accounting.netMargin")}
                          value={`${summary.margemLiquida.toFixed(1)}%`}
                          subtitle={t("accounting.profitability")}
                          icon={BarChart3}
                          variant={summary.margemLiquida >= 15 ? "success" : summary.margemLiquida >= 5 ? "warning" : "danger"}
                          index={3}
                        />
                      </div>

                      {/* Secondary KPIs */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <FinancialKPICard
                          title={t("accounting.assetValue")}
                          value={formatCurrency(summary.valorPatrimonio)}
                          subtitle={`${summary.totalBens} ${t("accounting.registeredAssets")}`}
                          icon={Package}
                          variant="info"
                          size="sm"
                          index={4}
                        />
                        <FinancialKPICard
                          title={t("accounting.depreciation")}
                          value={formatCurrency(summary.depreciacaoTotal)}
                          subtitle={t("accounting.accumulated")}
                          icon={Building2}
                          variant="warning"
                          size="sm"
                          index={5}
                        />
                        <FinancialKPICard
                          title={t("accounting.estimatedTaxes")}
                          value={formatCurrency(summary.impostosEstimados)}
                          subtitle={`${summary.impostosPendentes} ${t("accounting.pending")}`}
                          icon={FileText}
                          variant="default"
                          size="sm"
                          index={6}
                        />
                        <FinancialKPICard
                          title={t("accounting.entries")}
                          value={summary.totalLancamentos}
                          subtitle={t("accounting.yearToDate")}
                          icon={BookOpen}
                          variant="default"
                          size="sm"
                          index={7}
                        />
                      </div>

                      {/* Quick Actions */}
                      <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("lancamentos")}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Receipt className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{t("accounting.newEntry")}</CardTitle>
                                <CardDescription>{t("accounting.newEntryDesc")}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("dre")}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{t("accounting.viewDRE")}</CardTitle>
                                <CardDescription>{t("accounting.viewDREDesc")}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("patrimonio")}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{t("accounting.manageAssets")}</CardTitle>
                                <CardDescription>{t("accounting.manageAssetsDesc")}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </div>

                      {/* Info Notice */}
                      <Card className="bg-amber-500/5 border-amber-500/20">
                        <CardContent className="pt-6">
                          <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                {t("accounting.disclaimer")}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t("accounting.disclaimerDesc")}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {currentTab === "lancamentos" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("accounting.tabs.entries")}</CardTitle>
                        <CardDescription>{t("accounting.entriesDescription")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            {t("accounting.noEntries")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentTab === "dre" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("accounting.tabs.dre")}</CardTitle>
                        <CardDescription>{t("accounting.dreDescription")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* DRE Simplificada */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-3 font-medium">
                              {t("accounting.incomeStatement")}
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm">{t("accounting.grossRevenue")}</span>
                                <span className="font-medium text-emerald-600">
                                  {formatCurrency(summary.totalReceitas)}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm">{t("accounting.operatingExpenses")}</span>
                                <span className="font-medium text-rose-600">
                                  ({formatCurrency(summary.totalDespesas)})
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm">{t("accounting.depreciation")}</span>
                                <span className="font-medium text-rose-600">
                                  ({formatCurrency(summary.depreciacaoTotal)})
                                </span>
                              </div>
                              <div className="flex justify-between py-3 bg-muted/50 rounded-lg px-3 -mx-1">
                                <span className="font-semibold">{t("accounting.netResult")}</span>
                                <span className={cn(
                                  "font-bold",
                                  summary.resultadoLiquido >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                  {formatCurrency(summary.resultadoLiquido)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentTab === "patrimonio" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("accounting.tabs.assets")}</CardTitle>
                        <CardDescription>{t("accounting.assetsDescription")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            {t("accounting.noAssets")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {currentTab === "impostos" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("accounting.tabs.taxes")}</CardTitle>
                        <CardDescription>{t("accounting.taxesDescription")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">
                            {t("accounting.noTaxes")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </PremiumGate>
    </FinancialLayout>
  );
};

export default Contabilidade;
