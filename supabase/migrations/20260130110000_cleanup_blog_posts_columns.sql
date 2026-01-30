-- Migration: Cleanup blog_posts columns
-- Remove any orphaned columns that shouldn't exist
-- The simplified schema should only have:
-- - title, excerpt, content, locale, seo_meta (JSONB)
-- - NOT separate meta_description, meta_title, keywords, target_locale columns

-- Drop orphaned columns if they exist
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS keywords;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS target_locale;

-- Ensure seo_meta has default value
ALTER TABLE blog_posts ALTER COLUMN seo_meta SET DEFAULT '{}';

-- Verify tags column exists (this is the correct column for keywords/tags)
-- tags TEXT[] is already in the schema

COMMENT ON COLUMN blog_posts.seo_meta IS 'SEO metadata JSONB: {meta_title: string, meta_description: string}';
COMMENT ON COLUMN blog_posts.tags IS 'Array of tag strings for categorization';
