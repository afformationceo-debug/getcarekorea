-- =====================================================
-- Phase 7b: 자동 발행 시스템 DB 마이그레이션
-- 주의: 007a를 먼저 실행한 후 이 파일을 실행하세요
-- =====================================================

-- blog_posts 테이블에 예약 발행 컬럼 추가
DO $$
BEGIN
    -- scheduled_at: 예약 발행 시간
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;

    -- first_published_at: 최초 발행 시간
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'first_published_at'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN first_published_at TIMESTAMPTZ;
    END IF;

    -- last_revalidated_at: 마지막 ISR 재검증 시간
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'last_revalidated_at'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN last_revalidated_at TIMESTAMPTZ;
    END IF;

    -- sitemap_included: 사이트맵 포함 여부
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'sitemap_included'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN sitemap_included BOOLEAN DEFAULT TRUE;
    END IF;

    -- sitemap_priority: 사이트맵 우선순위 (0.0-1.0)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'sitemap_priority'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN sitemap_priority DECIMAL(2,1) DEFAULT 0.7;
    END IF;

    -- sitemap_changefreq: 변경 빈도
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'sitemap_changefreq'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN sitemap_changefreq TEXT DEFAULT 'weekly';
    END IF;
END $$;

-- 인덱스 생성 (scheduled enum 값 사용)
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled ON blog_posts(scheduled_at)
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_sitemap ON blog_posts(sitemap_included, status)
    WHERE sitemap_included = TRUE;

-- 발행 이력 테이블
CREATE TABLE IF NOT EXISTS publish_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

    -- 발행 정보
    action TEXT NOT NULL CHECK (action IN ('publish', 'unpublish', 'schedule', 'revalidate')),
    previous_status TEXT,
    new_status TEXT,

    -- 메타
    triggered_by TEXT, -- 'manual', 'scheduled', 'auto', 'cron'
    user_id UUID REFERENCES auth.users(id),

    -- 결과
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    -- 추가 정보
    details JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_publish_history_post ON publish_history(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_publish_history_created ON publish_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_history_action ON publish_history(action);

-- RLS 정책
ALTER TABLE publish_history ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'publish_history_admin_only'
    ) THEN
        CREATE POLICY publish_history_admin_only ON publish_history
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;

-- 사이트맵 캐시 테이블 (선택적)
CREATE TABLE IF NOT EXISTS sitemap_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 사이트맵 유형
    type TEXT NOT NULL UNIQUE CHECK (type IN ('full', 'blog', 'pages')),

    -- 캐시 데이터
    xml_content TEXT NOT NULL,
    url_count INTEGER NOT NULL DEFAULT 0,

    -- 메타
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 사이트맵 캐시 업데이트 트리거
CREATE OR REPLACE FUNCTION update_sitemap_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sitemap_cache_updated ON sitemap_cache;
CREATE TRIGGER sitemap_cache_updated
    BEFORE UPDATE ON sitemap_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_sitemap_cache_timestamp();

-- 코멘트
COMMENT ON TABLE publish_history IS '블로그 포스트 발행 이력';
COMMENT ON TABLE sitemap_cache IS '사이트맵 XML 캐시';
COMMENT ON COLUMN blog_posts.scheduled_at IS '예약 발행 시간';
COMMENT ON COLUMN blog_posts.first_published_at IS '최초 발행 시간 (수정시에도 유지)';
COMMENT ON COLUMN blog_posts.sitemap_priority IS '사이트맵 우선순위 (0.0-1.0)';
