import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Database, HardDrive, Users, GraduationCap, BookOpen, Receipt, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CapacityData {
  alunos: number;
  turmas: number;
  cursos: number;
  faturas: number;
  usuarios: number;
  responsaveis: number;
}

interface LimitsConfig {
  maxAlunos: number;
  maxTurmas: number;
  maxFaturas: number;
  maxUsuarios: number;
  dbSizeMB: number;
  dbLimitMB: number;
  storageSizeMB: number;
  storageLimitMB: number;
}

const LIMITS: LimitsConfig = {
  maxAlunos: 50000,
  maxTurmas: 500,
  maxFaturas: 100000,
  maxUsuarios: 100,
  dbSizeMB: 18, // Atual estimado
  dbLimitMB: 8192, // 8GB
  storageSizeMB: 34,
  storageLimitMB: 1024, // 1GB
};

export function SystemCapacityCard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CapacityData>({
    alunos: 0,
    turmas: 0,
    cursos: 0,
    faturas: 0,
    usuarios: 0,
    responsaveis: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          { count: alunosCount },
          { count: turmasCount },
          { count: cursosCount },
          { count: faturasCount },
          { count: usuariosCount },
          { count: responsaveisCount },
        ] = await Promise.all([
          supabase.from("alunos").select("*", { count: "exact", head: true }),
          supabase.from("turmas").select("*", { count: "exact", head: true }),
          supabase.from("cursos").select("*", { count: "exact", head: true }),
          supabase.from("faturas").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("responsaveis").select("*", { count: "exact", head: true }),
        ]);

        setData({
          alunos: alunosCount || 0,
          turmas: turmasCount || 0,
          cursos: cursosCount || 0,
          faturas: faturasCount || 0,
          usuarios: usuariosCount || 0,
          responsaveis: responsaveisCount || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar dados de capacidade:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString("pt-BR");
  };

  const getPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return "text-green-600";
    if (percentage < 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg">
        <div className="px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const dbPercentage = (LIMITS.dbSizeMB / LIMITS.dbLimitMB) * 100;
  const storagePercentage = (LIMITS.storageSizeMB / LIMITS.storageLimitMB) * 100;

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">Capacidade do Sistema</span>
      </div>
      <div className="p-4 space-y-6">
        {/* Recursos */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">Infraestrutura</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Database className="h-3 w-3" />
                  Banco de Dados
                </span>
                <span className={getStatusColor(dbPercentage)}>
                  {LIMITS.dbSizeMB} MB / 8 GB
                </span>
              </div>
              <Progress value={dbPercentage} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  Armazenamento
                </span>
                <span className={getStatusColor(storagePercentage)}>
                  {LIMITS.storageSizeMB} MB / 1 GB
                </span>
              </div>
              <Progress value={storagePercentage} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Contagem de Registros */}
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-medium">Registros Atuais</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <GraduationCap className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.alunos)}</p>
              <p className="text-[10px] text-muted-foreground">Alunos</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.responsaveis)}</p>
              <p className="text-[10px] text-muted-foreground">Responsáveis</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <Building className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.turmas)}</p>
              <p className="text-[10px] text-muted-foreground">Turmas</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <BookOpen className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.cursos)}</p>
              <p className="text-[10px] text-muted-foreground">Cursos</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <Receipt className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.faturas)}</p>
              <p className="text-[10px] text-muted-foreground">Faturas</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-foreground">{formatNumber(data.usuarios)}</p>
              <p className="text-[10px] text-muted-foreground">Usuários</p>
            </div>
          </div>
        </div>

        {/* Limites Recomendados */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">Limites Suportados</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Até <strong className="text-foreground">50.000</strong> alunos com resposta &lt;200ms</p>
            <p>• Até <strong className="text-foreground">100.000</strong> faturas com indexação otimizada</p>
            <p>• <strong className="text-foreground">500</strong> requisições simultâneas</p>
            <p>• Backup automático diário incluído</p>
          </div>
        </div>
      </div>
    </div>
  );
}
