-- Migration: 008_add_korean_locale_fields
-- Description: Add Korean locale fields to blog_posts table
-- Created: 2026-01-22

-- ============================================
-- ADD KOREAN LOCALE FIELDS TO blog_posts
-- ============================================

-- Title
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_ko TEXT;

-- Excerpt
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_ko TEXT;

-- Content
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content_ko TEXT;

-- Meta Title
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title_ko TEXT;

-- Meta Description
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description_ko TEXT;

-- ============================================
-- ADD INDEX FOR KOREAN CONTENT SEARCH
-- ============================================

-- Full text search index for Korean blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_search_ko ON blog_posts USING GIN(
    to_tsvector('simple', COALESCE(title_ko, '') || ' ' || COALESCE(excerpt_ko, '') || ' ' || COALESCE(content_ko, ''))
);

-- ============================================
-- UPDATE VIEW IF EXISTS
-- ============================================

-- Note: Views that reference blog_posts will automatically include new columns
-- No additional changes needed for existing views

COMMENT ON COLUMN blog_posts.title_ko IS 'Korean title for blog post';
COMMENT ON COLUMN blog_posts.excerpt_ko IS 'Korean excerpt for blog post';
COMMENT ON COLUMN blog_posts.content_ko IS 'Korean content for blog post';
COMMENT ON COLUMN blog_posts.meta_title_ko IS 'Korean meta title for SEO';
COMMENT ON COLUMN blog_posts.meta_description_ko IS 'Korean meta description for SEO';
