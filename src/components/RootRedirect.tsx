import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/PageLoader";

export default function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Logged in -> dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Visitor -> institutional site (before auth)
  return <Navigate to="/site" replace />;
}

