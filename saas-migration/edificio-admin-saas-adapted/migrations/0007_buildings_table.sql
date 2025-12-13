-- Tabla de edificios/condominios para SAAS multi-tenant
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_units INTEGER NOT NULL,
    building_type TEXT DEFAULT 'edificio' CHECK(building_type IN ('edificio', 'condominio', 'residencial', 'mixto')),
    monthly_fee DECIMAL(10,2) DEFAULT 0,
    extraordinary_fee DECIMAL(10,2) DEFAULT 0,
    cutoff_day INTEGER DEFAULT 1 CHECK(cutoff_day BETWEEN 1 AND 31),
    payment_due_days INTEGER DEFAULT 5,
    late_fee_percent DECIMAL(5,2) DEFAULT 2.0,
    setup_completed BOOLEAN DEFAULT 0,
    setup_completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buildings_setup ON buildings(setup_completed);
CREATE INDEX IF NOT EXISTS idx_buildings_created ON buildings(created_at);
