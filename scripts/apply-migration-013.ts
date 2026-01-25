/**
 * Apply Migration 013: Google Places Fields
 *
 * Run: npx tsx scripts/apply-migration-013.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyMigration() {
  console.log('🔄 Applying Migration 013: Google Places Fields...\n');

  // We need to use raw SQL through Supabase
  // Since we can't run raw SQL directly, let's check if columns exist by trying to query

  try {
    // Test if category column exists by querying
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name_ko, category, source, google_place_id')
      .limit(1);

    if (error) {
      if (error.message.includes('category') || error.message.includes('column')) {
        console.log('❌ Migration 013 columns are NOT applied yet.');
        console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/ntvweeufyjafarxiyluo/sql/new\n');
        console.log('='.repeat(60));
        console.log(`
-- Migration 013: Google Places Fields (PART 1 - Core Fields)

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_photos TEXT[];
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS opening_hours TEXT[];
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS crawled_at TIMESTAMPTZ;

-- AI Summary fields
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS ai_summary_ru TEXT;

-- SEO Meta fields
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_title_ru TEXT;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ko TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ja TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_zh_cn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_zh_tw TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_th TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_mn TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meta_description_ru TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_google_place_id ON hospitals(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hospitals_category ON hospitals(category);
CREATE INDEX IF NOT EXISTS idx_hospitals_source ON hospitals(source);
CREATE INDEX IF NOT EXISTS idx_hospitals_coordinates ON hospitals(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hospitals_city_category ON hospitals(city, category);
`);
        console.log('='.repeat(60));
      } else {
        console.error('❌ Error:', error.message);
      }
    } else {
      console.log('✅ Migration 013 columns are already applied!');
      console.log('   Sample data:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

applyMigration();
