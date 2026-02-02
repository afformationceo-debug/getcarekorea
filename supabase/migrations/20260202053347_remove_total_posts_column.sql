-- Remove total_posts column from author_personas
-- Post counts will be calculated dynamically from blog_posts table

-- Step 1: Drop the view that depends on the column
DROP VIEW IF EXISTS interpreter_profiles;

-- Step 2: Drop the column
ALTER TABLE author_personas DROP COLUMN IF EXISTS total_posts;

-- Step 3: Recreate the view without total_posts
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
    ap.display_order,
    ap.created_at,
    ap.updated_at
FROM author_personas ap
WHERE ap.is_active = TRUE;

GRANT SELECT ON interpreter_profiles TO anon;
GRANT SELECT ON interpreter_profiles TO authenticated;

-- Step 4: Create a function to get post count for an author
CREATE OR REPLACE FUNCTION get_author_post_count(author_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM blog_posts
        WHERE author_persona_id = author_id
        AND status = 'published'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_author_post_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_author_post_count(UUID) TO authenticated;

-- Step 5: Create a function to get all authors with their post counts
CREATE OR REPLACE FUNCTION get_authors_with_post_counts()
RETURNS TABLE (
    id UUID,
    slug TEXT,
    name JSONB,
    languages JSONB,
    primary_specialty TEXT,
    secondary_specialties TEXT[],
    is_active BOOLEAN,
    post_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.id,
        ap.slug,
        ap.name,
        ap.languages,
        ap.primary_specialty,
        ap.secondary_specialties,
        ap.is_active,
        COALESCE((
            SELECT COUNT(*)::INTEGER
            FROM blog_posts bp
            WHERE bp.author_persona_id = ap.id
            AND bp.status = 'published'
        ), 0) as post_count
    FROM author_personas ap
    WHERE ap.is_active = TRUE
    ORDER BY post_count ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_authors_with_post_counts() TO anon;
GRANT EXECUTE ON FUNCTION get_authors_with_post_counts() TO authenticated;
