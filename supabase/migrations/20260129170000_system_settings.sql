-- ============================================
-- System Settings Table
-- ============================================
-- 시스템 전역 설정을 저장하는 테이블
-- Cron 설정, 콘텐츠 생성 설정 등

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- 기본 설정값 삽입
INSERT INTO system_settings (key, value, description, category) VALUES
(
    'cron_auto_generate',
    '{
        "enabled": true,
        "batch_size": 3,
        "schedule": "0 9 * * *",
        "include_rag": true,
        "include_images": true,
        "image_count": 3,
        "auto_publish": false,
        "priority_threshold": 0
    }',
    'Auto content generation cron job settings',
    'cron'
),
(
    'cron_auto_publish',
    '{
        "enabled": true,
        "schedule": "0 10 * * *",
        "max_publish_per_run": 10,
        "min_quality_score": 0
    }',
    'Auto publish cron job settings',
    'cron'
),
(
    'content_generation',
    '{
        "default_locale": "en",
        "default_category": "general",
        "max_retries": 3,
        "timeout_seconds": 300
    }',
    'Content generation default settings',
    'content'
),
(
    'author_assignment',
    '{
        "algorithm": "round_robin",
        "prefer_specialty_match": true,
        "fallback_to_any": true
    }',
    'Author/Interpreter assignment settings',
    'content'
)
ON CONFLICT (key) DO NOTHING;

-- RLS 정책
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽기 가능
CREATE POLICY "Authenticated users can read settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (true);

-- Admin만 수정 가능 (profiles 테이블 참조)
CREATE POLICY "Admins can update settings"
    ON system_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert settings"
    ON system_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
