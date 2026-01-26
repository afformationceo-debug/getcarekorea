import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getLatestBlog() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title_en, title_zh_tw, target_locale, target_country, keywords, created_at')
    .eq('target_locale', 'zh-TW')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    const post = data[0];
    const url = `https://getcarekorea.com/zh-TW/blog/${post.slug}`;

    console.log('\n📝 생성된 대만 블로그:');
    console.log('━'.repeat(70));
    console.log(`제목 (EN): ${post.title_en}`);
    console.log(`제목 (ZH-TW): ${post.title_zh_tw || '번역 중 오류 발생 - 영어 버전 사용'}`);
    console.log(`키워드: ${post.keywords?.join(', ')}`);
    console.log(`타겟: ${post.target_locale} (${post.target_country})`);
    console.log(`생성 시간: ${post.created_at}`);
    console.log(`\n🔗 URL: ${url}`);
    console.log('\n✅ 이 링크는 zh-TW 로케일에서만 표시됩니다!');
  } else {
    console.log('블로그를 찾을 수 없습니다.');
  }
}

getLatestBlog();
