-- GetCareKorea Database Migration
-- 013: Google Places Integration Fields
-- Created: 2026-01-25
-- Purpose: Add Google Places data fields for hospital crawling

-- ============================================
-- PART 1: Add Google Places fields to hospitals
-- ============================================

-- Google Place ID (unique identifier)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;

-- Google Maps URL
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

-- Coordinates
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Google Photos array (store up to 10 image URLs)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_photos TEXT[];

-- Opening hours array
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS opening_hours TEXT[];

-- Category for filtering
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Source of data (manual, google_places, etc.)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- When the data was last crawled
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMPTZ;

-- AI-generated summary
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ru TEXT;

-- SEO fields for each language
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ru TEXT;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ru TEXT;

-- ============================================
-- PART 2: Create indexes for performance
-- ============================================

-- Index for Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON hospitals(google_place_id) WHERE google_place_id IS NOT NULL;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_hospitals_category ON hospitals(category);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_hospitals_source ON hospitals(source);

-- Index for coordinates (for map queries)
CREATE INDEX IF NOT EXISTS idx_hospitals_coordinates ON hospitals(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for city + category combination
CREATE INDEX IF NOT EXISTS idx_hospitals_city_category ON hospitals(city, category);

-- ============================================
-- PART 3: Create hospital_reviews table for future use
-- ============================================

CREATE TABLE IF NOT EXISTS hospital_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    google_review_id TEXT,
    author_name TEXT,
    author_photo_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    text_original TEXT,
    text_translated_en TEXT,
    published_at TIMESTAMPTZ,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id, google_review_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_reviews_hospital ON hospital_reviews(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_reviews_rating ON hospital_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_hospital_reviews_featured ON hospital_reviews(is_featured) WHERE is_featured = TRUE;

-- ============================================
-- PART 4: Grant permissions
-- ============================================

-- Reviews table permissions
GRANT SELECT ON hospital_reviews TO anon;
GRANT SELECT ON hospital_reviews TO authenticated;
GRANT ALL ON hospital_reviews TO service_role;

-- ============================================
-- PART 5: Enable RLS for hospital_reviews
-- ============================================

ALTER TABLE hospital_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hospital_reviews_read_policy" ON hospital_reviews
    FOR SELECT USING (true);

CREATE POLICY "hospital_reviews_write_policy" ON hospital_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'hospital_admin')
        )
    );

-- ============================================
-- PART 6: Update existing hospitals with category
-- ============================================

-- Categorize existing hospitals based on specialties
UPDATE hospitals SET category = 'plastic-surgery'
WHERE specialties @> ARRAY['Plastic Surgery'] AND category IS NULL;

UPDATE hospitals SET category = 'dermatology'
WHERE specialties @> ARRAY['Dermatology'] AND category IS NULL;

UPDATE hospitals SET category = 'dental'
WHERE specialties @> ARRAY['Dental'] AND category IS NULL;

UPDATE hospitals SET category = 'ophthalmology'
WHERE specialties @> ARRAY['Ophthalmology'] AND category IS NULL;

UPDATE hospitals SET category = 'health-checkup'
WHERE specialties @> ARRAY['Health Checkup'] AND category IS NULL;

UPDATE hospitals SET category = 'fertility'
WHERE specialties @> ARRAY['Fertility'] AND category IS NULL;

UPDATE hospitals SET category = 'hair-transplant'
WHERE specialties @> ARRAY['Hair Transplant'] AND category IS NULL;

UPDATE hospitals SET category = 'orthopedics'
WHERE specialties @> ARRAY['Orthopedics'] AND category IS NULL;

-- Set default for any remaining
UPDATE hospitals SET category = 'general' WHERE category IS NULL;

-- Set source for existing manual entries
UPDATE hospitals SET source = 'manual' WHERE source IS NULL;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
