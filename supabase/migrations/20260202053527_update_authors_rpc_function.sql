-- Update the RPC function to include all fields needed for content generation

DROP FUNCTION IF EXISTS get_authors_with_post_counts();

CREATE OR REPLACE FUNCTION get_authors_with_post_counts()
RETURNS TABLE (
    id UUID,
    slug TEXT,
    name JSONB,
    bio_short JSONB,
    bio_full JSONB,
    languages JSONB,
    primary_specialty TEXT,
    secondary_specialties TEXT[],
    years_of_experience INTEGER,
    certifications JSONB,
    is_active BOOLEAN,
    is_verified BOOLEAN,
    post_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ap.id,
        ap.slug,
        ap.name,
        ap.bio_short,
        ap.bio_full,
        ap.languages,
        ap.primary_specialty,
        ap.secondary_specialties,
        ap.years_of_experience,
        ap.certifications,
        ap.is_active,
        ap.is_verified,
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
