-- Drop unused total_views column from author_personas
-- This column was never used in the application

-- Step 1: Drop the view that depends on the column
DROP VIEW IF EXISTS interpreter_profiles;

-- Step 2: Drop the column
ALTER TABLE author_personas DROP COLUMN IF EXISTS total_views;

-- Step 3: Recreate the view without total_views
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
    ap.display_order,
    ap.created_at,
    ap.updated_at
FROM author_personas ap
WHERE ap.is_active = TRUE;

GRANT SELECT ON interpreter_profiles TO anon;
GRANT SELECT ON interpreter_profiles TO authenticated;
