/**
 * Reset Keywords & Content Script
 *
 * 모든 키워드와 생성된 콘텐츠를 삭제합니다.
 * 사용: npx tsx scripts/reset-keywords-content.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAll() {
  console.log('🗑️  Starting reset process...\n');

  // 1. Check current counts
  const { count: keywordCount } = await supabase
    .from('content_keywords')
    .select('*', { count: 'exact', head: true });

  const { count: blogCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Current data:`);
  console.log(`   - Keywords: ${keywordCount || 0}`);
  console.log(`   - Blog Posts: ${blogCount || 0}`);
  console.log('');

  // 2. Delete blog_posts first (due to foreign key)
  if (blogCount && blogCount > 0) {
    console.log('🗑️  Deleting blog posts...');
    const { error: blogError } = await supabase
      .from('blog_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (blogError) {
      console.error('Error deleting blog posts:', blogError.message);
    } else {
      console.log(`   ✅ Deleted ${blogCount} blog posts`);
    }
  }

  // 3. Delete keywords
  if (keywordCount && keywordCount > 0) {
    console.log('🗑️  Deleting keywords...');
    const { error: keywordError } = await supabase
      .from('content_keywords')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (keywordError) {
      console.error('Error deleting keywords:', keywordError.message);
    } else {
      console.log(`   ✅ Deleted ${keywordCount} keywords`);
    }
  }

  // 4. Verify deletion
  const { count: finalKeywordCount } = await supabase
    .from('content_keywords')
    .select('*', { count: 'exact', head: true });

  const { count: finalBlogCount } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Final counts:');
  console.log(`   - Keywords: ${finalKeywordCount || 0}`);
  console.log(`   - Blog Posts: ${finalBlogCount || 0}`);
  console.log('\n✅ Reset complete!');
}

resetAll().catch(console.error);
