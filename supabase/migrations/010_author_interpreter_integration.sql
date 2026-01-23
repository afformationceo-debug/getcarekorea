-- GetCareKorea Author-Interpreter Integration
-- Migration: 010_author_interpreter_integration.sql
-- Created: 2026-01-23
-- Purpose: Enhance author_personas to serve as interpreters with full profile

-- ============================================
-- Add Interpreter-Specific Fields to author_personas
-- ============================================

-- Add fields for interpreter pricing and availability
DO $$
BEGIN
    -- Hourly rate for interpreter services
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'hourly_rate'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN hourly_rate INTEGER DEFAULT 50;
    END IF;

    -- Daily rate for interpreter services
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'daily_rate'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN daily_rate INTEGER DEFAULT 350;
    END IF;

    -- Availability status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'is_available'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;

    -- Location/Area
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'location'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN location TEXT DEFAULT 'Seoul, Gangnam';
    END IF;

    -- Video introduction URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'video_url'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN video_url TEXT;
    END IF;

    -- Review stats
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'avg_rating'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN avg_rating DECIMAL(2,1) DEFAULT 4.8;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'review_count'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'total_bookings'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN total_bookings INTEGER DEFAULT 0;
    END IF;

    -- Featured flag for highlighting top interpreters
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;

    -- Display order for sorting
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'author_personas' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE author_personas ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- Create Index for Interpreter Queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_author_personas_available ON author_personas(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_author_personas_rating ON author_personas(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_author_personas_featured ON author_personas(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_author_personas_display_order ON author_personas(display_order);

-- ============================================
-- Update Existing Personas with Interpreter Data
-- ============================================

-- Sophia Chen - English/Western Markets
UPDATE author_personas SET
    hourly_rate = 60,
    daily_rate = 400,
    is_available = TRUE,
    location = 'Seoul, Gangnam',
    avg_rating = 4.9,
    review_count = 156,
    total_bookings = 423,
    is_featured = TRUE,
    display_order = 1
WHERE slug = 'sophia-chen';

-- Wendy Lin - Taiwan/Chinese Markets
UPDATE author_personas SET
    hourly_rate = 55,
    daily_rate = 380,
    is_available = TRUE,
    location = 'Seoul, Myeongdong',
    avg_rating = 4.8,
    review_count = 112,
    total_bookings = 287,
    is_featured = TRUE,
    display_order = 2
WHERE slug = 'wendy-lin';

-- Yuki Tanaka - Japan Market
UPDATE author_personas SET
    hourly_rate = 65,
    daily_rate = 420,
    is_available = TRUE,
    location = 'Seoul, Gangnam',
    avg_rating = 4.9,
    review_count = 203,
    total_bookings = 512,
    is_featured = TRUE,
    display_order = 3
WHERE slug = 'yuki-tanaka';

-- Nina Park - Thailand Market
UPDATE author_personas SET
    hourly_rate = 50,
    daily_rate = 350,
    is_available = TRUE,
    location = 'Seoul, Sinsa',
    avg_rating = 4.7,
    review_count = 78,
    total_bookings = 165,
    is_featured = FALSE,
    display_order = 4
WHERE slug = 'nina-park';

-- Oyunaa Bold - Mongolia Market
UPDATE author_personas SET
    hourly_rate = 45,
    daily_rate = 320,
    is_available = TRUE,
    location = 'Seoul, Itaewon',
    avg_rating = 4.7,
    review_count = 45,
    total_bookings = 98,
    is_featured = FALSE,
    display_order = 5
WHERE slug = 'oyunaa-bold';

-- Elena Kim - Russia/CIS Market
UPDATE author_personas SET
    hourly_rate = 55,
    daily_rate = 380,
    is_available = TRUE,
    location = 'Seoul, Gangnam',
    avg_rating = 4.8,
    review_count = 89,
    total_bookings = 201,
    is_featured = TRUE,
    display_order = 6
WHERE slug = 'elena-kim';

-- ============================================
-- Create View for Interpreter Listings
-- ============================================

CREATE OR REPLACE VIEW interpreter_profiles AS
SELECT
    ap.id,
    ap.slug,
    -- Names by locale
    ap.name_ko,
    ap.name_en,
    ap.name_zh_tw,
    ap.name_zh_cn,
    ap.name_ja,
    ap.name_th,
    ap.name_mn,
    ap.name_ru,
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
    -- Bios
    ap.bio_short_ko,
    ap.bio_short_en,
    ap.bio_short_zh_tw,
    ap.bio_short_zh_cn,
    ap.bio_short_ja,
    ap.bio_short_th,
    ap.bio_short_mn,
    ap.bio_short_ru,
    ap.bio_full_ko,
    ap.bio_full_en,
    ap.bio_full_zh_tw,
    ap.bio_full_zh_cn,
    ap.bio_full_ja,
    ap.bio_full_th,
    ap.bio_full_mn,
    ap.bio_full_ru,
    -- Writing style
    ap.writing_tone,
    ap.writing_perspective,
    -- CTA
    ap.preferred_messenger,
    ap.messenger_cta_text,
    -- Status
    ap.is_active,
    ap.is_verified,
    ap.is_available,
    ap.is_featured,
    -- Interpreter specific
    ap.hourly_rate,
    ap.daily_rate,
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

-- ============================================
-- Grant Permissions on View
-- ============================================

GRANT SELECT ON interpreter_profiles TO anon;
GRANT SELECT ON interpreter_profiles TO authenticated;

-- ============================================
-- Function to Get Interpreters by Locale
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
    hourly_rate INTEGER,
    daily_rate INTEGER,
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
        -- Select appropriate name based on locale
        CASE target_locale
            WHEN 'ko' THEN ap.name_ko
            WHEN 'en' THEN ap.name_en
            WHEN 'zh-TW' THEN COALESCE(ap.name_zh_tw, ap.name_en)
            WHEN 'zh-CN' THEN COALESCE(ap.name_zh_cn, ap.name_en)
            WHEN 'ja' THEN COALESCE(ap.name_ja, ap.name_en)
            WHEN 'th' THEN COALESCE(ap.name_th, ap.name_en)
            WHEN 'mn' THEN COALESCE(ap.name_mn, ap.name_en)
            WHEN 'ru' THEN COALESCE(ap.name_ru, ap.name_en)
            ELSE ap.name_en
        END,
        ap.photo_url,
        ap.years_of_experience,
        ap.primary_specialty,
        ap.secondary_specialties,
        ap.languages,
        -- Select appropriate bio based on locale
        CASE target_locale
            WHEN 'ko' THEN COALESCE(ap.bio_short_ko, ap.bio_short_en)
            WHEN 'en' THEN ap.bio_short_en
            WHEN 'zh-TW' THEN COALESCE(ap.bio_short_zh_tw, ap.bio_short_en)
            WHEN 'zh-CN' THEN COALESCE(ap.bio_short_zh_cn, ap.bio_short_en)
            WHEN 'ja' THEN COALESCE(ap.bio_short_ja, ap.bio_short_en)
            WHEN 'th' THEN COALESCE(ap.bio_short_th, ap.bio_short_en)
            WHEN 'mn' THEN COALESCE(ap.bio_short_mn, ap.bio_short_en)
            WHEN 'ru' THEN COALESCE(ap.bio_short_ru, ap.bio_short_en)
            ELSE ap.bio_short_en
        END,
        CASE target_locale
            WHEN 'ko' THEN COALESCE(ap.bio_full_ko, ap.bio_full_en)
            WHEN 'en' THEN ap.bio_full_en
            WHEN 'zh-TW' THEN COALESCE(ap.bio_full_zh_tw, ap.bio_full_en)
            WHEN 'zh-CN' THEN COALESCE(ap.bio_full_zh_cn, ap.bio_full_en)
            WHEN 'ja' THEN COALESCE(ap.bio_full_ja, ap.bio_full_en)
            WHEN 'th' THEN COALESCE(ap.bio_full_th, ap.bio_full_en)
            WHEN 'mn' THEN COALESCE(ap.bio_full_mn, ap.bio_full_en)
            WHEN 'ru' THEN COALESCE(ap.bio_full_ru, ap.bio_full_en)
            ELSE ap.bio_full_en
        END,
        ap.certifications,
        ap.preferred_messenger,
        -- Get CTA text for locale
        COALESCE(ap.messenger_cta_text->>target_locale, ap.messenger_cta_text->>'en', 'Contact Us'),
        ap.is_verified,
        ap.is_available,
        ap.is_featured,
        ap.hourly_rate,
        ap.daily_rate,
        ap.location,
        ap.video_url,
        ap.avg_rating,
        ap.review_count,
        ap.total_bookings,
        ap.total_posts,
        ap.display_order
    FROM author_personas ap
    WHERE ap.is_active = TRUE
      AND (
          target_locale = ANY(ap.target_locales) OR
          'en' = ANY(ap.target_locales)  -- English personas available to all locales
      )
    ORDER BY ap.is_featured DESC, ap.display_order ASC, ap.avg_rating DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_interpreters_by_locale(TEXT) TO authenticated;
