-- Add multitenancy support (building_id to remaining tables)
-- Migration 0003

-- Add building_id to parcialidades (missing)
ALTER TABLE parcialidades ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to movimientos_fondos (missing)
ALTER TABLE movimientos_fondos ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Create indexes for better performance (IF NOT EXISTS prevents errors)
CREATE INDEX IF NOT EXISTS idx_usuarios_building ON usuarios(building_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_building ON cuotas(building_id);
CREATE INDEX IF NOT EXISTS idx_gastos_building ON gastos(building_id);
CREATE INDEX IF NOT EXISTS idx_fondos_building ON fondos(building_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_building ON anuncios(building_id);
CREATE INDEX IF NOT EXISTS idx_cierres_building ON cierres(building_id);
CREATE INDEX IF NOT EXISTS idx_parcialidades_building ON parcialidades(building_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fondos_building ON movimientos_fondos(building_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_building ON solicitudes(building_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_building ON presupuestos(building_id);
