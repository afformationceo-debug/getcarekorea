-- Migration: Drop legacy locale columns (Phase 2)
-- RUN THIS ONLY AFTER VERIFYING JSONB DATA IS CORRECT
--
-- To apply this migration:
-- 1. Verify name, description, ai_summary JSONB have correct data for all hospitals
-- 2. Rename this file to remove .pending extension
-- 3. Run supabase db push

-- Step 0: Drop dependent view first
DROP VIEW IF EXISTS hospital_listings;

-- Step 1: Drop legacy name columns
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_en;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_ko;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_zh_tw;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_zh_cn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_ja;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_th;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_mn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS name_ru;

-- Step 2: Drop legacy description columns
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_en;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_ko;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_zh_tw;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_zh_cn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_ja;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_th;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_mn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS description_ru;

-- Step 3: Drop legacy ai_summary columns
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_en;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_ko;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_zh_tw;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_zh_cn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_ja;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_th;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_mn;
ALTER TABLE hospitals DROP COLUMN IF EXISTS ai_summary_ru;

-- Step 4: Recreate indexes with clean names
DROP INDEX IF EXISTS idx_hospitals_name_jsonb_en;
DROP INDEX IF EXISTS idx_hospitals_name_jsonb_ko;
CREATE INDEX IF NOT EXISTS idx_hospitals_name_en ON hospitals ((name->>'en'));
CREATE INDEX IF NOT EXISTS idx_hospitals_name_ko ON hospitals ((name->>'ko'));

-- Step 5: Recreate the hospital_listings view
CREATE OR REPLACE VIEW hospital_listings AS
SELECT
    h.*,
    COALESCE(
        ARRAY(
            SELECT DISTINCT d.name_en
            FROM doctors d
            WHERE d.hospital_id = h.id
            AND d.is_available = true
            LIMIT 5
        ),
        '{}'
    ) AS top_doctors
FROM hospitals h
WHERE h.status = 'published';
