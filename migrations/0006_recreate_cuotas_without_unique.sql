-- Recrear tabla cuotas sin constraint UNIQUE corrupto
-- Migration 0006
-- Fecha: 2026-01-17

-- Problema: El constraint UNIQUE(mes, anio, departamento) se corrompió
-- causando errores fantasma al intentar insertar cuotas que no existían.

-- Solución: Recrear tabla sin el constraint UNIQUE
-- Los duplicados se previenen a nivel de aplicación con SELECT antes de INSERT

CREATE TABLE cuotas_new (
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
  building_id INTEGER REFERENCES buildings(id),
  fecha_vencimiento DATE,
  monto_mora REAL DEFAULT 0,
  tipo TEXT DEFAULT 'ORDINARIA',
  concepto TEXT,
  monto_extraordinario REAL DEFAULT 0,
  concepto_extraordinario TEXT
);

-- Copiar datos existentes
INSERT INTO cuotas_new SELECT * FROM cuotas;

-- Renombrar tablas
DROP TABLE cuotas;
ALTER TABLE cuotas_new RENAME TO cuotas;

-- Crear índice compuesto para performance
CREATE INDEX IF NOT EXISTS idx_cuotas_periodo ON cuotas(building_id, mes, anio, departamento);
