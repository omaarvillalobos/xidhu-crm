-- Migración: agregar desglose financiero + costo a cotizaciones
-- Fecha: 2026-05-18
-- Impacto: agrega 4 columnas NULLABLE. NO modifica ni elimina datos existentes.
-- Las cotizaciones que ya existen quedarán con NULL en estos campos y seguirán funcionando igual.
--
-- Cómo ejecutar:
-- 1. Abre Supabase → Project → SQL Editor
-- 2. Pega este archivo completo
-- 3. Click "Run"

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS cost         DECIMAL(12,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS subtotal     DECIMAL(12,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS discount_pct DECIMAL(5,2);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_pct      DECIMAL(5,2);

-- Verificación (opcional): correr esta query después para confirmar
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'quotes' AND column_name IN ('cost','subtotal','discount_pct','tax_pct');
