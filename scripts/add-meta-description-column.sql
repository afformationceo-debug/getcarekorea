-- Add meta_description column to blog_posts table
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS meta_description TEXT;

COMMENT ON COLUMN blog_posts.meta_description IS 'SEO meta description (150-160 characters)';
