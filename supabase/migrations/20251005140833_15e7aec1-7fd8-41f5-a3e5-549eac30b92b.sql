-- Fix security definer view warning by explicitly setting security_invoker
-- This ensures the view uses the querying user's permissions, not the creator's
-- The view will respect RLS policies on underlying tables

-- Drop and recreate the view with explicit security settings
DROP VIEW IF EXISTS public.admin_user_stats;

CREATE VIEW public.admin_user_stats
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.created_at,
  COUNT(DISTINCT pr.id) as project_count,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_activity,
  COALESCE(SUM(pr.budget), 0) as total_budget
FROM profiles p
LEFT JOIN projects pr ON p.id = pr.user_id
LEFT JOIN conversations c ON p.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY p.id, p.full_name, p.username, p.created_at;

-- Add comment explaining the security model
COMMENT ON VIEW public.admin_user_stats IS 'Admin analytics view - respects RLS policies on underlying tables. Only accessible to users with admin role via application logic.';