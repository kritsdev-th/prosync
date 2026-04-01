-- ══════════════════════════════════════════════
-- Migration: Add new fields to plans table
-- responsible_unit_id, start_date, end_date, duration_text, expected_outputs
-- ══════════════════════════════════════════════

ALTER TABLE plans ADD COLUMN IF NOT EXISTS responsible_unit_id INTEGER REFERENCES org_units(id);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS duration_text VARCHAR(100);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS expected_outputs JSONB;
