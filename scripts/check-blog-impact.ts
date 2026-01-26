import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkImpact() {
  console.log('🔍 Checking existing blog posts...\n');

  const { data: posts, error, count } = await supabase
    .from('blog_posts')
    .select('id, slug, title_en, status, published_at', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total blog posts: ${count || 0}`);

  if (count && count > 0) {
    console.log('\n⚠️  IMPACT ANALYSIS:');
    console.log('━'.repeat(60));
    console.log(`📊 Found ${count} existing blog posts`);
    console.log('\n❌ PROBLEM if we DON\'T include the UPDATE:');
    console.log('   - Existing posts have target_locale = NULL');
    console.log('   - API filters by: .eq("target_locale", locale)');
    console.log('   - Result: ALL EXISTING POSTS WILL BE HIDDEN');
    console.log('\n✅ SOLUTION in the SQL (already included):');
    console.log('   UPDATE blog_posts SET target_locale = "en", target_country = "US"');
    console.log('   WHERE target_locale IS NULL;');
    console.log('   → This makes all existing posts visible in English locale');
    console.log('\n📝 Sample existing posts:');
    posts?.forEach(p => console.log(`   - ${p.title_en || 'Untitled'} (${p.status})`));
    console.log('\n✅ CONCLUSION: Safe to run the SQL (includes UPDATE to fix existing posts)');
  } else {
    console.log('\n✅ NO IMPACT: No existing blog posts found');
    console.log('   Safe to add columns and filters');
  }
}

checkImpact();
