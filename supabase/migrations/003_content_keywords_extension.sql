-- Migration: 003_content_keywords_extension
-- Description: Extend content_keywords table and add new tables for content automation
-- Created: 2026-01-22

-- ============================================
-- EXTEND content_keywords TABLE
-- ============================================

-- 한국어 키워드 (모든 언어 공통 참조용)
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS keyword_ko TEXT;

-- 현지어 키워드 (원본 검색어)
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS keyword_native TEXT;

-- 타겟 로케일 (기존 locale 컬럼과 별도로 명시적 관리)
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS target_locale TEXT;

-- 생성 큐 순서
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS generation_queue_order INTEGER;

-- 생성 완료 시간
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- 생성 에러 로그
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS generation_error TEXT;

-- 최종 품질 점수 (0-100)
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- 이미지 생성용 프롬프트
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS image_prompt TEXT;

-- 생성된 이미지 URL
ALTER TABLE content_keywords ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_content_keywords_locale ON content_keywords(locale);
CREATE INDEX IF NOT EXISTS idx_content_keywords_target_locale ON content_keywords(target_locale);
CREATE INDEX IF NOT EXISTS idx_content_keywords_queue_order ON content_keywords(generation_queue_order);
CREATE INDEX IF NOT EXISTS idx_content_keywords_generated ON content_keywords(generated_at);

-- ============================================
-- CREATE content_performance TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS content_performance (
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
    avg_time_on_page INTEGER DEFAULT 0,  -- 초 단위
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

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- content_performance 트리거
CREATE TRIGGER content_performance_updated_at
    BEFORE UPDATE ON content_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- content_performance 인덱스
CREATE INDEX IF NOT EXISTS idx_content_performance_blog ON content_performance(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_keyword ON content_performance(keyword_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_tier ON content_performance(performance_tier);
CREATE INDEX IF NOT EXISTS idx_content_performance_high ON content_performance(is_high_performer) WHERE is_high_performer = TRUE;
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance(date_range_start, date_range_end);

-- ============================================
-- CREATE llm_learning_data TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS llm_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 소스 정보
    source_type TEXT NOT NULL CHECK (source_type IN ('high_performer', 'user_feedback', 'manual_edit')),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
    keyword_id UUID REFERENCES content_keywords(id) ON DELETE SET NULL,

    -- 학습 데이터
    content_excerpt TEXT,           -- 성공한 콘텐츠 요약/발췌
    writing_style_notes TEXT,       -- 스타일 메모
    seo_patterns JSONB DEFAULT '{}', -- 성공한 SEO 패턴 (title_structure, heading_patterns 등)
    locale TEXT,
    category TEXT,

    -- 벡터 임베딩 여부
    is_vectorized BOOLEAN DEFAULT FALSE,
    vector_id TEXT,                 -- Upstash Vector ID

    -- 메타
    performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- llm_learning_data 인덱스
CREATE INDEX IF NOT EXISTS idx_llm_learning_source ON llm_learning_data(source_type);
CREATE INDEX IF NOT EXISTS idx_llm_learning_locale ON llm_learning_data(locale);
CREATE INDEX IF NOT EXISTS idx_llm_learning_category ON llm_learning_data(category);
CREATE INDEX IF NOT EXISTS idx_llm_learning_vectorized ON llm_learning_data(is_vectorized);
CREATE INDEX IF NOT EXISTS idx_llm_learning_blog ON llm_learning_data(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_llm_learning_keyword ON llm_learning_data(keyword_id);

-- ============================================
-- CREATE image_generations TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    keyword_id UUID REFERENCES content_keywords(id) ON DELETE SET NULL,

    -- 프롬프트
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- 결과
    image_url TEXT,
    thumbnail_url TEXT,

    -- 메타
    model TEXT DEFAULT 'nanobanana',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    generation_time_ms INTEGER,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- image_generations 인덱스
CREATE INDEX IF NOT EXISTS idx_image_generations_blog ON image_generations(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_keyword ON image_generations(keyword_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_status ON image_generations(status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- content_performance policies (admin only)
CREATE POLICY "Admins can manage content performance"
    ON content_performance FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- llm_learning_data policies (admin only)
CREATE POLICY "Admins can manage learning data"
    ON llm_learning_data FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- image_generations policies (admin only)
CREATE POLICY "Admins can manage image generations"
    ON image_generations FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to auto-detect performance tier
CREATE OR REPLACE FUNCTION calculate_performance_tier(
    p_ctr DECIMAL,
    p_position DECIMAL
) RETURNS TEXT AS $$
BEGIN
    IF p_ctr > 0.05 AND p_position < 10 THEN
        RETURN 'top';
    ELSIF p_ctr >= 0.02 OR p_position <= 30 THEN
        RETURN 'mid';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set performance tier
CREATE OR REPLACE FUNCTION auto_set_performance_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.performance_tier := calculate_performance_tier(NEW.gsc_ctr, NEW.gsc_position);
    NEW.is_high_performer := NEW.performance_tier = 'top';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_performance_tier_trigger
    BEFORE INSERT OR UPDATE ON content_performance
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_performance_tier();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON content_performance TO anon;
GRANT ALL ON content_performance TO authenticated;

GRANT SELECT ON llm_learning_data TO anon;
GRANT ALL ON llm_learning_data TO authenticated;

GRANT SELECT ON image_generations TO anon;
GRANT ALL ON image_generations TO authenticated;
