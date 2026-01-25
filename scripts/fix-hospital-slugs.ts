/**
 * Fix Hospital Slugs - Remove Korean characters from slugs
 * Run: npx tsx scripts/fix-hospital-slugs.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug(name: string, placeId: string): string {
  // Remove Korean characters for URL-safe slugs
  const cleanName = name
    .toLowerCase()
    .replace(/[가-힣]/g, '')  // Remove Korean characters
    .replace(/[^a-z0-9\s-]/g, '')  // Keep only alphanumeric
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

  // Add place ID suffix for uniqueness
  const suffix = placeId.substring(0, 8);
  return cleanName ? `${cleanName}-${suffix}` : `hospital-${suffix}`;
}

async function fixSlugs() {
  console.log('🔧 Fixing hospital slugs...\n');

  // Get all hospitals with google_place_id (crawled hospitals)
  const { data: hospitals, error } = await supabase
    .from('hospitals')
    .select('id, slug, name_ko, name_en, google_place_id')
    .not('google_place_id', 'is', null);

  if (error) {
    console.error('Error fetching hospitals:', error);
    return;
  }

  console.log(`Found ${hospitals?.length || 0} crawled hospitals\n`);

  for (const hospital of hospitals || []) {
    const name = hospital.name_en || hospital.name_ko || 'hospital';
    const newSlug = generateSlug(name, hospital.google_place_id);

    if (newSlug !== hospital.slug) {
      console.log(`📝 ${hospital.name_ko || hospital.name_en}`);
      console.log(`   Old: ${hospital.slug}`);
      console.log(`   New: ${newSlug}`);

      const { error: updateError } = await supabase
        .from('hospitals')
        .update({ slug: newSlug })
        .eq('id', hospital.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated`);
      }
      console.log('');
    }
  }

  console.log('✅ Done!');
}

fixSlugs();
