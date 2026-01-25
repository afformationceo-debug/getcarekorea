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

async function addGoogleReviewsColumn() {
  console.log('Checking if google_reviews column exists...');

  // First check if column already exists by trying to select it
  const { error: checkError } = await supabase
    .from('hospitals')
    .select('google_reviews')
    .limit(1);

  if (!checkError) {
    console.log('✅ Column google_reviews already exists!');
    return;
  }

  console.log('❌ Column does not exist. Error:', checkError.message);
  console.log('\n📝 Please run this SQL in Supabase Dashboard:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS google_reviews JSONB DEFAULT '[]'::jsonb;`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔗 Go to: Supabase Dashboard > SQL Editor > New Query');
}

addGoogleReviewsColumn();
