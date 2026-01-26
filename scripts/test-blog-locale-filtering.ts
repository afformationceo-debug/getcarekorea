/**
 * Test blog locale filtering
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testFiltering() {
  console.log('🧪 Testing Blog Locale Filtering\n');
  console.log('='.repeat(70));

  const locales = ['en', 'ja', 'zh-TW', 'th', 'ko'];

  for (const locale of locales) {
    const { data, error, count } = await supabase
      .from('blog_posts')
      .select('id, slug, title_en, target_locale, target_country, keywords', { count: 'exact' })
      .eq('status', 'published')
      .eq('target_locale', locale)
      .limit(5);

    if (error) {
      console.error(`❌ Error for ${locale}:`, error);
      continue;
    }

    console.log(`\n📍 Locale: ${locale.toUpperCase()}`);
    console.log(`   Total posts: ${count}`);

    if (data && data.length > 0) {
      console.log(`   Sample posts:`);
      data.forEach((post, i) => {
        const keywords = post.keywords ? `[${post.keywords.join(', ')}]` : '[]';
        console.log(`     ${i + 1}. ${post.title_en?.substring(0, 60) || 'Untitled'}...`);
        console.log(`        → target: ${post.target_locale} (${post.target_country}), keywords: ${keywords}`);
      });
    } else {
      console.log(`   ⚠️  No posts found`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Test complete!');
  console.log('\nExpected behavior:');
  console.log('  - EN posts should only appear in EN locale');
  console.log('  - JA posts should only appear in JA locale');
  console.log('  - ZH-TW posts should only appear in ZH-TW locale');
  console.log('  - TH posts should only appear in TH locale');
}

testFiltering();
