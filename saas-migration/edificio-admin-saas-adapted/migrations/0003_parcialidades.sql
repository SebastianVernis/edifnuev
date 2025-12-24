-- Parcialidades (installment payments) system

CREATE TABLE IF NOT EXISTS parcialidades_2026 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    objetivo REAL NOT NULL,
    pagos TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parcialidad_pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcialidad_id INTEGER NOT NULL,
    building_id INTEGER NOT NULL,
    user_id INTEGER,
    departamento TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha_pago TEXT NOT NULL,
    metodo_pago TEXT,
    referencia TEXT,
    notas TEXT,
    validado INTEGER DEFAULT 0,
    validado_por INTEGER,
    validado_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parcialidad_id) REFERENCES parcialidades_2026(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (validado_por) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcialidades_building ON parcialidades_2026(building_id);
CREATE INDEX IF NOT EXISTS idx_parcialidad_pagos_parcialidad ON parcialidad_pagos(parcialidad_id);
CREATE INDEX IF NOT EXISTS idx_parcialidad_pagos_building ON parcialidad_pagos(building_id);
