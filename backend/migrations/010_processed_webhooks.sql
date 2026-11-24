-- Migration: 009_processed_webhooks.sql
-- Description: Table for Clerk webhook deduplication and replay protection

CREATE TABLE IF NOT EXISTS processed_webhooks (
    id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
