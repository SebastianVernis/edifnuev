-- Edificio Admin - Initial Database Schema for Cloudflare D1

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('ADMIN', 'COMITE', 'INQUILINO')),
    departamento TEXT,
    telefono TEXT,
    activo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mes TEXT NOT NULL,
    anio INTEGER NOT NULL,
    departamento TEXT NOT NULL,
    monto REAL NOT NULL,
    pagado INTEGER DEFAULT 0,
    fecha_pago DATETIME,
    metodo_pago TEXT,
    referencia TEXT,
    vencida INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mes, anio, departamento)
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    concepto TEXT NOT NULL,
    monto REAL NOT NULL,
    categoria TEXT NOT NULL,
    fecha DATE NOT NULL,
    comprobante TEXT,
    descripcion TEXT,
    aprobado INTEGER DEFAULT 0,
    presupuesto_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio INTEGER NOT NULL UNIQUE,
    categorias TEXT NOT NULL, -- JSON string
    total REAL NOT NULL,
    aprobado INTEGER DEFAULT 0,
    fecha_aprobacion DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de fondos
CREATE TABLE IF NOT EXISTS fondos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('RESERVA', 'EXTRAORDINARIO', 'MANTENIMIENTO')),
    saldo REAL DEFAULT 0,
    descripcion TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de movimientos de fondos
CREATE TABLE IF NOT EXISTS movimientos_fondos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fondo_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('INGRESO', 'EGRESO')),
    monto REAL NOT NULL,
    concepto TEXT NOT NULL,
    fecha DATE NOT NULL,
    referencia TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fondo_id) REFERENCES fondos(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de cierres anuales
CREATE TABLE IF NOT EXISTS cierres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anio INTEGER NOT NULL UNIQUE,
    total_ingresos REAL NOT NULL,
    total_egresos REAL NOT NULL,
    saldo_final REAL NOT NULL,
    detalles TEXT, -- JSON string
    cerrado INTEGER DEFAULT 1,
    fecha_cierre DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de anuncios
CREATE TABLE IF NOT EXISTS anuncios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    prioridad TEXT DEFAULT 'NORMAL' CHECK(prioridad IN ('ALTA', 'NORMAL', 'BAJA')),
    archivo TEXT,
    activo INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA')),
    respuesta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de parcialidades
CREATE TABLE IF NOT EXISTS parcialidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuota_id INTEGER NOT NULL,
    monto REAL NOT NULL,
    fecha_pago DATE NOT NULL,
    metodo_pago TEXT,
    referencia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuota_id) REFERENCES cuotas(id)
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permisos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    recurso TEXT NOT NULL,
    puede_leer INTEGER DEFAULT 1,
    puede_crear INTEGER DEFAULT 0,
    puede_editar INTEGER DEFAULT 0,
    puede_eliminar INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, recurso),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion TEXT NOT NULL,
    recurso TEXT NOT NULL,
    detalles TEXT, -- JSON string
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de temas (theme configs)
CREATE TABLE IF NOT EXISTS theme_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL UNIQUE,
    config TEXT NOT NULL, -- JSON string con colores, fuentes, etc
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices para mejor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_cuotas_departamento ON cuotas(departamento);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha ON cuotas(mes, anio);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_presupuesto ON gastos(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fondo ON movimientos_fondos(fondo_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_log(created_at);

-- Insertar usuario admin por defecto
INSERT OR IGNORE INTO usuarios (id, nombre, email, password, rol, departamento, activo)
VALUES (1, 'Administrador', 'admin@edificio.com', 'admin123', 'ADMIN', 'Admin', 1);

-- Insertar usuario propietario de prueba
INSERT OR IGNORE INTO usuarios (id, nombre, email, password, rol, departamento, activo)
VALUES (2, 'Propietario 1', 'prop1@edificio.com', 'prop123', 'INQUILINO', '101', 1);

-- Crear fondo de reserva por defecto
INSERT OR IGNORE INTO fondos (id, nombre, tipo, saldo, descripcion)
VALUES (1, 'Fondo de Reserva', 'RESERVA', 0, 'Fondo de reserva para emergencias');
