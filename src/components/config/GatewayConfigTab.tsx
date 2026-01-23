import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Trash2, 
  Settings, 
  Key, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Copy,
  Shield,
  Loader2,
  CreditCard,
  Building2,
  AlertTriangle,
  Star,
} from "lucide-react";
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
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
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
  const [isEditing, setIsEditing] = useState(false);
  
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
      toast.success("URL do webhook copiada");
    }
  };

  return (
    <Card className={`border-border/50 ${config.is_default ? 'ring-2 ring-primary/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {info.logo ? (
              <img src={info.logo} alt={info.name} className="w-8 h-8 rounded" />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{config.display_name}</CardTitle>
                {config.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Padrão
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">{info.name} • {info.description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={config.environment === "production" 
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-secondary text-secondary-foreground"
              }
            >
              {config.environment === "production" ? "Produção" : "Sandbox"}
            </Badge>
            
            {config.connection_status === "connected" ? (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Wifi className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            ) : config.connection_status === "error" ? (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                Erro
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Não testado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status e Ações Rápidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor={`active-${config.id}`} className="text-sm">Ativo</Label>
              <Switch
                id={`active-${config.id}`}
                checked={config.is_active}
                onCheckedChange={(checked) => onUpdate({ is_active: checked })}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor={`default-${config.id}`} className="text-sm">Padrão</Label>
              <Switch
                id={`default-${config.id}`}
                checked={config.is_default}
                onCheckedChange={(checked) => onUpdate({ is_default: checked })}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onTest}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Testar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              <Key className="w-4 h-4 mr-1" />
              Credenciais
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="flex flex-wrap gap-1">
          {config.allowed_methods.map((method) => (
            <Badge key={method} variant="secondary" className="text-xs">
              {METHOD_LABELS[method]}
            </Badge>
          ))}
        </div>
        
        {/* Seção de Credenciais */}
        {showSecrets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 pt-3 border-t"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Credenciais armazenadas com criptografia AES-256</span>
            </div>
            
            {info.requiredSecrets.map((secretDef) => {
              const existingSecret = config.secrets.find(s => s.key_name === secretDef.key);
              
              return (
                <div key={secretDef.key} className="space-y-2">
                  <Label className="text-sm">{secretDef.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder={existingSecret ? existingSecret.masked_value : secretDef.placeholder}
                      value={secretValues[secretDef.key] || ""}
                      onChange={(e) => setSecretValues(prev => ({ 
                        ...prev, 
                        [secretDef.key]: e.target.value 
                      }))}
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveSecret(secretDef.key)}
                      disabled={!secretValues[secretDef.key]}
                    >
                      Salvar
                    </Button>
                  </div>
                  {existingSecret && (
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {new Date(existingSecret.last_rotated).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              );
            })}
            
            {/* Webhook URL */}
            {config.webhook_token && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm">URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`/functions/v1/gateway-webhook/${config.gateway_type}/${config.webhook_token.substring(0, 8)}...`}
                    className="font-mono text-xs bg-muted"
                  />
                  <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {config.connection_error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              {config.connection_error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Conectar Gateway de Pagamento
          </DialogTitle>
          <DialogDescription>
            Configure um novo gateway para processar cobranças da sua escola
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gateway</Label>
            <Select value={gatewayType} onValueChange={(v) => setGatewayType(v as GatewayType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GATEWAY_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {info.logo && <img src={info.logo} alt="" className="w-4 h-4" />}
                      <span>{info.name}</span>
                      <span className="text-muted-foreground text-xs">- {info.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Nome de Identificação</Label>
            <Input
              placeholder="Ex: Asaas Principal, Mercado Pago Escola"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Sandbox
                    </Badge>
                    <span className="text-muted-foreground text-xs">Para testes</span>
                  </div>
                </SelectItem>
                <SelectItem value="production">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      Produção
                    </Badge>
                    <span className="text-muted-foreground text-xs">Transações reais</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !displayName.trim()}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Adicionar Gateway
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
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar configurações de gateway: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gateways de Pagamento</h3>
          <p className="text-sm text-muted-foreground">
            Configure os bancos e gateways para processar cobranças
          </p>
        </div>
        
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Conectar Banco
        </Button>
      </div>

      {/* Lista de Gateways */}
      {configs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Nenhum gateway configurado</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Conecte um banco ou gateway para começar a processar pagamentos
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Conectar Primeiro Banco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
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

      {/* Info Card */}
      <Card className="bg-muted/20 border-border/50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Segurança das Credenciais</p>
            <p className="text-muted-foreground">
              Todas as chaves de API são criptografadas com AES-256 e armazenadas de forma segura.
              As credenciais nunca são expostas no frontend - apenas máscaras são exibidas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <AddGatewayDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddGateway}
        isLoading={isCreating}
      />
    </motion.div>
  );
}
