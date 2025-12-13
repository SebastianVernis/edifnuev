-- Migración simplificada solo para tablas de onboarding
-- Sin referencias a tables existentes

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
    completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_pending_email ON pending_users(email);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_users(otp_verified, checkout_completed, setup_completed);

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
    verified_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transaction ON mockup_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON mockup_payments(payment_status);

-- Tabla para logs de envío de emails
CREATE TABLE IF NOT EXISTS email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient TEXT NOT NULL,
    email_type TEXT NOT NULL CHECK(email_type IN ('otp', 'invitation', 'welcome', 'notification')),
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_status ON email_logs(status);
