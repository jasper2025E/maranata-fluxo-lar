-- Create table for authorized geolocation points
CREATE TABLE public.pontos_autorizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  raio_metros INTEGER NOT NULL DEFAULT 100,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pontos_autorizados ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can manage
CREATE POLICY "Admin can manage pontos_autorizados" 
ON public.pontos_autorizados 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role));

-- Everyone can view
CREATE POLICY "Public can view pontos_autorizados" 
ON public.pontos_autorizados 
FOR SELECT 
USING (true);

-- Add geolocation columns to ponto_registros if not exist
ALTER TABLE public.ponto_registros 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS localizacao_valida BOOLEAN DEFAULT false;

-- Create function to validate location against authorized points
CREATE OR REPLACE FUNCTION public.validar_localizacao(p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION)
RETURNS TABLE(valido BOOLEAN, ponto_nome TEXT, distancia_metros DOUBLE PRECISION)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ponto RECORD;
  v_distancia DOUBLE PRECISION;
  v_min_distancia DOUBLE PRECISION := 999999;
  v_ponto_mais_proximo TEXT := NULL;
BEGIN
  -- If no authorized points exist, allow any location
  IF NOT EXISTS (SELECT 1 FROM pontos_autorizados WHERE ativo = true) THEN
    RETURN QUERY SELECT true, 'Sem restrição'::TEXT, 0::DOUBLE PRECISION;
    RETURN;
  END IF;

  -- Check each authorized point
  FOR v_ponto IN SELECT * FROM pontos_autorizados WHERE ativo = true LOOP
    -- Calculate distance using Haversine formula (simplified for small distances)
    v_distancia := 6371000 * 2 * ASIN(SQRT(
      POWER(SIN(RADIANS(p_latitude - v_ponto.latitude) / 2), 2) +
      COS(RADIANS(v_ponto.latitude)) * COS(RADIANS(p_latitude)) *
      POWER(SIN(RADIANS(p_longitude - v_ponto.longitude) / 2), 2)
    ));
    
    IF v_distancia < v_min_distancia THEN
      v_min_distancia := v_distancia;
      v_ponto_mais_proximo := v_ponto.nome;
    END IF;
    
    -- If within radius, return valid
    IF v_distancia <= v_ponto.raio_metros THEN
      RETURN QUERY SELECT true, v_ponto.nome, v_distancia;
      RETURN;
    END IF;
  END LOOP;
  
  -- Not within any authorized point
  RETURN QUERY SELECT false, v_ponto_mais_proximo, v_min_distancia;
END;
$$;