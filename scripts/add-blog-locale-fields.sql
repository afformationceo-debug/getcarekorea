-- Add locale targeting fields to blog_posts table
-- This enables locale-specific blog post filtering for SEO

-- Add target_locale column (which locale this post is written for)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS target_locale VARCHAR(10);

-- Add target_country column (which country this post targets - US, JP, TW, etc.)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS target_country VARCHAR(10);

-- Add keywords column (array of SEO keywords)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Create index for faster filtering by target_locale
CREATE INDEX IF NOT EXISTS idx_blog_posts_target_locale
ON blog_posts(target_locale);

-- Create index for combined filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_status
ON blog_posts(target_locale, status)
WHERE status = 'published';

-- Update existing posts to have default locale (if any exist)
UPDATE blog_posts
SET target_locale = 'en', target_country = 'US'
WHERE target_locale IS NULL;

COMMENT ON COLUMN blog_posts.target_locale IS 'Target locale for this blog post (en, ko, ja, zh-TW, zh-CN, th, mn, ru)';
COMMENT ON COLUMN blog_posts.target_country IS 'Target country code (US, KR, JP, TW, CN, TH, MN, RU)';
COMMENT ON COLUMN blog_posts.keywords IS 'Array of SEO keywords this post targets';
