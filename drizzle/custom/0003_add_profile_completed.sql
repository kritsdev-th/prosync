-- Add profile_completed column to users table
-- Existing users (admin-created) default to true, new registrations will be false
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;

-- Set existing users who have position and agency_id filled as completed
UPDATE users SET profile_completed = true WHERE agency_id IS NOT NULL AND position IS NOT NULL;

-- Super admins are always considered profile completed
UPDATE users SET profile_completed = true WHERE is_super_admin = true;
