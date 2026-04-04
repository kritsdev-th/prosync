-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    document_id INTEGER REFERENCES documents(id),
    step_id INTEGER REFERENCES workflow_steps(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add document_step_assignments table
CREATE TABLE IF NOT EXISTS document_step_assignments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id),
    step_id INTEGER NOT NULL REFERENCES workflow_steps(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    assignment_type VARCHAR(50) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add step_assignees JSONB column to workflow_steps
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS step_assignees JSONB;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_assignments_user_pending ON document_step_assignments(user_id, is_completed) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_assignments_doc_step ON document_step_assignments(document_id, step_id);
