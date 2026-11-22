-- 008_performance_indexes.sql
-- High-Performance Composite and Foreign Key Indexes for KRIRI

BEGIN;

-- 1. Index foreign key lead_id on projects (powers lead joins and updates)
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);

-- 2. Composite index for workspace project list ordering
CREATE INDEX IF NOT EXISTS idx_projects_ws_created_desc ON projects(workspace_id, created_at DESC);

-- 3. Composite index for project-scoped and workspace task ordering
CREATE INDEX IF NOT EXISTS idx_tasks_project_created_desc ON tasks(project_id, created_at DESC);

-- 4. Composite index for dashboard My Issues lookup
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status_due ON tasks(assignee_id, status, due_date ASC NULLS LAST);

-- 5. Due date index for overdue and upcoming task filters
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 6. Priority and status index for active issue priority breakdowns
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status ON tasks(priority, status);

-- 7. Composite index for milestone project ordering
CREATE INDEX IF NOT EXISTS idx_milestones_proj_status_due ON milestones(project_id, status, due_date ASC NULLS LAST);

COMMIT;
