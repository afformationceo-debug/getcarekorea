-- Migration: Remove unused columns from content_keywords table
-- These columns are not being used in the application

ALTER TABLE content_keywords DROP COLUMN IF EXISTS keyword_ko;
ALTER TABLE content_keywords DROP COLUMN IF EXISTS keyword_native;
ALTER TABLE content_keywords DROP COLUMN IF EXISTS target_locale;
ALTER TABLE content_keywords DROP COLUMN IF EXISTS generation_queue_order;

-- Drop associated indexes
DROP INDEX IF EXISTS idx_content_keywords_target_locale;
DROP INDEX IF EXISTS idx_content_keywords_queue_order;
