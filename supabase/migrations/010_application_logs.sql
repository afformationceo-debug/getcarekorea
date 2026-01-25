-- =====================================================
-- Application Logs Table
-- 구조화된 로깅 시스템을 위한 테이블
-- =====================================================

-- Create application_logs table
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(10) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  error JSONB DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_tags ON application_logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_application_logs_context ON application_logs USING GIN(context);

-- Create index for component filtering
CREATE INDEX IF NOT EXISTS idx_application_logs_component
ON application_logs ((context->>'component'));

-- Create index for operation filtering
CREATE INDEX IF NOT EXISTS idx_application_logs_operation
ON application_logs ((context->>'operation'));

-- =====================================================
-- Log Retention Policy
-- =====================================================

-- Function to clean up old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete debug logs older than 7 days
  DELETE FROM application_logs
  WHERE level = 'debug' AND created_at < NOW() - INTERVAL '7 days';

  -- Delete info logs older than 30 days
  DELETE FROM application_logs
  WHERE level = 'info' AND created_at < NOW() - INTERVAL '30 days';

  -- Delete warn logs older than 60 days
  DELETE FROM application_logs
  WHERE level = 'warn' AND created_at < NOW() - INTERVAL '60 days';

  -- Keep error and fatal logs for 90 days
  DELETE FROM application_logs
  WHERE level IN ('error', 'fatal') AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Log Summary Views
-- =====================================================

-- View: Daily log summary
CREATE OR REPLACE VIEW log_daily_summary AS
SELECT
  DATE(created_at) as log_date,
  level,
  COUNT(*) as count,
  context->>'component' as component,
  context->>'operation' as operation
FROM application_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), level, context->>'component', context->>'operation'
ORDER BY log_date DESC, count DESC;

-- View: Error summary by component
CREATE OR REPLACE VIEW error_summary_by_component AS
SELECT
  context->>'component' as component,
  COUNT(*) as error_count,
  COUNT(DISTINCT DATE(created_at)) as days_with_errors,
  MIN(created_at) as first_error,
  MAX(created_at) as last_error
FROM application_logs
WHERE level IN ('error', 'fatal')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY context->>'component'
ORDER BY error_count DESC;

-- View: Recent errors
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  id,
  level,
  message,
  context->>'component' as component,
  context->>'operation' as operation,
  error->>'name' as error_name,
  error->>'message' as error_message,
  created_at
FROM application_logs
WHERE level IN ('error', 'fatal')
ORDER BY created_at DESC
LIMIT 100;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to log an entry (can be called from database triggers)
CREATE OR REPLACE FUNCTION log_entry(
  p_level VARCHAR(10),
  p_message TEXT,
  p_context JSONB DEFAULT '{}',
  p_error JSONB DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO application_logs (level, message, context, error, tags)
  VALUES (p_level, p_message, p_context, p_error, p_tags)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get log stats for a time period
CREATE OR REPLACE FUNCTION get_log_stats(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '24 hours',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  level VARCHAR(10),
  count BIGINT,
  first_occurrence TIMESTAMPTZ,
  last_occurrence TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.level,
    COUNT(*)::BIGINT as count,
    MIN(al.created_at) as first_occurrence,
    MAX(al.created_at) as last_occurrence
  FROM application_logs al
  WHERE al.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY al.level
  ORDER BY
    CASE al.level
      WHEN 'fatal' THEN 1
      WHEN 'error' THEN 2
      WHEN 'warn' THEN 3
      WHEN 'info' THEN 4
      WHEN 'debug' THEN 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to search logs
CREATE OR REPLACE FUNCTION search_logs(
  p_search TEXT,
  p_levels TEXT[] DEFAULT NULL,
  p_components TEXT[] DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  level VARCHAR(10),
  message TEXT,
  component TEXT,
  operation TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.level,
    al.message,
    al.context->>'component' as component,
    al.context->>'operation' as operation,
    al.error->>'message' as error_message,
    al.created_at
  FROM application_logs al
  WHERE
    (p_search IS NULL OR al.message ILIKE '%' || p_search || '%')
    AND (p_levels IS NULL OR al.level = ANY(p_levels))
    AND (p_components IS NULL OR al.context->>'component' = ANY(p_components))
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view logs"
ON application_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role IN ('admin', 'super_admin')
  )
);

-- Service role can insert logs
CREATE POLICY "Service can insert logs"
ON application_logs FOR INSERT
WITH CHECK (true);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE application_logs IS 'Structured application logs for monitoring and debugging';
COMMENT ON COLUMN application_logs.level IS 'Log level: debug, info, warn, error, fatal';
COMMENT ON COLUMN application_logs.context IS 'Structured context data (component, operation, etc.)';
COMMENT ON COLUMN application_logs.error IS 'Error details including name, message, and stack trace';
COMMENT ON COLUMN application_logs.tags IS 'Searchable tags for categorizing logs';
