-- GetCareKorea Certifications Schema Update
-- Migration: 20260129160000_certifications_to_jsonb.sql
-- Created: 2026-01-29
-- Purpose: Convert certifications from TEXT[] to JSONB for language-keyed structure

-- ============================================
-- Step 1: Update Function to expect JSONB
-- ============================================

DROP FUNCTION IF EXISTS get_interpreters_by_locale(TEXT);

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
    certifications JSONB,
    preferred_messenger TEXT,
    messenger_cta TEXT,
    is_verified BOOLEAN,
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
    ORDER BY ap.is_featured DESC, ap.display_order ASC, ap.avg_rating DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO authenticated;

-- ============================================
-- Step 2: Add new JSONB column for certifications
-- ============================================

ALTER TABLE author_personas ADD COLUMN IF NOT EXISTS certifications_new JSONB DEFAULT '{}';

-- ============================================
-- Step 3: Migrate data from TEXT[] to JSONB
-- (Convert array to {"en": [array elements]})
-- ============================================

UPDATE author_personas
SET certifications_new = CASE
    WHEN certifications IS NULL OR array_length(certifications, 1) IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object('en', to_jsonb(certifications))
END;

-- ============================================
-- Step 4: Drop old column and rename new
-- ============================================

ALTER TABLE author_personas DROP COLUMN IF EXISTS certifications;
ALTER TABLE author_personas RENAME COLUMN certifications_new TO certifications;

-- ============================================
-- Step 5: Remove is_available column (booking removed)
-- ============================================

ALTER TABLE author_personas DROP COLUMN IF EXISTS is_available;

-- ============================================
-- Step 6: Remove target_locales column (redundant)
-- ============================================

DROP INDEX IF EXISTS idx_author_personas_locales;
ALTER TABLE author_personas DROP COLUMN IF EXISTS target_locales;

-- ============================================
-- Step 7: Update View
-- ============================================

DROP VIEW IF EXISTS interpreter_profiles;

CREATE VIEW interpreter_profiles AS
SELECT
    ap.id,
    ap.slug,
    ap.name,
    ap.bio_short,
    ap.bio_full,
    ap.photo_url,
    ap.years_of_experience,
    ap.primary_specialty,
    ap.secondary_specialties,
    ap.languages,
    ap.certifications,
    ap.writing_tone,
    ap.writing_perspective,
    ap.preferred_messenger,
    ap.messenger_cta_text,
    ap.messenger_id,
    ap.is_active,
    ap.is_verified,
    ap.is_featured,
    ap.location,
    ap.video_url,
    ap.avg_rating,
    ap.review_count,
    ap.total_bookings,
    ap.total_posts,
    ap.total_views,
    ap.display_order,
    ap.created_at,
    ap.updated_at
FROM author_personas ap
WHERE ap.is_active = TRUE;

GRANT SELECT ON interpreter_profiles TO anon;
GRANT SELECT ON interpreter_profiles TO authenticated;

-- ============================================
-- Step 8: Add comment
-- ============================================

COMMENT ON COLUMN author_personas.certifications IS 'Localized certifications as JSONB: {"en": ["Cert 1", "Cert 2"], "ko": ["자격증1"], ...}';
