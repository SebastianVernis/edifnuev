-- Crear segundo building para testing de multitenancy
INSERT OR IGNORE INTO buildings (id, name, address, total_units, created_at) 
VALUES (99, 'Building Test 2', 'Test Address 2', 30, datetime('now'));

-- Crear admin para building 99
INSERT OR IGNORE INTO usuarios (id, email, nombre, password, departamento, rol, building_id, created_at)
VALUES (
  'test-admin-99',
  'admin@building99.com',
  'Admin Building 99',
  '$2a$10$lzHWuzsyZFMk.C758nY8Ue.9490GlRIkqXFq3knX91d5YrNJ42KlS',
  'ADMIN',
  'ADMIN',
  99,
  datetime('now')
);

-- Crear fondos para building 13
INSERT OR IGNORE INTO fondos (id, nombre, tipo, saldo_actual, building_id, created_at)
VALUES 
  ('fondo-13-1', 'Fondo Reserva', 'RESERVA', 50000, 13, datetime('now')),
  ('fondo-13-2', 'Fondo Mantenimiento', 'MANTENIMIENTO', 25000, 13, datetime('now'));

-- Crear fondos para building 99
INSERT OR IGNORE INTO fondos (id, nombre, tipo, saldo_actual, building_id, created_at)
VALUES 
  ('fondo-99-1', 'Fondo Reserva', 'RESERVA', 30000, 99, datetime('now')),
  ('fondo-99-2', 'Fondo Mantenimiento', 'MANTENIMIENTO', 15000, 99, datetime('now'));
