/**
 * Add locale targeting fields to blog_posts table
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLocaleFields() {
  console.log('🔧 Adding locale targeting fields to blog_posts table...\n');

  const sql = `
-- Add target_locale column (which locale this post is written for)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS target_locale VARCHAR(10);

-- Add target_country column (which country this post targets - US, JP, TW, etc.)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS target_country VARCHAR(10);

-- Add keywords column (array of SEO keywords)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Create index for faster filtering by target_locale
CREATE INDEX IF NOT EXISTS idx_blog_posts_target_locale
ON blog_posts(target_locale);

-- Create index for combined filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_status
ON blog_posts(target_locale, status)
WHERE status = 'published';

-- Update existing posts to have default locale (if any exist)
UPDATE blog_posts
SET target_locale = 'en', target_country = 'US'
WHERE target_locale IS NULL;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative approach - update via HTTP
      console.log('RPC method not available, using HTTP API...');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ sql_query: sql }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${await response.text()}`);
      }

      console.log('✅ Successfully added locale fields via HTTP');
    } else {
      console.log('✅ Successfully added locale fields');
      console.log('Result:', data);
    }

    // Verify the changes
    console.log('\n📊 Verifying schema changes...');
    const { data: testData, error: testError } = await supabase
      .from('blog_posts')
      .select('id, target_locale, target_country, keywords')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError);
      console.log('\n⚠️  The columns may not have been added. Please add them manually in Supabase Dashboard:');
      console.log('   1. Go to Table Editor > blog_posts');
      console.log('   2. Add columns:');
      console.log('      - target_locale (text)');
      console.log('      - target_country (text)');
      console.log('      - keywords (text[])');
    } else {
      console.log('✅ Schema verification successful');
      console.log('Sample data:', testData);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Please add the columns manually in Supabase Dashboard:');
    console.log('   1. Go to Table Editor > blog_posts');
    console.log('   2. Add columns:');
    console.log('      - target_locale (text, nullable)');
    console.log('      - target_country (text, nullable)');
    console.log('      - keywords (text[], nullable)');
    console.log('\n   Then run: npm run tsx scripts/generate-interpreter-blog-posts.ts');
  }
}

addLocaleFields().catch(console.error);
