-- Adicionar "Parcial" como status válido para faturas
ALTER TABLE public.faturas DROP CONSTRAINT faturas_status_check;

ALTER TABLE public.faturas ADD CONSTRAINT faturas_status_check 
CHECK (status = ANY (ARRAY['Aberta'::text, 'Paga'::text, 'Vencida'::text, 'Cancelada'::text, 'Parcial'::text]));