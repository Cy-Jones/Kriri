-- Migration: 005_add_custom_api_key_to_ai_model_configs.sql
-- Adds optional custom_api_key to ai_model_configs for BYOK (Bring-Your-Own-Key)

ALTER TABLE ai_model_configs 
ADD COLUMN IF NOT EXISTS custom_api_key VARCHAR(255) DEFAULT NULL;

