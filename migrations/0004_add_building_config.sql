-- Add configuration fields to buildings table
-- Migration 0004

-- Add monthly fee and policies fields
ALTER TABLE buildings ADD COLUMN monthly_fee REAL;
ALTER TABLE buildings ADD COLUMN extraordinary_fee REAL;
ALTER TABLE buildings ADD COLUMN cutoff_day INTEGER;
ALTER TABLE buildings ADD COLUMN payment_due_days INTEGER;
ALTER TABLE buildings ADD COLUMN late_fee_percent REAL;

-- Add policy fields (stored as TEXT for flexible JSON/plain text)
ALTER TABLE buildings ADD COLUMN reglamento TEXT;
ALTER TABLE buildings ADD COLUMN privacy_policy TEXT;
ALTER TABLE buildings ADD COLUMN payment_policies TEXT;

-- Add SMTP configuration (optional, can be NULL)
ALTER TABLE buildings ADD COLUMN smtp_host TEXT;
ALTER TABLE buildings ADD COLUMN smtp_port INTEGER;
ALTER TABLE buildings ADD COLUMN smtp_user TEXT;
ALTER TABLE buildings ADD COLUMN smtp_password TEXT;

-- Add timestamps
ALTER TABLE buildings ADD COLUMN updated_at TEXT;

-- Create table for patrimony/funds per building
CREATE TABLE IF NOT EXISTS patrimonies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount REAL,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patrimonies_building ON patrimonies(building_id);
