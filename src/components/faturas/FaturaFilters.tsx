import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Users,
  Layers,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "status" | "aluno" | "mes";

interface Aluno {
  id: string;
  nome_completo: string;
}

interface Curso {
  id: string;
  nome: string;
}

interface FaturaFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  alunoFilter: string;
  onAlunoChange: (value: string) => void;
  cursoFilter: string;
  onCursoChange: (value: string) => void;
  periodoFilter: { start: Date | null; end: Date | null };
  onPeriodoChange: (value: { start: Date | null; end: Date | null }) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  alunos: Aluno[];
  cursos: Curso[];
}

export function FaturaFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  alunoFilter,
  onAlunoChange,
  cursoFilter,
  onCursoChange,
  periodoFilter,
  onPeriodoChange,
  viewMode,
  onViewModeChange,
  alunos,
  cursos,
}: FaturaFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = [
    statusFilter !== "todas" && `Status: ${statusFilter}`,
    alunoFilter !== "todos" && `Aluno filtrado`,
    cursoFilter !== "todos" && `Curso filtrado`,
    periodoFilter.start && `Período: ${format(periodoFilter.start, "dd/MM")}${periodoFilter.end ? ` - ${format(periodoFilter.end, "dd/MM")}` : ""}`,
  ].filter(Boolean);

  const clearFilters = () => {
    onStatusChange("todas");
    onAlunoChange("todos");
    onCursoChange("todos");
    onPeriodoChange({ start: null, end: null });
  };

  return (
    <Card className="border">
      <CardContent className="p-4 space-y-4">
        {/* Search & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno, responsável ou código..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {activeFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </Button>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => onViewModeChange("list")}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "status" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => onViewModeChange("status")}
                title="Por Status"
              >
                <Layers className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "aluno" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => onViewModeChange("aluno")}
                title="Por Aluno"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "mes" ? "default" : "ghost"}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => onViewModeChange("mes")}
                title="Por Mês"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filtros ativos:</span>
            {activeFilters.map((filter, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {filter}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="paga">Pagas</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Aluno</label>
              <Select value={alunoFilter} onValueChange={onAlunoChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {alunos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Curso</label>
              <Select value={cursoFilter} onValueChange={onCursoChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {cursos.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {periodoFilter.start ? (
                      periodoFilter.end ? (
                        `${format(periodoFilter.start, "dd/MM")} - ${format(periodoFilter.end, "dd/MM")}`
                      ) : (
                        format(periodoFilter.start, "dd/MM/yyyy")
                      )
                    ) : (
                      <span className="text-muted-foreground">Selecionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: periodoFilter.start || undefined,
                      to: periodoFilter.end || undefined,
                    }}
                    onSelect={(range) => {
                      onPeriodoChange({
                        start: range?.from || null,
                        end: range?.to || null,
                      });
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
