-- Migración del esquema core de Edificio Admin
-- Esta migración añade las tablas necesarias para mantener la funcionalidad actual

-- Tabla de usuarios (adaptada del sistema actual)
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    departamento TEXT NOT NULL,
    telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'INQUILINO',
    permisos TEXT DEFAULT '{}',
    legitimidad_entregada INTEGER DEFAULT 0,
    estatus_validacion TEXT DEFAULT 'pendiente',
    esEditor INTEGER DEFAULT 0,
    rol_editor TEXT,
    activo INTEGER DEFAULT 1,
    building_id TEXT,
    fechaCreacion TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL
);

-- Tabla de cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    departamento TEXT NOT NULL,
    monto REAL NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    fecha_vencimiento TEXT,
    fecha_pago TEXT,
    metodo_pago TEXT,
    referencia TEXT,
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    concepto TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    fecha TEXT NOT NULL,
    proveedor TEXT,
    forma_pago TEXT,
    comprobante TEXT,
    notas TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de fondos
CREATE TABLE IF NOT EXISTS fondos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    saldo_actual REAL DEFAULT 0,
    meta REAL,
    descripcion TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Tabla de movimientos de fondos
CREATE TABLE IF NOT EXISTS fondos_movimientos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    fondo_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT,
    fecha TEXT DEFAULT (date('now')),
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (fondo_id) REFERENCES fondos(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    anio INTEGER NOT NULL,
    mes INTEGER,
    categoria TEXT NOT NULL,
    monto_presupuestado REAL NOT NULL,
    monto_ejecutado REAL DEFAULT 0,
    estado TEXT DEFAULT 'activo',
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Tabla de cierres contables
CREATE TABLE IF NOT EXISTS cierres (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    periodo TEXT NOT NULL,
    anio INTEGER NOT NULL,
    mes INTEGER,
    tipo TEXT NOT NULL,
    total_ingresos REAL DEFAULT 0,
    total_egresos REAL DEFAULT 0,
    saldo_final REAL DEFAULT 0,
    estado TEXT DEFAULT 'borrador',
    fecha_cierre TEXT,
    observaciones TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de anuncios
CREATE TABLE IF NOT EXISTS anuncios (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    tipo TEXT DEFAULT 'general',
    prioridad TEXT DEFAULT 'normal',
    activo INTEGER DEFAULT 1,
    fecha_publicacion TEXT DEFAULT (datetime('now')),
    fecha_expiracion TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    asunto TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    prioridad TEXT DEFAULT 'normal',
    respuesta TEXT,
    fecha_respuesta TEXT,
    respondido_por TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (respondido_por) REFERENCES usuarios(id)
);

-- Tabla de parcialidades (pagos parciales)
CREATE TABLE IF NOT EXISTS parcialidades (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cuota_id TEXT NOT NULL,
    monto REAL NOT NULL,
    fecha_pago TEXT NOT NULL,
    metodo_pago TEXT,
    referencia TEXT,
    notas TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cuota_id) REFERENCES cuotas(id) ON DELETE CASCADE
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permisos (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    usuario_id TEXT NOT NULL,
    building_id TEXT,
    modulo TEXT NOT NULL,
    puede_ver INTEGER DEFAULT 0,
    puede_crear INTEGER DEFAULT 0,
    puede_editar INTEGER DEFAULT 0,
    puede_eliminar INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, building_id, modulo)
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    building_id TEXT,
    usuario_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    entidad_tipo TEXT,
    entidad_id TEXT,
    detalles TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cuotas_departamento ON cuotas(departamento);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_building ON cuotas(building_id);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_building ON gastos(building_id);
CREATE INDEX IF NOT EXISTS idx_fondos_building ON fondos(building_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_building ON presupuestos(building_id);
CREATE INDEX IF NOT EXISTS idx_cierres_building ON cierres(building_id);
CREATE INDEX IF NOT EXISTS idx_anuncios_building ON anuncios(building_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_building ON solicitudes(building_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_building ON audit_logs(building_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_logs(usuario_id);
