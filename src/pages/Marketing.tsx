import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutTemplate, 
  Target, 
  Globe, 
  Settings, 
  BarChart3,
  TrendingUp,
  Palette
} from "lucide-react";
import { LandingPagesTab } from "@/components/marketing/LandingPagesTab";
import { PixelsTab } from "@/components/marketing/PixelsTab";
import { DomainsTab } from "@/components/marketing/DomainsTab";
import { MarketingConfigTab } from "@/components/marketing/MarketingConfigTab";
import { MarketingReportsTab } from "@/components/marketing/MarketingReportsTab";
import { MarketingDashboard } from "@/components/marketing/MarketingDashboard";
import { LandingPageEditor } from "@/components/marketing/LandingPageEditor";

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Central de Marketing</h1>
            <p className="text-muted-foreground">
              Gerencie páginas, pixels, domínios e acompanhe métricas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Páginas</span>
            </TabsTrigger>
            <TabsTrigger value="pixels" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Pixels</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Domínios</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <MarketingDashboard />
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <LandingPageEditor />
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <LandingPagesTab />
          </TabsContent>

          <TabsContent value="pixels" className="space-y-4">
            <PixelsTab />
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <DomainsTab />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <MarketingReportsTab />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <MarketingConfigTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
