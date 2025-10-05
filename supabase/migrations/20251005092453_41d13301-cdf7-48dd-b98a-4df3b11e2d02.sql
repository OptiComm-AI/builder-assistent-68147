-- Add AI-extracted project intelligence columns to projects table
ALTER TABLE projects 
ADD COLUMN key_features text[],
ADD COLUMN materials_mentioned text[],
ADD COLUMN style_preferences text[],
ADD COLUMN budget_estimate numeric,
ADD COLUMN timeline_weeks integer,
ADD COLUMN ai_extracted_data jsonb,
ADD COLUMN last_chat_update timestamptz;

-- Add index for better performance
CREATE INDEX idx_projects_last_chat_update ON projects(last_chat_update DESC);

-- Add comment explaining the new columns
COMMENT ON COLUMN projects.key_features IS 'AI-extracted key features and requirements from chat conversations';
COMMENT ON COLUMN projects.materials_mentioned IS 'Materials or products discussed in conversations';
COMMENT ON COLUMN projects.style_preferences IS 'Design styles mentioned (modern, rustic, etc.)';
COMMENT ON COLUMN projects.budget_estimate IS 'AI-estimated budget based on conversation';
COMMENT ON COLUMN projects.timeline_weeks IS 'AI-estimated timeline in weeks';
COMMENT ON COLUMN projects.ai_extracted_data IS 'Additional structured data extracted by AI';
COMMENT ON COLUMN projects.last_chat_update IS 'Timestamp of last chat message related to this project';