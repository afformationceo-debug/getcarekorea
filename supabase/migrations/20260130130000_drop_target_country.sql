-- Migration: Drop target_country column
-- Reason: locale field is sufficient for geo-targeting (1:1 mapping with countries)

-- Drop the column
ALTER TABLE blog_posts DROP COLUMN IF EXISTS target_country;

-- Drop related index if exists
DROP INDEX IF EXISTS idx_blog_posts_target_country;
