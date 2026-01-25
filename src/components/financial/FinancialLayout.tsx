import { ReactNode } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FinancialSidebar } from "./FinancialSidebar";

interface FinancialLayoutProps {
  children: ReactNode;
}

export function FinancialLayout({ children }: FinancialLayoutProps) {
  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <FinancialSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardLayout>
  );
}
