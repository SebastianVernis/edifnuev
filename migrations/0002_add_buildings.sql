-- Add buildings table for multi-tenancy

CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    units_count INTEGER,
    plan TEXT NOT NULL CHECK(plan IN ('basico', 'profesional', 'empresarial')),
    admin_user_id INTEGER,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES usuarios(id)
);

-- Add building_id to usuarios table
ALTER TABLE usuarios ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to cuotas table
ALTER TABLE cuotas ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to gastos table
ALTER TABLE gastos ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to presupuestos table
ALTER TABLE presupuestos ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to fondos table
ALTER TABLE fondos ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to anuncios table
ALTER TABLE anuncios ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to solicitudes table
ALTER TABLE solicitudes ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Add building_id to cierres table
ALTER TABLE cierres ADD COLUMN building_id INTEGER REFERENCES buildings(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_buildings_admin ON buildings(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_building ON usuarios(building_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_building ON cuotas(building_id);
CREATE INDEX IF NOT EXISTS idx_gastos_building ON gastos(building_id);

-- Create default building for existing users
INSERT INTO buildings (id, name, plan, admin_user_id, units_count)
VALUES (1, 'Edificio Demo', 'profesional', 1, 20);

-- Update existing users to belong to building 1
UPDATE usuarios SET building_id = 1 WHERE building_id IS NULL;
