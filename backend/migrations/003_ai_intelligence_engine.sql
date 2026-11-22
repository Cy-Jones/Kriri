-- 003_ai_intelligence_engine.sql
-- Migration: AI Intelligence Engine Subsystem Tables
-- Supports multi-tenant workspace isolation, conversation history, audit logging, RAG chunks, insights, and usage accounting.

-- 1. AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_ws ON ai_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_proj ON ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_updated ON ai_conversations(updated_at DESC);

-- 2. AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system', 'tool'
    content TEXT NOT NULL,
    model_id VARCHAR(255),
    token_usage JSONB DEFAULT '{}'::jsonb, -- { prompt_tokens: X, completion_tokens: Y, total_tokens: Z }
    tool_calls JSONB,                      -- Proposed or executed tool calls
    tool_call_id VARCHAR(255),             -- Response ID matching tool call
    metadata JSONB DEFAULT '{}'::jsonb,    -- Citations, confidence, grounding sources
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_msg_created ON ai_messages(created_at ASC);

-- 3. AI Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    model_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL, -- 'assistant', 'task_generator', 'health_score', 'rag_query', 'report'
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10, 6) DEFAULT 0.000000, -- Free tier: 0.00
    latency_ms INTEGER DEFAULT 0,
    request_status VARCHAR(50) DEFAULT 'success', -- 'success', 'rate_limited', 'failed', 'fallback'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_ws ON ai_usage_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_logs(feature);

-- 4. AI Documents (Indexed Knowledge Base)
CREATE TABLE IF NOT EXISTS ai_documents (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'failed'
    error_message TEXT,
    raw_content TEXT,
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_docs_ws ON ai_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_docs_proj ON ai_documents(project_id);

-- 5. AI Knowledge Chunks (RAG Storage)
CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES ai_documents(id) ON DELETE CASCADE,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL DEFAULT 'document', -- 'document', 'task', 'project', 'milestone'
    source_id VARCHAR(255),
    chunk_index INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    embedding JSONB, -- Stored as float array JSONB for portable, resilient similarity
    token_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_chunks_doc ON ai_knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_ws ON ai_knowledge_chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_chunks_proj ON ai_knowledge_chunks(project_id);

-- 6. AI Insights (Project Health & Risk Scoring)
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
    health_status VARCHAR(50) NOT NULL, -- 'On Track', 'At Risk', 'Off Track'
    risk_level VARCHAR(50) NOT NULL,    -- 'Low', 'Medium', 'High', 'Critical'
    metrics_breakdown JSONB NOT NULL,   -- Deterministic components: velocity, overdue_ratio, blocked_ratio, etc.
    summary TEXT NOT NULL,              -- Executive AI explanation
    risk_factors JSONB DEFAULT '[]'::jsonb, -- Array of identified risks
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_proj ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(generated_at DESC);

-- 7. AI Recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    insight_id INTEGER REFERENCES ai_insights(id) ON DELETE CASCADE,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    suggested_action VARCHAR(100), -- 'reassign_task', 'adjust_deadline', 'break_down_task', 'add_milestone'
    action_payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'executed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_rec_proj ON ai_recommendations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_status ON ai_recommendations(status);

-- 8. AI Action Logs (Audit Trail for Tool Calling)
CREATE TABLE IF NOT EXISTS ai_action_logs (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL,
    tool_name VARCHAR(100) NOT NULL,
    tool_args JSONB NOT NULL,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approval_status VARCHAR(50) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
    execution_status VARCHAR(50) DEFAULT 'success',  -- 'success', 'failed', 'blocked'
    result_summary TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_action_ws ON ai_action_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_user ON ai_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_conv ON ai_action_logs(conversation_id);

-- 9. AI Model Configurations
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    default_model VARCHAR(255) DEFAULT 'google/gemma-4-26b-a4b-it:free',
    agent_model VARCHAR(255) DEFAULT 'xingchen-agi/xing4.0-29b-a4b:free',
    task_model VARCHAR(255) DEFAULT 'recursive/flint-v1.0:free',
    rag_model VARCHAR(255) DEFAULT 'nvidia/nemotron-3.5-super-vl:free',
    daily_token_budget INTEGER DEFAULT 250000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AI Feedback (User Ratings on Responses)
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES ai_messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating = 1 OR rating = -1), -- +1 (helpful), -1 (unhelpful)
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_msg ON ai_feedback(message_id);

