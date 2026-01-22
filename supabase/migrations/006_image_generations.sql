-- =====================================================
-- Phase 6: 이미지 자동 생성 DB 마이그레이션
-- =====================================================

-- 이미지 생성 기록 테이블
CREATE TABLE IF NOT EXISTS image_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,

    -- 프롬프트
    prompt TEXT NOT NULL,
    negative_prompt TEXT,

    -- 결과
    image_url TEXT,
    thumbnail_url TEXT,

    -- 메타
    model TEXT DEFAULT 'nanobanana',
    style TEXT DEFAULT 'photorealistic',
    width INTEGER DEFAULT 1200,
    height INTEGER DEFAULT 630,

    -- 상태
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    generation_time_ms INTEGER,
    error_message TEXT,

    -- 비용 추적 (선택)
    cost_credits DECIMAL(10,4),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_image_generations_blog ON image_generations(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_image_generations_status ON image_generations(status);
CREATE INDEX IF NOT EXISTS idx_image_generations_created ON image_generations(created_at DESC);

-- blog_posts 테이블에 이미지 관련 컬럼 추가 (없는 경우)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blog_posts' AND column_name = 'cover_image_alt'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN cover_image_alt TEXT;
    END IF;
END $$;

-- RLS 정책 설정
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능
CREATE POLICY image_generations_admin_only ON image_generations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Supabase Storage 버킷 생성 (SQL로는 불가, 참고용)
-- 수동으로 Supabase 대시보드에서 생성 필요:
-- 1. Storage → New Bucket → "blog-images"
-- 2. Public bucket 설정
-- 3. RLS 정책 설정 (관리자만 업로드 가능)

COMMENT ON TABLE image_generations IS '나노바나나 API를 통한 이미지 생성 기록';
