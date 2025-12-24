-- Migration: Sistema de Leads y Trial de 24 horas
-- Fecha: 2025-12-15
-- Descripción: Elimina checkout, agrega sistema de leads con trial

-- Agregar campos para facturación y leads
ALTER TABLE pending_users ADD COLUMN requiere_factura INTEGER DEFAULT 0;
ALTER TABLE pending_users ADD COLUMN rfc TEXT;
ALTER TABLE pending_users ADD COLUMN razon_social TEXT;
ALTER TABLE pending_users ADD COLUMN direccion_fiscal TEXT;
ALTER TABLE pending_users ADD COLUMN codigo_postal_fiscal TEXT;
ALTER TABLE pending_users ADD COLUMN solucion_personalizada TEXT;

-- Trial de 24 horas
ALTER TABLE pending_users ADD COLUMN trial_start TEXT;
ALTER TABLE pending_users ADD COLUMN trial_expires TEXT;
ALTER TABLE pending_users ADD COLUMN trial_active INTEGER DEFAULT 0;

-- Pago y suscripción
ALTER TABLE pending_users ADD COLUMN pago_confirmado INTEGER DEFAULT 0;
ALTER TABLE pending_users ADD COLUMN fecha_pago TEXT;
ALTER TABLE pending_users ADD COLUMN metodo_pago TEXT;
ALTER TABLE pending_users ADD COLUMN factura_generada INTEGER DEFAULT 0;
ALTER TABLE pending_users ADD COLUMN factura_url TEXT;

-- Lead info
ALTER TABLE pending_users ADD COLUMN lead_status TEXT DEFAULT 'nuevo';
ALTER TABLE pending_users ADD COLUMN contactado_ventas INTEGER DEFAULT 0;
ALTER TABLE pending_users ADD COLUMN fecha_contacto TEXT;
ALTER TABLE pending_users ADD COLUMN notas_ventas TEXT;

-- Índices
CREATE INDEX IF NOT EXISTS idx_pending_trial_active ON pending_users(trial_active);
CREATE INDEX IF NOT EXISTS idx_pending_trial_expires ON pending_users(trial_expires);
CREATE INDEX IF NOT EXISTS idx_pending_lead_status ON pending_users(lead_status);
CREATE INDEX IF NOT EXISTS idx_pending_pago_confirmado ON pending_users(pago_confirmado);
