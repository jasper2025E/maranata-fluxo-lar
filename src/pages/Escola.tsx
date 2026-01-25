import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import EscolaDadosTab from "@/components/escola/EscolaDadosTab";
import EscolaAssinaturaTab from "@/components/escola/EscolaAssinaturaTab";

const EscolaPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dados";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {activeTab === "dados" && <EscolaDadosTab />}
        {activeTab === "assinatura" && <EscolaAssinaturaTab />}
      </div>
    </DashboardLayout>
  );
};

export default EscolaPage;
