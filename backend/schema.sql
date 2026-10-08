-- schema.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Member',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    clerk_org_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_summary TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Planning',
    health VARCHAR(50) DEFAULT 'On Track',
    priority VARCHAR(50) DEFAULT 'Medium',
    progress INTEGER DEFAULT 0,
    labels JSONB,
    position INTEGER DEFAULT 0,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Todo',
    priority VARCHAR(50) DEFAULT 'Medium',
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    progress INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Basic Seed Data
INSERT INTO users (clerk_user_id, name, email, role) VALUES
('user_seed_admin', 'Admin User', 'smartjones07@gmail.com', 'Admin'),
('user_seed_alex', 'Alex', 'alex@acme.com', 'Member'),
('user_seed_sarah', 'Sarah', 'sarah@acme.com', 'Member')
ON CONFLICT (email) DO NOTHING;

INSERT INTO workspaces (clerk_org_id, name, slug, owner_id) VALUES
('org_seed_1', 'Acme Corp', 'acme-corp', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
(1, 1, 'Owner'),
(1, 2, 'Member'),
(1, 3, 'Member')
ON CONFLICT (workspace_id, user_id) DO NOTHING;

INSERT INTO projects (workspace_id, name, slug, description, owner_id, status) VALUES
(1, 'Website Redesign', 'PRJ-1', 'Redesign main landing page', 1, 'In Progress'),
(1, 'Mobile App V2', 'PRJ-2', 'Build mobile app version 2', 1, 'Planning')
ON CONFLICT (workspace_id, slug) DO NOTHING;

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'Project Manager'),
(1, 2, 'Member'),
(1, 3, 'Member'),
(2, 1, 'Project Manager'),
(2, 3, 'Member')
ON CONFLICT (project_id, user_id) DO NOTHING;

INSERT INTO tasks (project_id, title, status, priority, assignee_id, position) VALUES
(1, 'Implement JWT authentication', 'In Progress', 'High', 2, 0),
(1, 'Design database schema', 'Done', 'Medium', 3, 1),
(1, 'Set up Vite + Tailwind', 'Done', 'Medium', 2, 2),
(2, 'Build interactive dashboard', 'Todo', 'High', NULL, 0),
(2, 'Create minimal issue list', 'Todo', 'Low', 3, 1);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
