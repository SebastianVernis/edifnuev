-- ============================================================================
-- MIGRACIÓN: Sistema de Onboarding SAAS
-- Descripción: Tablas para OTP, invitaciones y campos adicionales para onboarding
-- Fecha: 2025-12-13
-- ============================================================================

-- Tabla para códigos OTP (backup de KV storage)
CREATE TABLE IF NOT EXISTS otp_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    INDEX idx_otp_email (email),
    INDEX idx_otp_expires (expires_at)
);

-- Tabla para invitaciones de usuarios
CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'COMITE', 'INQUILINO')),
    building_id INTEGER NOT NULL,
    department TEXT,
    invited_by INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_invitation_token (token),
    INDEX idx_invitation_email (email),
    INDEX idx_invitation_status (status),
    INDEX idx_invitation_expires (expires_at)
);

-- Tabla para registro temporal de usuarios (pre-verificación)
CREATE TABLE IF NOT EXISTS pending_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    building_name TEXT NOT NULL,
    selected_plan TEXT NOT NULL CHECK(selected_plan IN ('basico', 'profesional', 'empresarial', 'personalizado')),
    otp_verified BOOLEAN DEFAULT 0,
    checkout_completed BOOLEAN DEFAULT 0,
    setup_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_at DATETIME,
    completed_at DATETIME,
    INDEX idx_pending_email (email),
    INDEX idx_pending_status (otp_verified, checkout_completed, setup_completed)
);

-- Agregar campos de onboarding a la tabla usuarios (si no existen)
-- Nota: SQLite no soporta ALTER TABLE IF NOT EXISTS, usar con precaución

-- Campo para verificación de email
ALTER TABLE usuarios ADD COLUMN email_verified BOOLEAN DEFAULT 0;

-- Campo para tracking de onboarding completado
ALTER TABLE usuarios ADD COLUMN onboarding_completed BOOLEAN DEFAULT 0;

-- Campo para fecha de verificación de email
ALTER TABLE usuarios ADD COLUMN email_verified_at DATETIME;

-- Campo para fecha de completado de onboarding
ALTER TABLE usuarios ADD COLUMN onboarding_completed_at DATETIME;

-- Agregar campos adicionales a la tabla buildings (si no existen)

-- Tipo de edificio
ALTER TABLE buildings ADD COLUMN building_type TEXT DEFAULT 'edificio' CHECK(building_type IN ('edificio', 'condominio', 'conjunto'));

-- Cuota mensual base
ALTER TABLE buildings ADD COLUMN monthly_fee DECIMAL(10,2) DEFAULT 0;

-- Día de corte para cuotas
ALTER TABLE buildings ADD COLUMN cutoff_day INTEGER DEFAULT 1 CHECK(cutoff_day BETWEEN 1 AND 31);

-- Fondos iniciales
ALTER TABLE buildings ADD COLUMN initial_funds DECIMAL(10,2) DEFAULT 0;

-- Estado de configuración inicial
ALTER TABLE buildings ADD COLUMN setup_completed BOOLEAN DEFAULT 0;

-- Fecha de completado de setup
ALTER TABLE buildings ADD COLUMN setup_completed_at DATETIME;

-- Tabla para tracking de pagos mockup (checkout)
CREATE TABLE IF NOT EXISTS mockup_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pending_user_id INTEGER,
    user_id INTEGER,
    plan TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    card_last_four TEXT NOT NULL,
    card_brand TEXT,
    payment_status TEXT DEFAULT 'completed' CHECK(payment_status IN ('pending', 'completed', 'failed')),
    transaction_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pending_user_id) REFERENCES pending_users(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_payment_transaction (transaction_id),
    INDEX idx_payment_status (payment_status)
);

-- Tabla para logs de envío de emails
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK(email_type IN ('otp', 'invitation', 'welcome', 'notification')),
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_recipient (recipient),
    INDEX idx_email_type (email_type),
    INDEX idx_email_status (status)
);

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verified ON usuarios(email_verified);
CREATE INDEX IF NOT EXISTS idx_usuarios_onboarding ON usuarios(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_buildings_setup ON buildings(setup_completed);

-- ============================================================================
-- DATOS INICIALES / SEEDS
-- ============================================================================

-- Insertar planes de subscripción en tabla de configuración (si existe)
-- Si no existe la tabla, estos datos se manejarán en código

-- ============================================================================
-- COMENTARIOS Y NOTAS
-- ============================================================================

-- OTP_CODES: Backup de KV storage, permite auditoría y recuperación
-- INVITATIONS: Sistema completo de invitaciones con expiración
-- PENDING_USERS: Usuarios en proceso de onboarding, se migran a usuarios al completar
-- EMAIL_LOGS: Auditoría de todos los emails enviados
-- MOCKUP_PAYMENTS: Simulación de pagos para demo, no procesa pagos reales

-- ============================================================================
-- ROLLBACK (si es necesario)
-- ============================================================================

-- DROP TABLE IF EXISTS email_logs;
-- DROP TABLE IF EXISTS mockup_payments;
-- DROP TABLE IF EXISTS invitations;
-- DROP TABLE IF EXISTS otp_codes;
-- DROP TABLE IF EXISTS pending_users;
-- 
-- ALTER TABLE usuarios DROP COLUMN email_verified;
-- ALTER TABLE usuarios DROP COLUMN onboarding_completed;
-- ALTER TABLE usuarios DROP COLUMN email_verified_at;
-- ALTER TABLE usuarios DROP COLUMN onboarding_completed_at;
-- 
-- ALTER TABLE buildings DROP COLUMN building_type;
-- ALTER TABLE buildings DROP COLUMN monthly_fee;
-- ALTER TABLE buildings DROP COLUMN cutoff_day;
-- ALTER TABLE buildings DROP COLUMN initial_funds;
-- ALTER TABLE buildings DROP COLUMN setup_completed;
-- ALTER TABLE buildings DROP COLUMN setup_completed_at;
