-- GetCareKorea Interpreter Schema Refactor
-- Migration: 014_interpreter_schema_refactor.sql
-- Created: 2026-01-29
-- Purpose:
--   1. Remove hourly_rate and daily_rate
--   2. Convert multi-language fields (name, bio_short, bio_full) to JSONB

-- ============================================
-- Step 0: Drop existing view and function that depend on old columns
-- ============================================

DROP VIEW IF EXISTS interpreter_profiles;
DROP FUNCTION IF EXISTS get_interpreters_by_locale(TEXT);

-- ============================================
-- Step 1: Add new JSONB columns
-- ============================================

ALTER TABLE author_personas ADD COLUMN IF NOT EXISTS name JSONB NOT NULL DEFAULT '{"en": ""}';
ALTER TABLE author_personas ADD COLUMN IF NOT EXISTS bio_short JSONB DEFAULT '{}';
ALTER TABLE author_personas ADD COLUMN IF NOT EXISTS bio_full JSONB DEFAULT '{}';

-- ============================================
-- Step 2: Migrate existing data to JSONB
-- ============================================

UPDATE author_personas SET
    name = jsonb_build_object(
        'ko', COALESCE(name_ko, ''),
        'en', COALESCE(name_en, ''),
        'zh-TW', COALESCE(name_zh_tw, ''),
        'zh-CN', COALESCE(name_zh_cn, ''),
        'ja', COALESCE(name_ja, ''),
        'th', COALESCE(name_th, ''),
        'mn', COALESCE(name_mn, ''),
        'ru', COALESCE(name_ru, '')
    ),
    bio_short = jsonb_build_object(
        'ko', COALESCE(bio_short_ko, ''),
        'en', COALESCE(bio_short_en, ''),
        'zh-TW', COALESCE(bio_short_zh_tw, ''),
        'zh-CN', COALESCE(bio_short_zh_cn, ''),
        'ja', COALESCE(bio_short_ja, ''),
        'th', COALESCE(bio_short_th, ''),
        'mn', COALESCE(bio_short_mn, ''),
        'ru', COALESCE(bio_short_ru, '')
    ),
    bio_full = jsonb_build_object(
        'ko', COALESCE(bio_full_ko, ''),
        'en', COALESCE(bio_full_en, ''),
        'zh-TW', COALESCE(bio_full_zh_tw, ''),
        'zh-CN', COALESCE(bio_full_zh_cn, ''),
        'ja', COALESCE(bio_full_ja, ''),
        'th', COALESCE(bio_full_th, ''),
        'mn', COALESCE(bio_full_mn, ''),
        'ru', COALESCE(bio_full_ru, '')
    );

-- Remove empty string values from JSONB (keep only non-empty locales)
UPDATE author_personas SET
    name = (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each_text(name)
        WHERE value IS NOT NULL AND value != ''
    ),
    bio_short = (
        SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
        FROM jsonb_each_text(bio_short)
        WHERE value IS NOT NULL AND value != ''
    ),
    bio_full = (
        SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
        FROM jsonb_each_text(bio_full)
        WHERE value IS NOT NULL AND value != ''
    );

-- ============================================
-- Step 3: Drop old columns
-- ============================================

ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ko;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_en;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_zh_tw;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_zh_cn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ja;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_th;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_mn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ru;

ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ko;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_en;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_zh_tw;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_zh_cn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ja;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_th;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_mn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ru;

ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ko;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_en;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_zh_tw;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_zh_cn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ja;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_th;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_mn;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ru;

-- Drop pricing columns
ALTER TABLE author_personas DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE author_personas DROP COLUMN IF EXISTS daily_rate;

-- ============================================
-- Step 4: Create indexes for JSONB fields
-- ============================================

CREATE INDEX IF NOT EXISTS idx_author_personas_name ON author_personas USING GIN(name);
CREATE INDEX IF NOT EXISTS idx_author_personas_bio_short ON author_personas USING GIN(bio_short);

