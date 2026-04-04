-- Add agency_id to workflows for per-agency workflow management
-- NULL agency_id = central/default workflows (super admin only)
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS agency_id INTEGER REFERENCES agencies(id);

-- Mark existing 4 workflows as central (agency_id = NULL) — they remain super admin managed
-- No UPDATE needed since NULL is the default
