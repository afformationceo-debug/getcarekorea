-- Migration: Simplify blog_posts schema
-- Remove locale-specific columns, use single title/content/excerpt with locale field
-- Store SEO meta in JSONB format

-- =====================================================
-- STEP 1: Add new columns
-- =====================================================

-- Add locale column (indicates which language the content is in)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en';

-- Add single title, content, excerpt columns
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS content TEXT;

-- Add SEO meta as JSONB (meta_title, meta_description)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_meta JSONB DEFAULT '{}';

-- =====================================================
-- STEP 2: Migrate existing data
-- =====================================================

-- Migrate data from locale-specific columns to new columns
-- Priority: Check generation_metadata.locale first, then use first non-null locale field

UPDATE blog_posts
SET
  locale = COALESCE(
    (generation_metadata->>'locale')::TEXT,
    CASE
      WHEN title_ko IS NOT NULL AND title_ko != '' THEN 'ko'
      WHEN title_ja IS NOT NULL AND title_ja != '' THEN 'ja'
      WHEN title_zh_tw IS NOT NULL AND title_zh_tw != '' THEN 'zh-TW'
      WHEN title_zh_cn IS NOT NULL AND title_zh_cn != '' THEN 'zh-CN'
      WHEN title_th IS NOT NULL AND title_th != '' THEN 'th'
      WHEN title_mn IS NOT NULL AND title_mn != '' THEN 'mn'
      WHEN title_ru IS NOT NULL AND title_ru != '' THEN 'ru'
      ELSE 'en'
    END
  ),
  title = COALESCE(
    title_ko, title_ja, title_zh_tw, title_zh_cn, title_th, title_mn, title_ru, title_en
  ),
  excerpt = COALESCE(
    excerpt_ko, excerpt_ja, excerpt_zh_tw, excerpt_zh_cn, excerpt_th, excerpt_mn, excerpt_ru, excerpt_en
  ),
  content = COALESCE(
    content_ko, content_ja, content_zh_tw, content_zh_cn, content_th, content_mn, content_ru, content_en
  ),
  seo_meta = jsonb_build_object(
    'meta_title', COALESCE(
      meta_title_ko, meta_title_ja, meta_title_zh_tw, meta_title_zh_cn,
      meta_title_th, meta_title_mn, meta_title_ru, meta_title_en
    ),
    'meta_description', COALESCE(
      meta_description_ko, meta_description_ja, meta_description_zh_tw, meta_description_zh_cn,
      meta_description_th, meta_description_mn, meta_description_ru, meta_description_en
    )
  )
WHERE title IS NULL OR title = '';

-- =====================================================
-- STEP 3: Make title NOT NULL (after migration)
-- =====================================================

-- Set default for any remaining NULL titles
UPDATE blog_posts SET title = slug WHERE title IS NULL OR title = '';

-- Now make title NOT NULL
ALTER TABLE blog_posts ALTER COLUMN title SET NOT NULL;

-- =====================================================
-- STEP 4: Create indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON blog_posts(locale);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title ON blog_posts(title);

-- Full-text search index on new columns
DROP INDEX IF EXISTS blog_posts_search_en;
CREATE INDEX blog_posts_search_idx ON blog_posts USING gin(
  to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(excerpt, '') || ' ' || COALESCE(content, ''))
);

-- =====================================================
-- STEP 5: Drop old locale-specific columns
-- =====================================================

-- Drop title columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_ko;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_ja;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_zh_tw;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_zh_cn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_th;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_mn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS title_ru;

-- Drop excerpt columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_ko;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_ja;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_zh_tw;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_zh_cn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_th;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_mn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS excerpt_ru;

-- Drop content columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_ko;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_ja;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_zh_tw;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_zh_cn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_th;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_mn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_ru;

-- Drop meta_title columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_ko;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_ja;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_zh_tw;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_zh_cn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_th;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_mn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_title_ru;

-- Drop meta_description columns
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_en;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_ko;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_ja;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_zh_tw;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_zh_cn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_th;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_mn;
ALTER TABLE blog_posts DROP COLUMN IF EXISTS meta_description_ru;

-- Drop legacy author_id (use author_persona_id instead)
ALTER TABLE blog_posts DROP COLUMN IF EXISTS author_id;

-- =====================================================
-- STEP 6: Add comments
-- =====================================================

COMMENT ON COLUMN blog_posts.locale IS 'Language code of the content (en, ko, ja, zh-CN, zh-TW, th, mn, ru)';
COMMENT ON COLUMN blog_posts.title IS 'Post title in the specified locale';
COMMENT ON COLUMN blog_posts.excerpt IS 'Post excerpt/summary in the specified locale';
COMMENT ON COLUMN blog_posts.content IS 'Post HTML content in the specified locale';
COMMENT ON COLUMN blog_posts.seo_meta IS 'SEO metadata: {meta_title, meta_description}';
COMMENT ON COLUMN blog_posts.author_persona_id IS 'Reference to author_personas table (interpreter)';
COMMENT ON COLUMN blog_posts.generation_metadata IS 'AI generation metadata: keyword, cost, images, faq, etc.';
