-- Migration: Extend seo_meta JSONB structure
-- Add comprehensive SEO fields to seo_meta column
--
-- seo_meta JSONB structure:
-- {
--   "meta_title": "Page Title for Search Results",
--   "meta_description": "Page description for search results",
--   "meta_keywords": "keyword1, keyword2, keyword3",
--   "meta_author": "Author Name",
--   "canonical_url": "https://example.com/page",
--   "robots": "index, follow",
--   "og_title": "Open Graph Title",
--   "og_description": "Open Graph Description",
--   "og_image": "https://example.com/og-image.jpg",
--   "og_type": "article",
--   "twitter_card": "summary_large_image",
--   "twitter_title": "Twitter Card Title",
--   "twitter_description": "Twitter Card Description",
--   "twitter_image": "https://example.com/twitter-image.jpg"
-- }

-- Update existing rows to have complete seo_meta structure
-- Only update if seo_meta is empty or has minimal fields
UPDATE blog_posts
SET seo_meta = jsonb_build_object(
  'meta_title', COALESCE(seo_meta->>'meta_title', title),
  'meta_description', COALESCE(seo_meta->>'meta_description', excerpt),
  'meta_keywords', COALESCE(seo_meta->>'meta_keywords', array_to_string(tags, ', ')),
  'meta_author', COALESCE(seo_meta->>'meta_author', 'GetCareKorea'),
  'robots', COALESCE(seo_meta->>'robots', 'index, follow'),
  'og_title', COALESCE(seo_meta->>'og_title', seo_meta->>'meta_title', title),
  'og_description', COALESCE(seo_meta->>'og_description', seo_meta->>'meta_description', excerpt),
  'og_image', COALESCE(seo_meta->>'og_image', cover_image_url),
  'og_type', COALESCE(seo_meta->>'og_type', 'article'),
  'twitter_card', COALESCE(seo_meta->>'twitter_card', 'summary_large_image'),
  'twitter_title', COALESCE(seo_meta->>'twitter_title', seo_meta->>'meta_title', title),
  'twitter_description', COALESCE(seo_meta->>'twitter_description', seo_meta->>'meta_description', excerpt),
  'twitter_image', COALESCE(seo_meta->>'twitter_image', seo_meta->>'og_image', cover_image_url)
)
WHERE seo_meta IS NULL
   OR seo_meta = '{}'::jsonb
   OR NOT (seo_meta ? 'meta_keywords');

-- Add comment describing the full structure
COMMENT ON COLUMN blog_posts.seo_meta IS 'SEO metadata JSONB: {meta_title, meta_description, meta_keywords, meta_author, canonical_url, robots, og_title, og_description, og_image, og_type, twitter_card, twitter_title, twitter_description, twitter_image}';
