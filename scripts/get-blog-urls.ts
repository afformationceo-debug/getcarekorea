import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getBlogUrls() {
  console.log('📋 Newly Generated Blog Post URLs\n');
  console.log('='.repeat(80));

  const locales = [
    { code: 'en', name: 'English 🇺🇸', keywords: ['best plastic surgery korea', 'korean medical tourism', 'medical tourism seoul'] },
    { code: 'ja', name: 'Japanese 🇯🇵', keywords: ['韓国美容整形'] },
    { code: 'zh-TW', name: 'Taiwan 🇹🇼', keywords: ['韓國整形'] },
    { code: 'th', name: 'Thai 🇹🇭', keywords: ['ศัลยกรรมเกาหลี'] },
  ];

  for (const locale of locales) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, title_en, keywords, published_at')
      .eq('status', 'published')
      .eq('target_locale', locale.code)
      .order('published_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(`Error for ${locale.code}:`, error);
      continue;
    }

    console.log(`\n${locale.name}`);
    console.log('─'.repeat(80));

    if (data && data.length > 0) {
      const recentPosts = data.filter(post =>
        post.keywords && post.keywords.some(kw => locale.keywords.includes(kw))
      );

      if (recentPosts.length === 0) {
        console.log('   ⚠️  No recently generated posts with target keywords');
        continue;
      }

      recentPosts.forEach((post) => {
        const url = `https://getcarekorea.com/${locale.code}/blog/${post.slug}`;
        const title = post.title_en ? post.title_en.substring(0, 70) : 'Untitled';
        console.log(`\n📄 ${title}...`);
        console.log(`   🔗 ${url}`);
        console.log(`   🏷️  Keywords: ${post.keywords?.join(', ') || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️  No posts found');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ All URLs generated!');
  console.log('\n💡 Test these URLs in different locales to verify filtering works correctly.');
}

getBlogUrls();
