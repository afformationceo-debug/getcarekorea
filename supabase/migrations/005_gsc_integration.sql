-- =====================================================
-- Phase 5: GSC 연동 & 성과 추적 DB 마이그레이션
-- =====================================================

-- Cron 로그 테이블 (선택적)
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cron_logs_job ON cron_logs(job_name);
CREATE INDEX idx_cron_logs_status ON cron_logs(status);
CREATE INDEX idx_cron_logs_created ON cron_logs(created_at DESC);

-- content_performance 테이블에 unique constraint 추가 (upsert용)
DO $$
BEGIN
    -- unique constraint가 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'content_performance_blog_date_unique'
    ) THEN
        ALTER TABLE content_performance
        ADD CONSTRAINT content_performance_blog_date_unique
        UNIQUE (blog_post_id, date_range_start, date_range_end);
    END IF;
END $$;

-- 성과 알림 테이블 (선택적 - 랭킹 변동 알림용)
CREATE TABLE IF NOT EXISTS performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('tier_upgrade', 'tier_downgrade', 'high_performer', 'position_change')),
    previous_value TEXT,
    current_value TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_alerts_post ON performance_alerts(blog_post_id);
CREATE INDEX idx_performance_alerts_type ON performance_alerts(alert_type);
CREATE INDEX idx_performance_alerts_unread ON performance_alerts(is_read) WHERE is_read = FALSE;

-- RLS 정책 설정
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY cron_logs_admin_only ON cron_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY performance_alerts_admin_only ON performance_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 성과 데이터 집계 뷰 (선택적)
-- Note: blog_posts 테이블에는 locale 컬럼이 없으므로 category로만 그룹화
CREATE OR REPLACE VIEW performance_summary AS
SELECT
    bp.category,
    COUNT(*) as total_posts,
    SUM(CASE WHEN cp.performance_tier = 'top' THEN 1 ELSE 0 END) as top_tier,
    SUM(CASE WHEN cp.performance_tier = 'mid' THEN 1 ELSE 0 END) as mid_tier,
    SUM(CASE WHEN cp.performance_tier = 'low' THEN 1 ELSE 0 END) as low_tier,
    SUM(CASE WHEN cp.is_high_performer THEN 1 ELSE 0 END) as high_performers,
    AVG(cp.gsc_ctr) as avg_ctr,
    AVG(cp.gsc_position) as avg_position,
    SUM(cp.gsc_clicks) as total_clicks,
    SUM(cp.gsc_impressions) as total_impressions
FROM blog_posts bp
LEFT JOIN content_performance cp ON bp.id = cp.blog_post_id
WHERE bp.status = 'published'
GROUP BY bp.category;
