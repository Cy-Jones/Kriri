-- 006_workspace_general_settings.sql
-- Production workspace general settings extensions

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS default_language VARCHAR(20) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS default_timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
ADD COLUMN IF NOT EXISTS time_format VARCHAR(10) DEFAULT '24h',
ADD COLUMN IF NOT EXISTS first_day_of_week VARCHAR(20) DEFAULT 'monday',
ADD COLUMN IF NOT EXISTS default_project_view VARCHAR(50) DEFAULT 'list',
ADD COLUMN IF NOT EXISTS default_task_view VARCHAR(50) DEFAULT 'board',
ADD COLUMN IF NOT EXISTS default_task_priority VARCHAR(20) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS default_project_visibility VARCHAR(50) DEFAULT 'workspace',
ADD COLUMN IF NOT EXISTS default_member_role VARCHAR(50) DEFAULT 'Member',
ADD COLUMN IF NOT EXISTS notify_new_members BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_workspace_activity BOOLEAN DEFAULT true;

