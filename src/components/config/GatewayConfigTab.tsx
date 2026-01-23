import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Trash2, 
  Key, 
  RefreshCw,
  Wifi,
  WifiOff,
  Copy,
  Loader2,
  CreditCard,
  AlertTriangle,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  useGatewayConfigs, 
  GATEWAY_INFO, 
  GatewayType, 
  GatewayConfig,
  PaymentMethodType,
} from "@/hooks/useGatewayConfigs";

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão",
  debit_card: "Débito",
  bank_transfer: "Transferência",
};

interface GatewayCardProps {
  config: GatewayConfig;
  onTest: () => void;
  onUpdate: (data: Partial<GatewayConfig>) => void;
  onDelete: () => void;
  onSetSecret: (keyName: string, value: string) => void;
  isTesting: boolean;
}

function GatewayCard({ config, onTest, onUpdate, onDelete, onSetSecret, isTesting }: GatewayCardProps) {
  const [showSecrets, setShowSecrets] = useState(false);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  
  const info = GATEWAY_INFO[config.gateway_type];
  
  const handleSaveSecret = async (keyName: string) => {
    const value = secretValues[keyName];
    if (!value) return;
    
    await onSetSecret(keyName, value);
    setSecretValues(prev => ({ ...prev, [keyName]: "" }));
  };

  const copyWebhookUrl = () => {
    if (config.webhook_token) {
      const url = `${window.location.origin}/functions/v1/gateway-webhook/${config.gateway_type}/${config.webhook_token}`;
      navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    }
  };

  return (
    <div className={`bg-card border rounded-lg ${config.is_default ? 'border-primary/50' : 'border-border'}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {info.logo ? (
              <img src={info.logo} alt={info.name} className="w-6 h-6 rounded" />
            ) : (
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{config.display_name}</span>
                {config.is_default && (
                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                    <Star className="w-3 h-3 mr-0.5" />
                    Padrão
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{info.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${config.environment === "production" 
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-muted text-muted-foreground"
              }`}
            >
              {config.environment === "production" ? "Produção" : "Sandbox"}
            </Badge>
            
            {config.connection_status === "connected" ? (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <Wifi className="w-3 h-3 mr-1" />
                OK
              </Badge>
            ) : config.connection_status === "error" ? (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Erro
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Pendente
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Status e Métodos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id={`active-${config.id}`}
                checked={config.is_active}
                onCheckedChange={(checked) => onUpdate({ is_active: checked })}
                className="scale-90"
              />
              <Label htmlFor={`active-${config.id}`} className="text-xs text-muted-foreground">Ativo</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id={`default-${config.id}`}
                checked={config.is_default}
                onCheckedChange={(checked) => onUpdate({ is_default: checked })}
                className="scale-90"
              />
              <Label htmlFor={`default-${config.id}`} className="text-xs text-muted-foreground">Padrão</Label>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
              onClick={onTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              <Key className="w-3.5 h-3.5 mr-1" />
              Credenciais
              {showSecrets ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="flex flex-wrap gap-1">
          {config.allowed_methods.map((method) => (
            <Badge key={method} variant="secondary" className="text-xs py-0 px-1.5 font-normal">
              {METHOD_LABELS[method]}
            </Badge>
          ))}
        </div>
        
        {/* Seção de Credenciais */}
        {showSecrets && (
          <div className="pt-3 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground">
              Credenciais criptografadas com AES-256
            </p>
            
            {info.requiredSecrets.map((secretDef) => {
              const existingSecret = config.secrets.find(s => s.key_name === secretDef.key);
              
              return (
                <div key={secretDef.key} className="space-y-1.5">
                  <Label className="text-xs font-medium">{secretDef.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder={existingSecret ? existingSecret.masked_value : secretDef.placeholder}
                      value={secretValues[secretDef.key] || ""}
                      onChange={(e) => setSecretValues(prev => ({ 
                        ...prev, 
                        [secretDef.key]: e.target.value 
                      }))}
                      className="h-8 text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSaveSecret(secretDef.key)}
                      disabled={!secretValues[secretDef.key]}
                    >
                      Salvar
                    </Button>
                  </div>
                  {existingSecret && (
                    <p className="text-xs text-muted-foreground">
                      Atualizado: {new Date(existingSecret.last_rotated).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              );
            })}
            
            {/* Webhook URL */}
            {config.webhook_token && (
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium">Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`/gateway-webhook/${config.gateway_type}/${config.webhook_token.substring(0, 8)}...`}
                    className="h-8 text-xs font-mono bg-muted"
                  />
                  <Button size="sm" variant="outline" className="h-8" onClick={copyWebhookUrl}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {config.connection_error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">
            {config.connection_error}
          </div>
        )}
      </div>
    </div>
  );
}

interface AddGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { gateway_type: GatewayType; display_name: string; environment: "sandbox" | "production" }) => void;
  isLoading: boolean;
}

function AddGatewayDialog({ open, onOpenChange, onAdd, isLoading }: AddGatewayDialogProps) {
  const [gatewayType, setGatewayType] = useState<GatewayType>("asaas");
  const [displayName, setDisplayName] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");

  const handleSubmit = () => {
    if (!displayName.trim()) {
      toast.error("Digite um nome para identificar o gateway");
      return;
    }
    
    onAdd({ gateway_type: gatewayType, display_name: displayName.trim(), environment });
    setDisplayName("");
    setGatewayType("asaas");
    setEnvironment("sandbox");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Select value={gatewayType} onValueChange={(v) => setGatewayType(v as GatewayType)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GATEWAY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.logo && <img src={info.logo} alt="" className="w-4 h-4" />}
                      <span>{info.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome de identificação</Label>
            <Input
              placeholder="Ex: Asaas Principal"
              className="h-9"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ambiente</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
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
    </Dialog>
  );
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
    isCreating,
  } = useGatewayConfigs();

  const handleAddGateway = async (data: { gateway_type: GatewayType; display_name: string; environment: "sandbox" | "production" }) => {
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
    await setSecret({ configId, keyName, value });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">
        Erro ao carregar gateways: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      {configs.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-lg">
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
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <GatewayCard
              key={config.id}
              config={config}
              onTest={() => handleTest(config.id)}
              onUpdate={(data) => updateConfig({ configId: config.id, data })}
              onDelete={() => deleteConfig(config.id)}
              onSetSecret={(keyName, value) => handleSetSecret(config.id, keyName, value)}
              isTesting={testingConfigId === config.id}
            />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-muted/50 rounded-lg px-4 py-3">
        <p className="text-xs text-muted-foreground">
          As credenciais são armazenadas com criptografia AES-256. Cada escola tem suas próprias chaves isoladas.
        </p>
      </div>

      <AddGatewayDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddGateway}
        isLoading={isCreating}
      />
    </div>
  );
}
