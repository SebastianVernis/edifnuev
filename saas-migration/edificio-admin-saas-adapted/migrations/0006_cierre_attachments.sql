-- Migration: Agregar campos para archivos de cierre
-- Fecha: 2025-12-14
-- Descripción: Agrega pdf_url y comprobantes_zip_url a tabla cierres

-- Agregar campos para URLs de archivos
ALTER TABLE cierres ADD COLUMN pdf_url TEXT;
ALTER TABLE cierres ADD COLUMN comprobantes_zip_url TEXT;
ALTER TABLE cierres ADD COLUMN total_comprobantes INTEGER DEFAULT 0;
ALTER TABLE cierres ADD COLUMN enviado_email INTEGER DEFAULT 0;
ALTER TABLE cierres ADD COLUMN fecha_envio TEXT;

-- Índice para búsqueda de cierres generados
CREATE INDEX IF NOT EXISTS idx_cierres_estado ON cierres(estado);
CREATE INDEX IF NOT EXISTS idx_cierres_fecha_envio ON cierres(fecha_envio);
