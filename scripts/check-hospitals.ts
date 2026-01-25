import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Count all hospitals
  const { count: totalCount } = await supabase
    .from('hospitals')
    .select('*', { count: 'exact', head: true });

  // Count google_places hospitals
  const { count: gpCount } = await supabase
    .from('hospitals')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'google_places');

  // Get sample hospitals
  const { data } = await supabase
    .from('hospitals')
    .select('name_en, slug, avg_rating, review_count')
    .eq('source', 'google_places')
    .eq('status', 'published')
    .order('review_count', { ascending: false })
    .limit(15);

  console.log('='.repeat(60));
  console.log('HOSPITAL DATABASE STATUS');
  console.log('='.repeat(60));
  console.log(`Total hospitals: ${totalCount}`);
  console.log(`Google Places hospitals: ${gpCount}`);
  console.log('\nTop 15 hospitals by review count:');
  console.log('-'.repeat(60));

  data?.forEach((h, i) => {
    console.log(`${i + 1}. ${h.name_en}`);
    console.log(`   Rating: ${h.avg_rating}★ | Reviews: ${h.review_count}`);
    console.log(`   URL: /en/hospitals/${h.slug}`);
    console.log('');
  });
}

check();
