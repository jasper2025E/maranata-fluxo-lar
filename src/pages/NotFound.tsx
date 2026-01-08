import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log como aviso para não poluir o console com "erro" em navegações legítimas
    console.warn("Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link to="/dashboard" className="text-primary underline hover:text-primary/90">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
