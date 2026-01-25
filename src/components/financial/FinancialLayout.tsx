// This file is kept for backward compatibility but the layout is now simplified
// All financial pages now use DashboardLayout directly

import { ReactNode } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface FinancialLayoutProps {
  children: ReactNode;
}

export function FinancialLayout({ children }: FinancialLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
