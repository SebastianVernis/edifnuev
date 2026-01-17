-- Agregar columnas a la tabla gastos
-- Migration 0005
-- Fecha: 2026-01-17

-- Agregar columna para relacionar gastos con fondos
ALTER TABLE gastos ADD COLUMN fondo_id INTEGER;

-- Agregar columna de proveedor si no existe
ALTER TABLE gastos ADD COLUMN proveedor TEXT;

-- Nota: La foreign key se manejará a nivel de aplicación
-- fondo_id REFERENCES fondos(id) ON DELETE SET NULL

-- Cuando se crea un gasto con fondo_id:
-- 1. Se descuenta automáticamente del saldo del fondo
-- 2. Se registra un movimiento en movimientos_fondos
-- 3. El patrimonio total se recalcula automáticamente
