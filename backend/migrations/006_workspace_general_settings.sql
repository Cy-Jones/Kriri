-- 006_workspace_general_settings.sql
-- Production workspace general settings extensions

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS first_day_of_week VARCHAR(20) DEFAULT 'monday',
ADD COLUMN IF NOT EXISTS default_task_priority VARCHAR(20) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS default_member_role VARCHAR(50) DEFAULT 'Member',
ADD COLUMN IF NOT EXISTS notify_new_members BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_workspace_activity BOOLEAN DEFAULT true;

