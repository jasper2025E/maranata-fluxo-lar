import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Search,
  Filter,
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
    <Card className="border rounded-2xl shadow-sm overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Search & View Toggle - Shopify Style */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno, responsável ou código..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 pl-11 rounded-xl border-border/60 focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-11 px-4 rounded-xl gap-2 transition-all",
                showFilters && "shadow-md"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Filtros</span>
              {activeFilters.length > 0 && (
                <span className="h-5 w-5 bg-primary-foreground/20 text-[11px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </Button>
            <TooltipProvider delayDuration={100}>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                className="bg-muted/50 p-1.5 rounded-xl border border-border/40"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem 
                      value="list" 
                      aria-label="Lista"
                      className={cn(
                        "h-8 w-8 data-[state=on]:bg-background data-[state=on]:shadow-md rounded-lg transition-all",
                        "hover:bg-background/60"
                      )}
                    >
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Lista</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem 
                      value="status" 
                      aria-label="Por Status"
                      className={cn(
                        "h-8 w-8 data-[state=on]:bg-background data-[state=on]:shadow-md rounded-lg transition-all",
                        "hover:bg-background/60"
                      )}
                    >
                      <Layers className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Por Status</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem 
                      value="aluno" 
                      aria-label="Por Aluno"
                      className={cn(
                        "h-8 w-8 data-[state=on]:bg-background data-[state=on]:shadow-md rounded-lg transition-all",
                        "hover:bg-background/60"
                      )}
                    >
                      <Users className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Por Aluno</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem 
                      value="mes" 
                      aria-label="Por Mês"
                      className={cn(
                        "h-8 w-8 data-[state=on]:bg-background data-[state=on]:shadow-md rounded-lg transition-all",
                        "hover:bg-background/60"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Por Mês</TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </TooltipProvider>
          </div>
        </div>

        {/* Active Filters - Shopify Style Pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filtros:</span>
            {activeFilters.map((filter, i) => (
              <Badge key={i} variant="secondary" className="text-xs rounded-lg px-3 py-1 bg-primary/10 text-primary border-0">
                {filter}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-3 text-xs rounded-lg text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3 mr-1" />
              Limpar tudo
            </Button>
          </div>
        )}

        {/* Filter Panel - Shopify Style */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="aberta">Abertas</SelectItem>
                  <SelectItem value="paga">Pagas</SelectItem>
                  <SelectItem value="vencida">Vencidas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Aluno</label>
              <Select value={alunoFilter} onValueChange={onAlunoChange}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {alunos.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome_completo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Curso</label>
              <Select value={cursoFilter} onValueChange={onCursoChange}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {cursos.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-10 justify-start text-left font-normal rounded-xl">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
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
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
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
