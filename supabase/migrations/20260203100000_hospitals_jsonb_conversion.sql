-- Migration: Add JSONB columns for multilingual fields (Phase 1)
-- This migration adds JSONB columns while keeping existing locale columns
-- Old columns will be dropped in a future migration after verification

-- Step 1: Add new JSONB columns for name, description, ai_summary
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS name JSONB;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS description JSONB;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary JSONB;

-- Step 2: Migrate existing data to JSONB format
UPDATE hospitals SET
  name = jsonb_build_object(
    'en', COALESCE(name_en, ''),
    'ko', COALESCE(name_ko, ''),
    'zh-TW', COALESCE(name_zh_tw, ''),
    'zh-CN', COALESCE(name_zh_cn, ''),
    'ja', COALESCE(name_ja, ''),
    'th', COALESCE(name_th, ''),
    'mn', COALESCE(name_mn, ''),
    'ru', COALESCE(name_ru, '')
  ),
  description = jsonb_build_object(
    'en', COALESCE(description_en, ''),
    'ko', COALESCE(description_ko, ''),
    'zh-TW', COALESCE(description_zh_tw, ''),
    'zh-CN', COALESCE(description_zh_cn, ''),
    'ja', COALESCE(description_ja, ''),
    'th', COALESCE(description_th, ''),
    'mn', COALESCE(description_mn, ''),
    'ru', COALESCE(description_ru, '')
  ),
  ai_summary = jsonb_build_object(
    'en', COALESCE(ai_summary_en, ''),
    'ko', COALESCE(ai_summary_ko, ''),
    'zh-TW', COALESCE(ai_summary_zh_tw, ''),
    'zh-CN', COALESCE(ai_summary_zh_cn, ''),
    'ja', COALESCE(ai_summary_ja, ''),
    'th', COALESCE(ai_summary_th, ''),
    'mn', COALESCE(ai_summary_mn, ''),
    'ru', COALESCE(ai_summary_ru, '')
  );

-- Step 3: Set NOT NULL constraint on name (required field)
UPDATE hospitals SET name = '{"en": ""}'::jsonb WHERE name IS NULL;
ALTER TABLE hospitals ALTER COLUMN name SET NOT NULL;
ALTER TABLE hospitals ALTER COLUMN name SET DEFAULT '{}'::jsonb;

-- Step 4: Set default for description and ai_summary
ALTER TABLE hospitals ALTER COLUMN description SET DEFAULT '{}'::jsonb;
ALTER TABLE hospitals ALTER COLUMN ai_summary SET DEFAULT '{}'::jsonb;

-- Step 5: Create index for faster locale lookups
CREATE INDEX IF NOT EXISTS idx_hospitals_name_jsonb_en ON hospitals ((name->>'en'));
CREATE INDEX IF NOT EXISTS idx_hospitals_name_jsonb_ko ON hospitals ((name->>'ko'));

-- Step 6: Drop empty meta columns (no data in these)
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_en;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_ko;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_zh_tw;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_zh_cn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_ja;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_th;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_mn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_title_ru;

ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_en;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_ko;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_zh_tw;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_zh_cn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_ja;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_th;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_mn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS meta_description_ru;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN hospitals.name IS 'Multilingual name as JSONB: {"en": "...", "ko": "...", "zh-TW": "...", ...}';
COMMENT ON COLUMN hospitals.description IS 'Multilingual description as JSONB: {"en": "...", "ko": "...", "zh-TW": "...", ...}';
COMMENT ON COLUMN hospitals.ai_summary IS 'AI-generated summary as JSONB: {"en": "...", "ko": "...", ...}';

-- NOTE: Old locale columns (name_en, name_ko, etc.) are kept for backward compatibility
-- Run Phase 2 migration to drop them after verifying JSONB data is correct
