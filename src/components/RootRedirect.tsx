import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RootRedirect() {
  const { user, loading, isPlatformAdmin } = useAuth();

  // While loading, let Index.tsx handle the loading state
  if (loading) {
    return null;
  }

  // If not logged in, show the Index page (presentation)
  if (!user) {
    return null; // Let the Index component render
  }

  // Redirect based on role
  if (isPlatformAdmin()) {
    return <Navigate to="/platform" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
