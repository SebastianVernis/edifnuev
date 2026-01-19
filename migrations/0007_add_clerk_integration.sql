-- Add Clerk integration to usuarios table
-- Migration 0007

-- Add clerk_user_id column to usuarios table (without UNIQUE constraint)
ALTER TABLE usuarios ADD COLUMN clerk_user_id TEXT;

-- Add column to track if user was created via Clerk
ALTER TABLE usuarios ADD COLUMN created_via_clerk INTEGER DEFAULT 0;

-- Add column to store Clerk metadata (JSON string)
ALTER TABLE usuarios ADD COLUMN clerk_metadata TEXT;

-- Update existing users to mark them as non-Clerk users
UPDATE usuarios SET created_via_clerk = 0 WHERE clerk_user_id IS NULL;

-- Create unique index for clerk_user_id (this enforces uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_clerk_id_unique ON usuarios(clerk_user_id) WHERE clerk_user_id IS NOT NULL;

-- Create regular index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_clerk_id ON usuarios(clerk_user_id);
