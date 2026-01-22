import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  SlidersHorizontal,
  LayoutList,
  Layers,
  Users,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
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

const viewModes = [
  { value: "list", icon: LayoutList, label: "Lista" },
  { value: "status", icon: Layers, label: "Status" },
  { value: "aluno", icon: Users, label: "Aluno" },
  { value: "mes", icon: CalendarIcon, label: "Mês" },
] as const;

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

  const activeFiltersCount = [
    statusFilter !== "todas",
    alunoFilter !== "todos",
    cursoFilter !== "todos",
    periodoFilter.start !== null,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onStatusChange("todas");
    onAlunoChange("todos");
    onCursoChange("todos");
    onPeriodoChange({ start: null, end: null });
  };

  return (
    <div className="space-y-3">
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno, responsável ou código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-10 bg-background/50 border-border/50 focus:bg-background"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter toggle & View modes */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-10 gap-2 px-3",
              activeFiltersCount > 0 && "border-primary/50"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-[10px] bg-primary/10 text-primary">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              showFilters && "rotate-180"
            )} />
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-0.5">
            {viewModes.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => onViewModeChange(value)}
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-md transition-all",
                  viewMode === value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="aberta">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Abertas
                    </span>
                  </SelectItem>
                  <SelectItem value="paga">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Pagas
                    </span>
                  </SelectItem>
                  <SelectItem value="vencida">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Vencidas
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelada">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gray-400" />
                      Canceladas
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aluno */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Aluno</label>
              <Select value={alunoFilter} onValueChange={onAlunoChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {alunos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Curso */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Curso</label>
              <Select value={cursoFilter} onValueChange={onCursoChange}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {cursos.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal bg-background",
                      !periodoFilter.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2 shrink-0" />
                    {periodoFilter.start ? (
                      <span className="truncate">
                        {format(periodoFilter.start, "dd/MM")}
                        {periodoFilter.end && ` - ${format(periodoFilter.end, "dd/MM")}`}
                      </span>
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
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
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active filters & Clear */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex flex-wrap items-center gap-2">
                {statusFilter !== "todas" && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Status: {statusFilter}
                    <button 
                      onClick={() => onStatusChange("todas")}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {alunoFilter !== "todos" && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Aluno filtrado
                    <button 
                      onClick={() => onAlunoChange("todos")}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {cursoFilter !== "todos" && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Curso filtrado
                    <button 
                      onClick={() => onCursoChange("todos")}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {periodoFilter.start && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    {format(periodoFilter.start, "dd/MM")}
                    {periodoFilter.end && ` - ${format(periodoFilter.end, "dd/MM")}`}
                    <button 
                      onClick={() => onPeriodoChange({ start: null, end: null })}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                Limpar tudo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
