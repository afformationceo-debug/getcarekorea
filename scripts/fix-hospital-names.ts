/**
 * Fix hospital names in the database
 * - Remove duplicate words
 * - Remove non-English characters
 * - Update slugs to match English names
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanEnglishName(name: string): string {
  // Remove all non-English characters
  let cleaned = name
    .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')  // Korean
    .replace(/[\u3040-\u309F\u30A0-\u30FF]/g, ' ')  // Japanese
    .replace(/[\u4E00-\u9FFF]/g, ' ')  // Chinese
    .replace(/[\u0400-\u04FF]/g, ' ')  // Cyrillic
    .replace(/[\u0E00-\u0E7F]/g, ' ')  // Thai
    .replace(/[ㅣ|｜\|]/g, ' ')  // Vertical bars
    .replace(/[^\w\s&-]/g, ' ')  // Keep only alphanumeric
    .replace(/\s+/g, ' ')
    .trim();

  // Remove duplicate phrases
  cleaned = cleaned
    .replace(/Plastic Surgery Plastic Surgery/gi, 'Plastic Surgery')
    .replace(/Dermatology Dermatology/gi, 'Dermatology')
    .replace(/Dental Dental/gi, 'Dental')
    .replace(/Eye Eye/gi, 'Eye')
    .replace(/Clinic Clinic/gi, 'Clinic');

  // Remove duplicate words
  const words = cleaned.split(' ').filter(w => w.length > 0);
  const uniqueWords: string[] = [];
  const seenLower = new Set<string>();

  for (const word of words) {
    const lower = word.toLowerCase();
    if (!seenLower.has(lower)) {
      seenLower.add(lower);
      uniqueWords.push(word);
    }
  }

  let result = uniqueWords.join(' ').trim();
  result = result.replace(/^[-&\s]+|[-&\s]+$/g, '').trim();

  // Add Clinic if needed
  if (result && !/(Clinic|Hospital|Center|Surgery)$/i.test(result)) {
    result += ' Clinic';
  }

  return result || 'Seoul Medical Clinic';
}

function generateSlug(englishName: string, placeId: string): string {
  const baseSlug = englishName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);

  const shortId = placeId.substring(0, 8);
  return baseSlug ? `${baseSlug}-${shortId}` : `hospital-${shortId}`;
}

async function fixHospitalNames() {
  console.log('\n🔧 Fixing Hospital Names');
  console.log('='.repeat(60));

  // Get all hospitals from Google Places
  const { data: hospitals, error } = await supabase
    .from('hospitals')
    .select('id, name_en, slug, google_place_id')
    .eq('source', 'google_places');

  if (error) {
    console.error('Error fetching hospitals:', error);
    return;
  }

  console.log(`Found ${hospitals?.length} hospitals to process\n`);

  let updated = 0;
  for (const hospital of hospitals || []) {
    const newName = cleanEnglishName(hospital.name_en || '');
    const newSlug = generateSlug(newName, hospital.google_place_id || 'unknown');

    if (newName !== hospital.name_en || newSlug !== hospital.slug) {
      console.log(`\n${hospital.name_en}`);
      console.log(`  → ${newName}`);
      console.log(`  Slug: ${hospital.slug}`);
      console.log(`  → ${newSlug}`);

      const { error: updateError } = await supabase
        .from('hospitals')
        .update({
          name_en: newName,
          slug: newSlug,
        })
        .eq('id', hospital.id);

      if (updateError) {
        console.log(`  ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`  ✅ Updated`);
        updated++;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Fixed ${updated} hospital names`);
}

fixHospitalNames();
