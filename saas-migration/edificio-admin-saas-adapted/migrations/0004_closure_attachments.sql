-- Closure attachments for supporting documents

CREATE TABLE IF NOT EXISTS closure_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    closure_id INTEGER NOT NULL,
    building_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (closure_id) REFERENCES closures(id) ON DELETE CASCADE,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_closure_attachments_closure ON closure_attachments(closure_id);
CREATE INDEX IF NOT EXISTS idx_closure_attachments_building ON closure_attachments(building_id);
