-- =====================================================
-- Phase 7a: content_status enum에 'scheduled' 값 추가
-- 주의: 이 파일을 먼저 실행한 후 007b를 실행하세요
-- =====================================================

-- content_status enum에 'scheduled' 값 추가 (없는 경우)
DO $$
BEGIN
    -- Check if 'scheduled' already exists in content_status enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'content_status' AND e.enumlabel = 'scheduled'
    ) THEN
        ALTER TYPE content_status ADD VALUE 'scheduled' AFTER 'review';
    END IF;
END $$;
