import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { 
  CalendarIcon, 
  Download, 
  Eye, 
  MousePointerClick, 
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";
import { usePageViews, useConversions, useMarketingPages, useMarketingPixels, useMarketingDomains } from "@/hooks/useMarketing";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  views: {
    label: "Visualizações",
    color: "hsl(var(--primary))",
  },
  conversions: {
    label: "Conversões",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function MarketingReportsTab() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedPage, setSelectedPage] = useState<string>("all");
  const [selectedPixel, setSelectedPixel] = useState<string>("all");

  const { data: pages } = useMarketingPages();
  const { data: pixels } = useMarketingPixels();
  const { data: domains } = useMarketingDomains();
  
  const { data: pageViews, isLoading: viewsLoading } = usePageViews(
    selectedPage === "all" ? undefined : selectedPage,
    startOfDay(dateRange.from).toISOString(),
    endOfDay(dateRange.to).toISOString()
  );
  
  const { data: conversions, isLoading: conversionsLoading } = useConversions(
    selectedPage === "all" ? undefined : selectedPage,
    startOfDay(dateRange.from).toISOString(),
    endOfDay(dateRange.to).toISOString()
  );

  // Page performance data
  const pagePerformance = useMemo(() => {
    if (!pages || !pageViews || !conversions) return [];

    return pages.map(page => {
      const views = pageViews.filter(v => v.page_id === page.id).length;
      const convs = conversions.filter(c => c.page_id === page.id).length;
      const rate = views > 0 ? ((convs / views) * 100).toFixed(1) : "0";

      return {
        name: page.nome,
        views,
        conversions: convs,
        rate: parseFloat(rate),
      };
    }).sort((a, b) => b.views - a.views);
  }, [pages, pageViews, conversions]);

  // Device breakdown
  const deviceBreakdown = useMemo(() => {
    if (!pageViews) return [];

    const devices: Record<string, number> = {};
    pageViews.forEach(view => {
      const device = view.device_type || 'Desconhecido';
      devices[device] = (devices[device] || 0) + 1;
    });

    return Object.entries(devices).map(([name, value]) => ({ name, value }));
  }, [pageViews]);

  // UTM Source breakdown
  const sourceBreakdown = useMemo(() => {
    if (!pageViews) return [];

    const sources: Record<string, number> = {};
    pageViews.forEach(view => {
      const source = view.utm_source || 'Direto';
      sources[source] = (sources[source] || 0) + 1;
    });

    return Object.entries(sources)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [pageViews]);

  // Conversion events breakdown
  const eventBreakdown = useMemo(() => {
    if (!conversions) return [];

    const events: Record<string, number> = {};
    conversions.forEach(conv => {
      events[conv.event_name] = (events[conv.event_name] || 0) + 1;
    });

    return Object.entries(events)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [conversions]);

  const isLoading = viewsLoading || conversionsLoading;

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione o período e filtros para os relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione um período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ from: range.from, to: range.to || range.from });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as páginas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as páginas</SelectItem>
                {pages?.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPixel} onValueChange={setSelectedPixel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os pixels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pixels</SelectItem>
                {pixels?.map((pixel) => (
                  <SelectItem key={pixel.id} value={pixel.id}>
                    {pixel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {pageViews?.length.toLocaleString('pt-BR') || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {conversions?.length.toLocaleString('pt-BR') || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {pageViews && pageViews.length > 0
                  ? ((conversions?.length || 0) / pageViews.length * 100).toFixed(1)
                  : "0"}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Páginas Ativas</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages?.filter(p => p.status === 'published').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Page Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Página</CardTitle>
            <CardDescription>
              Visualizações e conversões por landing page
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pagePerformance.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={pagePerformance.slice(0, 5)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                  <Bar dataKey="conversions" fill="var(--color-conversions)" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <CardDescription>
              Acessos por tipo de dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : deviceBreakdown.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {deviceBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {deviceBreakdown.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Fontes de Tráfego</CardTitle>
            <CardDescription>
              De onde vem seus visitantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : sourceBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="space-y-4">
                {sourceBreakdown.map((source, index) => {
                  const total = sourceBreakdown.reduce((acc, s) => acc + s.value, 0);
                  const percentage = total > 0 ? (source.value / total * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={source.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {source.value} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Events */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Conversão</CardTitle>
            <CardDescription>
              Tipos de conversões registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : eventBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum evento registrado
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventBreakdown.map((event) => (
                      <TableRow key={event.name}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{event.name}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{event.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Domains in Use */}
      <Card>
        <CardHeader>
          <CardTitle>Domínios em Uso</CardTitle>
          <CardDescription>
            Status dos domínios cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!domains || domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum domínio cadastrado
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SSL</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead className="text-right">Páginas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((domain) => {
                    const domainPages = pages?.filter(p => p.domain_id === domain.id).length || 0;
                    
                    return (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.dominio}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={domain.status === 'active' ? 'default' : 'secondary'}
                          >
                            {domain.status === 'active' ? 'Ativo' : 
                             domain.status === 'pending' ? 'Pendente' : 'Erro'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={domain.ssl_ativo ? 'default' : 'outline'}>
                            {domain.ssl_ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={domain.verificado ? 'default' : 'secondary'}>
                            {domain.verificado ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{domainPages}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
