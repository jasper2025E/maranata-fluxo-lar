import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LogIn, 
  Coffee, 
  Play, 
  LogOut, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Smartphone,
  MapPin,
  MapPinOff,
  Navigation,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FuncionarioInfo {
  funcionario_id: string;
  nome_completo: string;
  foto_url: string | null;
  cargo_nome: string | null;
  ultimo_registro: {
    tipo: string | null;
    hora: string | null;
    entrada: string | null;
    saida_almoco: string | null;
    retorno_almoco: string | null;
    saida: string | null;
  } | null;
}

interface PontoState {
  entrada: string | null;
  saida_almoco: string | null;
  retorno_almoco: string | null;
  saida: string | null;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  status: 'idle' | 'loading' | 'success' | 'error' | 'denied';
  error: string | null;
  isWithinArea: boolean | null;
  localName: string | null;
}

export default function PontoEletronico() {
  const { token } = useParams<{ token: string }>();
  const [funcionario, setFuncionario] = useState<FuncionarioInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const [pontoState, setPontoState] = useState<PontoState>({
    entrada: null,
    saida_almoco: null,
    retorno_almoco: null,
    saida: null,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [geo, setGeo] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    status: 'idle',
    error: null,
    isWithinArea: null,
    localName: null,
  });

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request geolocation
  const requestGeolocation = useCallback(async () => {
    setGeo(prev => ({ ...prev, status: 'loading', error: null }));

    if (!navigator.geolocation) {
      setGeo(prev => ({
        ...prev,
        status: 'error',
        error: 'Seu navegador não suporta geolocalização'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Validate location against authorized points
        try {
          const { data, error } = await supabase.rpc('validar_localizacao' as any, {
            p_latitude: latitude,
            p_longitude: longitude
          });

          if (error) throw error;

          const result = (data as any)?.[0];
          
          setGeo({
            latitude,
            longitude,
            accuracy,
            status: 'success',
            error: null,
            isWithinArea: result?.valido ?? true,
            localName: result?.ponto_nome ?? null,
          });
        } catch (err) {
          console.error('Error validating location:', err);
          setGeo({
            latitude,
            longitude,
            accuracy,
            status: 'success',
            error: null,
            isWithinArea: true, // Allow if validation fails
            localName: null,
          });
        }
      },
      (error) => {
        let errorMessage = 'Erro ao obter localização';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Permissão de localização negada. Ative o GPS e permita o acesso.';
          setGeo(prev => ({ ...prev, status: 'denied', error: errorMessage }));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Localização indisponível. Verifique se o GPS está ativo.';
          setGeo(prev => ({ ...prev, status: 'error', error: errorMessage }));
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Tempo esgotado. Tente novamente.';
          setGeo(prev => ({ ...prev, status: 'error', error: errorMessage }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Always get fresh location
      }
    );
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  // Validate token and load funcionario info
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Token não fornecido");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('validate_ponto_token', {
          p_token: token
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          setError("Link inválido ou expirado. Contate o RH.");
          setIsLoading(false);
          return;
        }

        const info = data[0] as FuncionarioInfo;
        setFuncionario(info);

        // Set current ponto state from ultimo_registro
        if (info.ultimo_registro) {
          setPontoState({
            entrada: info.ultimo_registro.entrada,
            saida_almoco: info.ultimo_registro.saida_almoco,
            retorno_almoco: info.ultimo_registro.retorno_almoco,
            saida: info.ultimo_registro.saida,
          });
        }
      } catch (err) {
        console.error("Error validating token:", err);
        setError("Erro ao validar link. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const registrarPonto = async (tipo: string) => {
    if (!token) return;

    // Check geolocation first
    if (geo.status !== 'success' || geo.latitude === null || geo.longitude === null) {
      toast.error("Aguarde a localização ser obtida ou ative o GPS");
      return;
    }

    if (geo.isWithinArea === false) {
      toast.error("Você está fora da área autorizada para registro de ponto");
      return;
    }

    setIsRegistering(tipo);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.rpc('registrar_ponto_externo', {
        p_token: token,
        p_tipo: tipo,
        p_ip: null,
        p_user_agent: navigator.userAgent,
        p_latitude: geo.latitude,
        p_longitude: geo.longitude,
        p_accuracy: geo.accuracy
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; hora?: string; message?: string; local?: string };

      if (!result.success) {
        toast.error(result.error || "Erro ao registrar ponto");
        return;
      }

      // Update local state
      setPontoState(prev => ({
        ...prev,
        [tipo]: result.hora
      }));

      setSuccessMessage(getSuccessMessage(tipo, result.local));
      toast.success("Ponto registrado com sucesso!");
    } catch (err) {
      console.error("Error registering ponto:", err);
      toast.error("Erro ao registrar ponto. Tente novamente.");
    } finally {
      setIsRegistering(null);
    }
  };

  const getSuccessMessage = (tipo: string, local?: string) => {
    const localMsg = local ? ` em ${local}` : '';
    switch (tipo) {
      case 'entrada': return `Entrada registrada${localMsg}! Bom trabalho! 💪`;
      case 'saida_almoco': return `Bom intervalo${localMsg}! 🍽️`;
      case 'retorno_almoco': return `Bem-vindo de volta${localMsg}! 👋`;
      case 'saida': return `Até amanhã${localMsg}! Bom descanso! 🌙`;
      default: return 'Registrado!';
    }
  };

  const getNextAction = (): string | null => {
    if (!pontoState.entrada) return 'entrada';
    if (!pontoState.saida_almoco) return 'saida_almoco';
    if (!pontoState.retorno_almoco) return 'retorno_almoco';
    if (!pontoState.saida) return 'saida';
    return null;
  };

  const nextAction = getNextAction();
  const canRegister = geo.status === 'success' && geo.isWithinArea !== false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="w-full max-w-md text-center shadow-xl">
            <CardContent className="pt-8 pb-8">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-bold text-destructive mb-2">Link Inválido</h1>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm py-4 px-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary">Ponto Eletrônico</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {format(currentTime, "HH:mm:ss")}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col">
        <div className="max-w-md mx-auto w-full space-y-4">
          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-primary/20">
                  <AvatarImage src={funcionario?.foto_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-lg font-bold text-foreground mb-1">
                  {funcionario?.nome_completo}
                </h1>
                {funcionario?.cargo_nome && (
                  <Badge variant="secondary" className="mb-3">
                    {funcionario.cargo_nome}
                  </Badge>
                )}
                <div className="text-3xl font-bold text-primary mb-1">
                  {format(currentTime, "HH:mm")}
                </div>
                <p className="text-muted-foreground text-sm">
                  {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Geolocation Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className={cn(
              "shadow-lg border-0 backdrop-blur",
              geo.status === 'success' && geo.isWithinArea ? "bg-emerald-50/90" : 
              geo.status === 'success' && !geo.isWithinArea ? "bg-red-50/90" :
              geo.status === 'denied' ? "bg-red-50/90" :
              geo.status === 'loading' ? "bg-blue-50/90" :
              "bg-orange-50/90"
            )}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {geo.status === 'loading' && (
                      <>
                        <div className="p-2 rounded-full bg-blue-100">
                          <Navigation className="h-5 w-5 text-blue-500 animate-pulse" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-700">Obtendo localização...</p>
                          <p className="text-xs text-blue-600">Aguarde</p>
                        </div>
                      </>
                    )}
                    {geo.status === 'success' && geo.isWithinArea && (
                      <>
                        <div className="p-2 rounded-full bg-emerald-100">
                          <MapPin className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-700">Localização válida</p>
                          <p className="text-xs text-emerald-600">
                            {geo.localName || 'Área autorizada'} 
                            {geo.accuracy && ` • Precisão: ${Math.round(geo.accuracy)}m`}
                          </p>
                        </div>
                      </>
                    )}
                    {geo.status === 'success' && geo.isWithinArea === false && (
                      <>
                        <div className="p-2 rounded-full bg-red-100">
                          <MapPinOff className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-red-700">Fora da área autorizada</p>
                          <p className="text-xs text-red-600">Aproxime-se do local de trabalho</p>
                        </div>
                      </>
                    )}
                    {(geo.status === 'error' || geo.status === 'denied') && (
                      <>
                        <div className="p-2 rounded-full bg-red-100">
                          <MapPinOff className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-red-700">
                            {geo.status === 'denied' ? 'GPS não permitido' : 'Erro de localização'}
                          </p>
                          <p className="text-xs text-red-600">{geo.error}</p>
                        </div>
                      </>
                    )}
                  </div>
                  {(geo.status === 'error' || geo.status === 'denied' || (geo.status === 'success' && !geo.isWithinArea)) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestGeolocation}
                      className="shrink-0"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="bg-emerald-50 border-emerald-200">
                  <CardContent className="py-4 text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-emerald-700 font-medium">{successMessage}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ponto Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Registro de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <StatusItem 
                    label="Entrada" 
                    time={pontoState.entrada} 
                    icon={LogIn}
                    color="emerald"
                  />
                  <StatusItem 
                    label="Intervalo" 
                    time={pontoState.saida_almoco} 
                    icon={Coffee}
                    color="amber"
                  />
                  <StatusItem 
                    label="Retorno" 
                    time={pontoState.retorno_almoco} 
                    icon={Play}
                    color="blue"
                  />
                  <StatusItem 
                    label="Saída" 
                    time={pontoState.saida} 
                    icon={LogOut}
                    color="purple"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {nextAction ? (
              <>
                <ActionButton
                  tipo="entrada"
                  label="Registrar Entrada"
                  icon={LogIn}
                  color="emerald"
                  disabled={pontoState.entrada !== null || !canRegister}
                  isLoading={isRegistering === 'entrada'}
                  isNext={nextAction === 'entrada'}
                  onClick={() => registrarPonto('entrada')}
                />
                <ActionButton
                  tipo="saida_almoco"
                  label="Saída para Intervalo"
                  icon={Coffee}
                  color="amber"
                  disabled={!pontoState.entrada || pontoState.saida_almoco !== null || !canRegister}
                  isLoading={isRegistering === 'saida_almoco'}
                  isNext={nextAction === 'saida_almoco'}
                  onClick={() => registrarPonto('saida_almoco')}
                />
                <ActionButton
                  tipo="retorno_almoco"
                  label="Retorno do Intervalo"
                  icon={Play}
                  color="blue"
                  disabled={!pontoState.saida_almoco || pontoState.retorno_almoco !== null || !canRegister}
                  isLoading={isRegistering === 'retorno_almoco'}
                  isNext={nextAction === 'retorno_almoco'}
                  onClick={() => registrarPonto('retorno_almoco')}
                />
                <ActionButton
                  tipo="saida"
                  label="Registrar Saída"
                  icon={LogOut}
                  color="purple"
                  disabled={!pontoState.entrada || pontoState.saida !== null || !canRegister}
                  isLoading={isRegistering === 'saida'}
                  isNext={nextAction === 'saida'}
                  onClick={() => registrarPonto('saida')}
                />
              </>
            ) : (
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-emerald-700 mb-1">
                    Jornada Completa!
                  </h3>
                  <p className="text-emerald-600 text-sm">
                    Todos os registros do dia foram feitos.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm py-3 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Ponto Eletrônico • {format(new Date(), "yyyy")}
        </p>
      </footer>
    </div>
  );
}

// Status Item Component
function StatusItem({ 
  label, 
  time, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  time: string | null; 
  icon: React.ElementType;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={cn(
      "rounded-xl p-3 text-center transition-all",
      time ? colorClasses[color] : "bg-gray-100 text-gray-400"
    )}>
      <Icon className="h-5 w-5 mx-auto mb-1" />
      <p className="text-xs font-medium mb-0.5">{label}</p>
      <p className="text-sm font-bold">
        {time ? time.slice(0, 5) : "--:--"}
      </p>
    </div>
  );
}

// Action Button Component
function ActionButton({
  tipo,
  label,
  icon: Icon,
  color,
  disabled,
  isLoading,
  isNext,
  onClick,
}: {
  tipo: string;
  label: string;
  icon: React.ElementType;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
  disabled: boolean;
  isLoading: boolean;
  isNext: boolean;
  onClick: () => void;
}) {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
    amber: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  };

  if (disabled && !isLoading && !isNext) {
    return null;
  }

  return (
    <motion.div
      initial={isNext ? { scale: 1 } : { scale: 0.95, opacity: 0.7 }}
      animate={isNext ? { scale: 1 } : { scale: 0.95, opacity: 0.7 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "w-full h-16 text-lg font-semibold rounded-2xl shadow-lg",
          "bg-gradient-to-r text-white",
          "transition-all duration-200",
          isNext && !disabled && colorClasses[color],
          (disabled || !isNext) && "bg-gray-300 hover:bg-gray-300"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin mr-3" />
        ) : (
          <Icon className="h-6 w-6 mr-3" />
        )}
        {label}
      </Button>
    </motion.div>
  );
}