-- ============================================
-- Step 5: Update View
-- ============================================

DROP VIEW IF EXISTS interpreter_profiles;

CREATE VIEW interpreter_profiles AS
SELECT
    ap.id,
    ap.slug,
    -- JSONB localized fields
    ap.name,
    ap.bio_short,
    ap.bio_full,
    -- Profile info
    ap.photo_url,
    ap.years_of_experience,
    ap.target_locales,
    -- Specialties
    ap.primary_specialty,
    ap.secondary_specialties,
    -- Languages
    ap.languages,
    ap.certifications,
    -- Writing style
    ap.writing_tone,
    ap.writing_perspective,
    -- CTA
    ap.preferred_messenger,
    ap.messenger_cta_text,
    ap.messenger_id,
    -- Status
    ap.is_active,
    ap.is_verified,
    ap.is_available,
    ap.is_featured,
    -- Stats
    ap.location,
    ap.video_url,
    ap.avg_rating,
    ap.review_count,
    ap.total_bookings,
    ap.total_posts,
    ap.total_views,
    ap.display_order,
    -- Timestamps
    ap.created_at,
    ap.updated_at
FROM author_personas ap
WHERE ap.is_active = TRUE;

GRANT SELECT ON interpreter_profiles TO anon;
GRANT SELECT ON interpreter_profiles TO authenticated;

-- ============================================
-- Step 6: Update Function
-- ============================================

CREATE OR REPLACE FUNCTION get_interpreters_by_locale(target_locale TEXT)
RETURNS TABLE (
    id UUID,
    slug TEXT,
    name TEXT,
    photo_url TEXT,
    years_of_experience INTEGER,
    primary_specialty TEXT,
    secondary_specialties TEXT[],
    languages JSONB,
    bio_short TEXT,
    bio_full TEXT,
    certifications TEXT[],
    preferred_messenger TEXT,
    messenger_cta TEXT,
    is_verified BOOLEAN,
    is_available BOOLEAN,
    is_featured BOOLEAN,
    location TEXT,
    video_url TEXT,
    avg_rating DECIMAL,
    review_count INTEGER,
    total_bookings INTEGER,
    total_posts INTEGER,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.id,
        ap.slug,
        -- Get localized name with fallback to English
        COALESCE(ap.name->>target_locale, ap.name->>'en', '')::TEXT,
        ap.photo_url,
        ap.years_of_experience,
        ap.primary_specialty,
        ap.secondary_specialties,
        ap.languages,
        -- Get localized bio_short with fallback
        COALESCE(ap.bio_short->>target_locale, ap.bio_short->>'en', '')::TEXT,
        -- Get localized bio_full with fallback
        COALESCE(ap.bio_full->>target_locale, ap.bio_full->>'en', '')::TEXT,
        ap.certifications,
        ap.preferred_messenger,
        -- Get CTA text for locale
        COALESCE(ap.messenger_cta_text->>target_locale, ap.messenger_cta_text->>'en', 'Contact Us'),
        ap.is_verified,
        ap.is_available,
        ap.is_featured,
        ap.location,
        ap.video_url,
        ap.avg_rating,
        ap.review_count,
        ap.total_bookings,
        ap.total_posts,
        ap.display_order
    FROM author_personas ap
    WHERE ap.is_active = TRUE
      AND target_locale = ANY(ap.target_locales)
    ORDER BY ap.is_featured DESC, ap.display_order ASC, ap.avg_rating DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO authenticated;

-- ============================================
-- Step 7: Add comment for documentation
-- ============================================

COMMENT ON COLUMN author_personas.name IS 'Localized names as JSONB: {"en": "English Name", "ko": "한국어 이름", "ja": "日本語名", ...}';
COMMENT ON COLUMN author_personas.bio_short IS 'Localized short bios as JSONB for cards';
COMMENT ON COLUMN author_personas.bio_full IS 'Localized full bios as JSONB for detail pages';
