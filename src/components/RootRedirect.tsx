import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RootRedirect() {
  const { user, loading } = useAuth();

  // While loading, let Index.tsx handle the loading state
  if (loading) {
    return null;
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
