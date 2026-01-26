import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBlogContent() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title_en, content_en, cover_image_url')
    .eq('slug', '2026-1769448343055')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('📝 블로그 내용 검증\n');
  console.log('='.repeat(80));

  // 1. 이미지 확인
  console.log('\n1. 이미지 확인:');
  console.log(`   Featured Image: ${data.cover_image_url || '❌ 없음'}`);

  // 2. Content 구조 확인
  const content = data.content_en || '';
  console.log('\n2. 콘텐츠 구조 확인:');
  console.log(`   전체 길이: ${content.length} 자`);

  // H2 태그 찾기
  const h2Matches = content.match(/^## .+$/gm);
  console.log(`\n   H2 태그 (##): ${h2Matches ? h2Matches.length : 0}개`);
  if (h2Matches) {
    h2Matches.forEach((h, i) => console.log(`      ${i + 1}. ${h}`));
  }

  // 표 찾기
  const tableMatches = content.match(/\|.+\|/g);
  console.log(`\n   표 (|): ${tableMatches ? tableMatches.length : 0}줄`);

  // FAQ 찾기
  const hasFAQ = content.toLowerCase().includes('faq') || content.includes('자주 묻는 질문');
  console.log(`\n   FAQ 섹션: ${hasFAQ ? '✅ 있음' : '❌ 없음'}`);

  // Bold 확인
  const boldMatches = content.match(/\*\*.+?\*\*/g);
  console.log(`\n   Bold (**): ${boldMatches ? boldMatches.length : 0}개`);

  // Bullet points 확인
  const bulletMatches = content.match(/^- .+$/gm);
  console.log(`\n   Bullet points (-): ${bulletMatches ? bulletMatches.length : 0}개`);

  // 내용 샘플 저장
  console.log('\n3. 내용 샘플 (처음 500자):');
  console.log('─'.repeat(80));
  console.log(content.substring(0, 500));
  console.log('─'.repeat(80));

  // 전체 내용 파일로 저장
  fs.writeFileSync('/tmp/blog-content-full.md', content);
  console.log('\n✅ 전체 내용이 /tmp/blog-content-full.md 에 저장되었습니다.');
  console.log('   확인: cat /tmp/blog-content-full.md');
}

checkBlogContent();
