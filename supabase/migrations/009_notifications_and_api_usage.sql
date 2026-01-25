-- =====================================================
-- Migration: 009_notifications_and_api_usage
-- Description: Add tables for notifications and API usage tracking
-- Created: 2026-01-25
-- =====================================================

-- =====================================================
-- 1. Admin Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    source TEXT NOT NULL, -- 'content_generation', 'publishing', 'cron', 'gsc', etc.
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_created ON admin_notifications(created_at DESC);

-- Auto-delete old notifications (keep last 30 days)
-- This would be handled by a cron job in practice


-- =====================================================
-- 2. API Usage Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL, -- 'anthropic', 'openai', 'replicate', etc.
    endpoint TEXT, -- specific endpoint or model
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    tokens_used INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    latency_ms INTEGER,
    status TEXT DEFAULT 'success', -- 'success', 'error'
    error_message TEXT,
    request_id TEXT, -- for tracking/debugging
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_provider ON api_usage_logs(provider);
CREATE INDEX idx_api_usage_created ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_status ON api_usage_logs(status);


-- =====================================================
-- 3. API Cost Alerts Table
-- =====================================================

CREATE TABLE IF NOT EXISTS api_cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT, -- null for total
    threshold_usd DECIMAL(10, 2) NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default alerts
INSERT INTO api_cost_alerts (provider, threshold_usd, period) VALUES
    (NULL, 100.00, 'monthly'), -- Total monthly alert
    ('anthropic', 50.00, 'monthly'),
    ('openai', 30.00, 'monthly'),
    ('replicate', 20.00, 'monthly');


-- =====================================================
-- 4. Feedback Logs Table (for content feedback)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_feedback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    draft_id UUID, -- content_drafts if draft feedback
    admin_id UUID REFERENCES profiles(id),
    feedback_text TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'edit')),
    regenerated BOOLEAN DEFAULT FALSE,
    regenerated_at TIMESTAMPTZ,
    vector_id TEXT, -- for RAG retrieval
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_post ON admin_feedback_logs(post_id);
CREATE INDEX idx_feedback_draft ON admin_feedback_logs(draft_id);
CREATE INDEX idx_feedback_type ON admin_feedback_logs(feedback_type);


-- =====================================================
-- 5. Content Quality Scores Table
-- =====================================================

CREATE TABLE IF NOT EXISTS content_quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    draft_id UUID,

    -- Quality metrics
    seo_score INTEGER DEFAULT 0, -- 0-100
    readability_score INTEGER DEFAULT 0, -- 0-100
    keyword_density DECIMAL(5, 2) DEFAULT 0, -- percentage
    word_count INTEGER DEFAULT 0,
    heading_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    internal_link_count INTEGER DEFAULT 0,
    external_link_count INTEGER DEFAULT 0,

    -- SEO specific
    has_meta_title BOOLEAN DEFAULT FALSE,
    has_meta_description BOOLEAN DEFAULT FALSE,
    has_faq_schema BOOLEAN DEFAULT FALSE,
    has_howto_schema BOOLEAN DEFAULT FALSE,
    meta_title_length INTEGER DEFAULT 0,
    meta_description_length INTEGER DEFAULT 0,

    -- Computed overall score
    overall_score INTEGER GENERATED ALWAYS AS (
        (seo_score * 0.4 + readability_score * 0.3 +
         CASE WHEN has_meta_title THEN 10 ELSE 0 END +
         CASE WHEN has_meta_description THEN 10 ELSE 0 END +
         CASE WHEN has_faq_schema THEN 5 ELSE 0 END +
         LEAST(image_count * 5, 15))::INTEGER
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quality_post ON content_quality_scores(post_id);
CREATE INDEX idx_quality_score ON content_quality_scores(overall_score DESC);


-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_source TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO admin_notifications (type, title, message, source, metadata)
    VALUES (p_type, p_title, p_message, p_source, p_metadata)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
    p_provider TEXT,
    p_endpoint TEXT,
    p_tokens_input INTEGER,
    p_tokens_output INTEGER,
    p_cost_usd DECIMAL,
    p_latency_ms INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO api_usage_logs (
        provider, endpoint, tokens_input, tokens_output,
        cost_usd, latency_ms, status, error_message, metadata
    ) VALUES (
        p_provider, p_endpoint, p_tokens_input, p_tokens_output,
        p_cost_usd, p_latency_ms, p_status, p_error_message, p_metadata
    )
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- Function to get monthly API cost
CREATE OR REPLACE FUNCTION get_monthly_api_cost(p_provider TEXT DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
    v_cost DECIMAL;
BEGIN
    SELECT COALESCE(SUM(cost_usd), 0) INTO v_cost
    FROM api_usage_logs
    WHERE created_at >= date_trunc('month', CURRENT_DATE)
    AND (p_provider IS NULL OR provider = p_provider);

    RETURN v_cost;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 7. Views
-- =====================================================

-- Daily API usage summary
CREATE OR REPLACE VIEW api_usage_daily_summary AS
SELECT
    date_trunc('day', created_at)::DATE as date,
    provider,
    COUNT(*) as total_calls,
    SUM(tokens_input) as total_tokens_input,
    SUM(tokens_output) as total_tokens_output,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(latency_ms)::INTEGER as avg_latency_ms,
    COUNT(*) FILTER (WHERE status = 'error') as error_count
FROM api_usage_logs
GROUP BY date_trunc('day', created_at)::DATE, provider
ORDER BY date DESC, provider;


-- Monthly cost by provider
CREATE OR REPLACE VIEW api_cost_monthly AS
SELECT
    date_trunc('month', created_at)::DATE as month,
    provider,
    SUM(cost_usd) as total_cost,
    COUNT(*) as total_calls
FROM api_usage_logs
GROUP BY date_trunc('month', created_at)::DATE, provider
ORDER BY month DESC, provider;


-- =====================================================
-- 8. RLS Policies (Admin only)
-- =====================================================

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_feedback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_quality_scores ENABLE ROW LEVEL SECURITY;

-- Admin read/write for all tables
CREATE POLICY "Admin full access on notifications"
    ON admin_notifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on api_usage"
    ON api_usage_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on cost_alerts"
    ON api_cost_alerts FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on feedback"
    ON admin_feedback_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on quality_scores"
    ON content_quality_scores FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Service role bypass
CREATE POLICY "Service role bypass on notifications"
    ON admin_notifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role bypass on api_usage"
    ON api_usage_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


-- =====================================================
-- 9. Cleanup old data (to be called by cron)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
BEGIN
    -- Delete notifications older than 30 days
    DELETE FROM admin_notifications
    WHERE created_at < NOW() - INTERVAL '30 days';

    -- Delete API logs older than 90 days
    DELETE FROM api_usage_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
