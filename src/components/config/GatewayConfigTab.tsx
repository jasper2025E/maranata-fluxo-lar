import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Key, RefreshCw, Copy, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useGatewayConfigs, GATEWAY_INFO, GatewayType, GatewayConfig, PaymentMethodType } from "@/hooks/useGatewayConfigs";
const METHOD_LABELS: Record<PaymentMethodType, string> = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão",
  debit_card: "Débito",
  bank_transfer: "Transferência"
};
interface GatewayCardProps {
  config: GatewayConfig;
  onTest: () => void;
  onUpdate: (data: Partial<GatewayConfig>) => void;
  onDelete: () => void;
  onSetSecret: (keyName: string, value: string) => void;
  isTesting: boolean;
}
function GatewayCard({
  config,
  onTest,
  onUpdate,
  onDelete,
  onSetSecret,
  isTesting
}: GatewayCardProps) {
  const [showSecrets, setShowSecrets] = useState(false);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const info = GATEWAY_INFO[config.gateway_type];
  const hasApiKey = config.secrets.some(s => s.key_name === "api_key");
  const handleSaveSecret = async (keyName: string) => {
    const value = secretValues[keyName];
    if (!value) return;
    await onSetSecret(keyName, value);
    setSecretValues(prev => ({
      ...prev,
      [keyName]: ""
    }));
  };
  const copyWebhookUrl = () => {
    if (config.webhook_token) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const url = `${supabaseUrl}/functions/v1/gateway-webhook/${config.gateway_type}/${config.webhook_token}`;
      navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    }
  };
  return <div className="bg-card border border-border rounded-lg">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            {info.logo ? <img src={info.logo} alt={info.name} className="w-5 h-5 object-contain" /> : <CreditCard className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">{config.display_name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{info.name}</span>
              <span className="text-muted-foreground">·</span>
              <span className={`text-xs ${config.environment === "production" ? "text-primary" : "text-muted-foreground"}`}>
                {config.environment === "production" ? "Produção" : "Sandbox"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {config.is_default && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Padrão
            </span>}
          <span className={`h-2 w-2 rounded-full ${config.connection_status === "connected" ? "bg-green-500" : config.connection_status === "error" ? "bg-destructive" : "bg-yellow-500"}`} />
        </div>
      </div>
      
      {/* Ações e métodos */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={config.is_active} onCheckedChange={checked => onUpdate({
              is_active: checked
            })} className="scale-90" />
              <span className="text-xs text-muted-foreground">Ativo</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={config.is_default} onCheckedChange={checked => onUpdate({
              is_default: checked
            })} className="scale-90" />
              <span className="text-xs text-muted-foreground">Padrão</span>
            </label>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors flex items-center gap-1.5" onClick={() => setShowSecrets(!showSecrets)}>
              <Key className="w-3.5 h-3.5" />
              Credenciais
            </button>
            <button className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50" onClick={onTest} disabled={isTesting || !hasApiKey} title={!hasApiKey ? "Configure a API Key primeiro" : "Testar conexão"}>
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
            <button className="h-7 px-2 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Métodos */}
        <div className="flex flex-wrap gap-1">
          {config.allowed_methods.map(method => <span key={method} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {METHOD_LABELS[method]}
            </span>)}
        </div>
        
        {/* Erro de conexão */}
        {config.connection_error && <p className="text-xs text-destructive">{config.connection_error}</p>}
        
        {/* Credenciais colapsáveis */}
        {showSecrets && <div className="pt-3 border-t border-border space-y-3">
            {info.requiredSecrets.map(secretDef => {
          const existingSecret = config.secrets.find(s => s.key_name === secretDef.key);
          return <div key={secretDef.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{secretDef.label}</span>
                    {existingSecret && <span className="text-xs text-muted-foreground">
                        {new Date(existingSecret.last_rotated).toLocaleDateString('pt-BR')}
                      </span>}
                  </div>
                  <div className="flex gap-2">
                    <Input type="password" placeholder={existingSecret ? existingSecret.masked_value : secretDef.placeholder} value={secretValues[secretDef.key] || ""} onChange={e => setSecretValues(prev => ({
                ...prev,
                [secretDef.key]: e.target.value
              }))} className="h-8 text-xs font-mono" />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleSaveSecret(secretDef.key)} disabled={!secretValues[secretDef.key]}>
                      Salvar
                    </Button>
                  </div>
                </div>;
        })}
            
            {config.webhook_token && <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">Webhook</span>
                <div className="flex gap-2">
                  <Input readOnly value={`/gateway-webhook/${config.gateway_type}/${config.webhook_token.substring(0, 8)}...`} className="h-8 text-xs font-mono bg-muted" />
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={copyWebhookUrl}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>}
          </div>}
      </div>
    </div>;
}
interface AddGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    gateway_type: GatewayType;
    display_name: string;
    environment: "sandbox" | "production";
  }) => void;
  isLoading: boolean;
}
function AddGatewayDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading
}: AddGatewayDialogProps) {
  const [gatewayType, setGatewayType] = useState<GatewayType>("asaas");
  const [displayName, setDisplayName] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const handleSubmit = () => {
    if (!displayName.trim()) {
      toast.error("Digite um nome para identificar o gateway");
      return;
    }
    onAdd({
      gateway_type: gatewayType,
      display_name: displayName.trim(),
      environment
    });
    setDisplayName("");
    setGatewayType("asaas");
    setEnvironment("sandbox");
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar gateway</DialogTitle>
          <DialogDescription>
            Adicione um novo gateway de pagamento
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gateway</Label>
            <Select value={gatewayType} onValueChange={v => setGatewayType(v as GatewayType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GATEWAY_INFO).map(([key, info]) => <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.logo && <img src={info.logo} alt="" className="w-4 h-4" />}
                      <span>{info.name}</span>
                    </div>
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome de identificação</Label>
            <Input placeholder="Ex: Asaas Principal" className="h-9" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ambiente</Label>
            <Select value={environment} onValueChange={v => setEnvironment(v as "sandbox" | "production")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
                <SelectItem value="production">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading || !displayName.trim()}>
            {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
export function GatewayConfigTab() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null);
  const {
    configs,
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    setSecret,
    testConnection,
    isCreating
  } = useGatewayConfigs();
  const handleAddGateway = async (data: {
    gateway_type: GatewayType;
    display_name: string;
    environment: "sandbox" | "production";
  }) => {
    await createConfig(data);
    setAddDialogOpen(false);
  };
  const handleTest = async (configId: string) => {
    setTestingConfigId(configId);
    try {
      await testConnection(configId);
    } finally {
      setTestingConfigId(null);
    }
  };
  const handleSetSecret = async (configId: string, keyName: string, value: string) => {
    await setSecret({
      configId,
      keyName,
      value
    });
  };
  if (isLoading) {
    return <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>;
  }
  if (error) {
    return <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
        Erro ao carregar gateways: {(error as Error).message}
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-foreground">Gateways de pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Configure os gateways para processar cobranças
          </p>
        </div>
        
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Conectar
        </Button>
      </div>

      {/* Lista de Gateways */}
      {configs.length === 0 ? <div className="bg-card border border-dashed border-border rounded-lg">
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Nenhum gateway configurado</p>
            <p className="text-xs text-muted-foreground mb-4">
              Conecte um gateway para processar pagamentos
            </p>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Conectar primeiro gateway
            </Button>
          </div>
        </div> : <div className="space-y-3">
          {configs.map(config => <GatewayCard key={config.id} config={config} onTest={() => handleTest(config.id)} onUpdate={data => updateConfig({
        configId: config.id,
        data
      })} onDelete={() => deleteConfig(config.id)} onSetSecret={(keyName, value) => handleSetSecret(config.id, keyName, value)} isTesting={testingConfigId === config.id} />)}
        </div>}

      {/* Info */}
      <div className="bg-muted/50 rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          As credenciais são armazenadas com criptografia 
        </p>
      </div>

      <AddGatewayDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddGateway} isLoading={isCreating} />
    </div>;
}