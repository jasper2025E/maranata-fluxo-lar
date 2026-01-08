import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketingConfig, useUpdateConfig, useMarketingDomains, useMarketingPixels } from "@/hooks/useMarketing";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Settings, Target, Globe, Link2 } from "lucide-react";

interface ConfigFormValues {
  default_domain: string;
  default_pixels: string[];
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  auto_page_view: boolean;
  auto_scroll: boolean;
  auto_click: boolean;
}

export function MarketingConfigTab() {
  const { data: config, isLoading: configLoading } = useMarketingConfig();
  const { data: domains } = useMarketingDomains();
  const { data: pixels } = useMarketingPixels();
  const updateConfig = useUpdateConfig();

  const form = useForm<ConfigFormValues>({
    defaultValues: {
      default_domain: "",
      default_pixels: [],
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      auto_page_view: true,
      auto_scroll: false,
      auto_click: false,
    },
  });

  useEffect(() => {
    if (config) {
      const defaultDomain = (config['default_domain']?.valor || {}) as { id?: string };
      const defaultPixels = (Array.isArray(config['default_pixels']?.valor) ? config['default_pixels']?.valor : []) as string[];
      const utmParams = (config['utm_params']?.valor || {}) as { source?: string; medium?: string; campaign?: string };
      const autoEvents = (config['auto_events']?.valor || {}) as { page_view?: boolean; scroll?: boolean; click?: boolean };

      form.reset({
        default_domain: defaultDomain.id || "",
        default_pixels: defaultPixels,
        utm_source: utmParams.source || "",
        utm_medium: utmParams.medium || "",
        utm_campaign: utmParams.campaign || "",
        auto_page_view: autoEvents.page_view ?? true,
        auto_scroll: autoEvents.scroll ?? false,
        auto_click: autoEvents.click ?? false,
      });
    }
  }, [config, form]);

  const onSubmit = async (values: ConfigFormValues) => {
    await Promise.all([
      updateConfig.mutateAsync({
        chave: 'default_domain',
        valor: { id: values.default_domain },
      }),
      updateConfig.mutateAsync({
        chave: 'default_pixels',
        valor: values.default_pixels as unknown as Record<string, unknown>,
      }),
      updateConfig.mutateAsync({
        chave: 'utm_params',
        valor: {
          source: values.utm_source,
          medium: values.utm_medium,
          campaign: values.utm_campaign,
        },
      }),
      updateConfig.mutateAsync({
        chave: 'auto_events',
        valor: {
          page_view: values.auto_page_view,
          scroll: values.auto_scroll,
          click: values.auto_click,
        },
      }),
    ]);
  };

  if (configLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configurações padrão aplicadas a novas páginas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="default_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domínio Padrão
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o domínio padrão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {domains?.filter(d => d.status === 'active').map((domain) => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.dominio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Domínio usado automaticamente em novas páginas
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_pixels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Pixels Padrão
                  </FormLabel>
                  <div className="space-y-2">
                    {pixels?.filter(p => p.ativo).map((pixel) => (
                      <div key={pixel.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`pixel-${pixel.id}`}
                          checked={field.value?.includes(pixel.id)}
                          onChange={(e) => {
                            const value = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...value, pixel.id]);
                            } else {
                              field.onChange(value.filter(id => id !== pixel.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`pixel-${pixel.id}`} className="text-sm">
                          {pixel.nome} ({pixel.tipo})
                        </label>
                      </div>
                    ))}
                    {(!pixels || pixels.filter(p => p.ativo).length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum pixel ativo disponível
                      </p>
                    )}
                  </div>
                  <FormDescription>
                    Pixels adicionados automaticamente a novas páginas
                  </FormDescription>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Parâmetros UTM Padrão
            </CardTitle>
            <CardDescription>
              Parâmetros de rastreamento padrão para links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="utm_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>utm_source</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: facebook" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utm_medium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>utm_medium</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: cpc" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="utm_campaign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>utm_campaign</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: lancamento" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Eventos Automáticos
            </CardTitle>
            <CardDescription>
              Eventos disparados automaticamente nas páginas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="auto_page_view"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Page View</FormLabel>
                    <FormDescription>
                      Dispara evento quando a página é carregada
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auto_scroll"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Scroll Tracking</FormLabel>
                    <FormDescription>
                      Dispara evento quando o usuário rola a página
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auto_click"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Click Tracking</FormLabel>
                    <FormDescription>
                      Dispara evento quando o usuário clica em elementos
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateConfig.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateConfig.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
