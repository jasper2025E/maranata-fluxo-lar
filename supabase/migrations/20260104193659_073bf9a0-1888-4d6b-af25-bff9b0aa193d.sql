-- Trigger to calculate worked hours automatically
CREATE OR REPLACE FUNCTION public.calcular_horas_trabalhadas()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  entrada_min INTEGER;
  saida_min INTEGER;
  almoco_min INTEGER := 0;
  horas_trabalhadas_min INTEGER;
  horas_extras_min INTEGER := 0;
  carga_diaria INTEGER := 480; -- 8 horas em minutos
BEGIN
  -- Only calculate if we have both entrada and saida
  IF NEW.entrada IS NOT NULL AND NEW.saida IS NOT NULL THEN
    -- Convert times to minutes
    entrada_min := EXTRACT(HOUR FROM NEW.entrada)::INTEGER * 60 + EXTRACT(MINUTE FROM NEW.entrada)::INTEGER;
    saida_min := EXTRACT(HOUR FROM NEW.saida)::INTEGER * 60 + EXTRACT(MINUTE FROM NEW.saida)::INTEGER;
    
    -- Calculate lunch break if both are recorded
    IF NEW.saida_almoco IS NOT NULL AND NEW.retorno_almoco IS NOT NULL THEN
      almoco_min := (
        EXTRACT(HOUR FROM NEW.retorno_almoco)::INTEGER * 60 + EXTRACT(MINUTE FROM NEW.retorno_almoco)::INTEGER
      ) - (
        EXTRACT(HOUR FROM NEW.saida_almoco)::INTEGER * 60 + EXTRACT(MINUTE FROM NEW.saida_almoco)::INTEGER
      );
    END IF;
    
    -- Calculate total worked minutes
    horas_trabalhadas_min := saida_min - entrada_min - almoco_min;
    
    -- Calculate overtime
    IF horas_trabalhadas_min > carga_diaria THEN
      horas_extras_min := horas_trabalhadas_min - carga_diaria;
    END IF;
    
    -- Convert back to interval and update
    NEW.horas_trabalhadas := make_interval(mins := horas_trabalhadas_min);
    NEW.horas_extras := make_interval(mins := horas_extras_min);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_calcular_horas ON ponto_registros;

-- Create trigger
CREATE TRIGGER trigger_calcular_horas
BEFORE INSERT OR UPDATE ON ponto_registros
FOR EACH ROW
EXECUTE FUNCTION calcular_horas_trabalhadas();