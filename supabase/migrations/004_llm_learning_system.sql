-- =====================================================
-- Phase 4: LLM 자가 학습 시스템 DB 마이그레이션
-- =====================================================

-- 관리자 피드백 로그 테이블
CREATE TABLE IF NOT EXISTS admin_feedback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'edit')),
    notes TEXT,
    learning_data_id TEXT, -- 생성된 학습 데이터 ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_feedback_blog ON admin_feedback_logs(blog_post_id);
CREATE INDEX idx_admin_feedback_admin ON admin_feedback_logs(admin_id);
CREATE INDEX idx_admin_feedback_type ON admin_feedback_logs(feedback_type);

-- 학습 데이터 테이블 확장 (이미 003에서 생성된 경우 무시)
-- llm_learning_data 테이블이 없는 경우에만 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'llm_learning_data') THEN
        CREATE TABLE llm_learning_data (
            id TEXT PRIMARY KEY,
            source_type TEXT NOT NULL CHECK (source_type IN ('high_performer', 'user_feedback', 'manual_edit')),
            blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
            keyword_id UUID REFERENCES content_keywords(id) ON DELETE SET NULL,
            content_excerpt TEXT,
            writing_style_notes TEXT,
            seo_patterns JSONB,
            locale TEXT,
            category TEXT,
            performance_score INTEGER,
            is_vectorized BOOLEAN DEFAULT FALSE,
            vector_id TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_llm_learning_source ON llm_learning_data(source_type);
        CREATE INDEX idx_llm_learning_locale ON llm_learning_data(locale);
        CREATE INDEX idx_llm_learning_category ON llm_learning_data(category);
        CREATE INDEX idx_llm_learning_vectorized ON llm_learning_data(is_vectorized);
        CREATE INDEX idx_llm_learning_score ON llm_learning_data(performance_score DESC);
    END IF;
END $$;

-- content_performance 테이블이 없는 경우에만 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'content_performance') THEN
        CREATE TABLE content_performance (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
            keyword_id UUID REFERENCES content_keywords(id) ON DELETE SET NULL,

            -- Google Search Console 데이터
            gsc_impressions INTEGER DEFAULT 0,
            gsc_clicks INTEGER DEFAULT 0,
            gsc_ctr DECIMAL(5,4) DEFAULT 0.0000,
            gsc_position DECIMAL(5,2) DEFAULT 0.00,

            -- 트래픽 데이터
            page_views INTEGER DEFAULT 0,
            unique_visitors INTEGER DEFAULT 0,
            avg_time_on_page INTEGER DEFAULT 0,
            bounce_rate DECIMAL(5,4) DEFAULT 0.0000,

            -- 전환 데이터
            inquiry_conversions INTEGER DEFAULT 0,
            chat_conversions INTEGER DEFAULT 0,

            -- 기간
            date_range_start DATE NOT NULL,
            date_range_end DATE NOT NULL,

            -- LLM 학습용 플래그
            is_high_performer BOOLEAN DEFAULT FALSE,
            performance_tier TEXT CHECK (performance_tier IN ('top', 'mid', 'low')),

            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_content_performance_blog ON content_performance(blog_post_id);
        CREATE INDEX idx_content_performance_tier ON content_performance(performance_tier);
        CREATE INDEX idx_content_performance_high ON content_performance(is_high_performer) WHERE is_high_performer = TRUE;
        CREATE INDEX idx_content_performance_date ON content_performance(date_range_start, date_range_end);
    END IF;
END $$;

-- 학습 파이프라인 실행 로그 테이블
CREATE TABLE IF NOT EXISTS learning_pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

    -- 결과
    posts_processed INTEGER DEFAULT 0,
    new_high_performers INTEGER DEFAULT 0,
    data_indexed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_status ON learning_pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_started ON learning_pipeline_runs(started_at DESC);

-- RLS 정책 설정
ALTER TABLE admin_feedback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_pipeline_runs ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY admin_feedback_logs_admin_only ON admin_feedback_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY llm_learning_data_admin_only ON llm_learning_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY content_performance_admin_only ON content_performance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY learning_pipeline_runs_admin_only ON learning_pipeline_runs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
