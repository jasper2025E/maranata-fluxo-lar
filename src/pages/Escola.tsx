import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { Building2, CreditCard } from "lucide-react";
import EscolaDadosTab from "@/components/escola/EscolaDadosTab";
import EscolaAssinaturaTab from "@/components/escola/EscolaAssinaturaTab";

const tabs = [
  { id: "dados", label: "Dados da Escola", icon: Building2 },
  { id: "assinatura", label: "Assinatura", icon: CreditCard },
];

const EscolaPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dados";

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <DashboardLayout>
      <div className="flex gap-8 max-w-6xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-48 shrink-0">
          <nav className="space-y-1 sticky top-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === "dados" && <EscolaDadosTab />}
          {activeTab === "assinatura" && <EscolaAssinaturaTab />}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default EscolaPage;
