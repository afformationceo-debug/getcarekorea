-- GetCareKorea: Force cleanup of old interpreter columns
-- Migration: cleanup_old_columns
-- Created: 2026-01-29
-- Purpose: Ensure old locale-specific columns are removed

-- First drop the view that might depend on these columns
DROP VIEW IF EXISTS interpreter_profiles CASCADE;

-- Drop old name columns
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ko CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_en CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_zh_tw CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_zh_cn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ja CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_th CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_mn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS name_ru CASCADE;

-- Drop old bio_short columns
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ko CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_en CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_zh_tw CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_zh_cn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ja CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_th CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_mn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_short_ru CASCADE;

-- Drop old bio_full columns
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ko CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_en CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_zh_tw CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_zh_cn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ja CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_th CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_mn CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS bio_full_ru CASCADE;

-- Drop pricing columns
ALTER TABLE author_personas DROP COLUMN IF EXISTS hourly_rate CASCADE;
ALTER TABLE author_personas DROP COLUMN IF EXISTS daily_rate CASCADE;

-- Ensure JSONB columns exist with proper defaults
DO $$
BEGIN
    -- Check if 'name' column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'name' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN name JSONB NOT NULL DEFAULT '{"en": ""}';
    END IF;

    -- Check if 'bio_short' column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'bio_short' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN bio_short JSONB DEFAULT '{}';
    END IF;

    -- Check if 'bio_full' column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'bio_full' AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN bio_full JSONB DEFAULT '{}';
    END IF;
END $$;

-- Recreate the view with new structure
CREATE OR REPLACE VIEW interpreter_profiles AS
SELECT
    ap.id,
    ap.slug,
    ap.name,
    ap.bio_short,
    ap.bio_full,
    ap.photo_url,
    ap.years_of_experience,
    ap.target_locales,
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
    ap.is_available,
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_author_personas_name ON author_personas USING GIN(name);
CREATE INDEX IF NOT EXISTS idx_author_personas_bio_short ON author_personas USING GIN(bio_short);
