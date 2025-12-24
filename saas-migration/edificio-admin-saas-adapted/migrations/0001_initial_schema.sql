-- Schema inicial consolidado para Edificio Admin SAAS
-- Usa nomenclatura en inglés desde el inicio

-- Buildings (multi-tenant)
CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    units INTEGER DEFAULT 20,
    type TEXT DEFAULT 'edificio',
    owner_id INTEGER,
    plan TEXT DEFAULT 'basico',
    subscription_status TEXT DEFAULT 'active',
    subscription_id TEXT,
    settings TEXT,
    custom_domain TEXT,
    logo_url TEXT,
    monthly_fee REAL DEFAULT 0,
    cutoff_day INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    unit TEXT,
    phone TEXT,
    active INTEGER DEFAULT 1,
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TEXT,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Building Users relationship (multi-tenant)
CREATE TABLE IF NOT EXISTS building_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(building_id, user_id)
);

-- Fees (Cuotas)
CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    user_id INTEGER,
    unit TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    payment_date TEXT,
    payment_method TEXT,
    payment_reference TEXT,
    late_fee REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Expenses (Gastos)
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    concept TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    provider TEXT,
    receipt_url TEXT,
    approved_by INTEGER,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Funds (Fondos)
CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    goal REAL,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Fund Movements (Movimientos de fondos)
CREATE TABLE IF NOT EXISTS fund_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    from_fund TEXT,
    to_fund TEXT,
    amount REAL NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Announcements (Anuncios)
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    type TEXT NOT NULL,
    published_by INTEGER,
    file_url TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (published_by) REFERENCES users(id)
);

-- Requests (Solicitudes)
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    response TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Closures (Cierres)
CREATE TABLE IF NOT EXISTS closures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    period TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER,
    status TEXT DEFAULT 'draft',
    total_income REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    balance REAL DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    approved_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    approved_at TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    building_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TEXT,
    current_period_end TEXT,
    cancel_at_period_end INTEGER DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    price_id TEXT,
    custom_features TEXT,
    payment_method TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    building_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT,
    payment_date TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Theme configurations
CREATE TABLE IF NOT EXISTS theme_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL UNIQUE,
    config TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_building_users_building ON building_users(building_id);
CREATE INDEX IF NOT EXISTS idx_building_users_user ON building_users(user_id);
CREATE INDEX IF NOT EXISTS idx_fees_building ON fees(building_id);
CREATE INDEX IF NOT EXISTS idx_fees_date ON fees(year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_building ON expenses(building_id);
CREATE INDEX IF NOT EXISTS idx_funds_building ON funds(building_id);
CREATE INDEX IF NOT EXISTS idx_fund_movements_building ON fund_movements(building_id);
CREATE INDEX IF NOT EXISTS idx_announcements_building ON announcements(building_id);
CREATE INDEX IF NOT EXISTS idx_requests_building ON requests(building_id);
CREATE INDEX IF NOT EXISTS idx_closures_building ON closures(building_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_building ON subscriptions(building_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_theme_configs_building ON theme_configs(building_id);
CREATE INDEX IF NOT EXISTS idx_audit_building ON audit_log(building_id);
