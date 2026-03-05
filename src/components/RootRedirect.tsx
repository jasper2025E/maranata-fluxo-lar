import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";

const Institucional = lazy(() => import("@/pages/Institucional"));

export default function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Logged in → dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → landing page
  return (
    <Suspense fallback={<PageLoader />}>
      <Institucional />
    </Suspense>
  );
}
