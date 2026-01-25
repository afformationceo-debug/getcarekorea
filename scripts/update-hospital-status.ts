import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateStatus() {
  const { data, error } = await supabase
    .from('hospitals')
    .update({ status: 'published' })
    .eq('status', 'draft')
    .eq('source', 'google_places')
    .select('id, slug, name_en, name_ko');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated to published:', data?.length, 'hospitals');
    data?.forEach(h => {
      console.log('  -', h.name_en || h.name_ko, '→', h.slug);
    });
  }
}

updateStatus();
