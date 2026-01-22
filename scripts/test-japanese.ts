/**
 * Test Japanese keyword content generation
 * Run with: npx tsx scripts/test-japanese.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { runContentPipeline } from '../src/lib/content/generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testJapaneseKeyword() {
  console.log('🚀 Testing Japanese keyword generation...');

  // Get the Japanese keyword
  const keywordId = 'e8148253-9125-471b-8afa-055d0bf56da8'; // 韓国美容整形

  const { data: keyword, error: kErr } = await supabase
    .from('content_keywords')
    .select('*')
    .eq('id', keywordId)
    .single();

  if (kErr || !keyword) {
    console.error('Keyword not found:', kErr);
    return;
  }

  console.log('✅ Keyword found:', keyword.keyword, '(locale:', keyword.locale, ')');

  // Generate content
  console.log('\n📝 Generating content...');
  const startTime = Date.now();

  try {
    const { content, metadata, qualityScore } = await runContentPipeline({
      keyword: keyword.keyword,
      locale: keyword.locale || 'ja',
      category: keyword.category || 'plastic-surgery',
      targetWordCount: 1500,
    });

    const genTime = (Date.now() - startTime) / 1000;
    console.log('\n✅ Generation completed in', genTime.toFixed(1), 'seconds');
    console.log('Quality Score:', qualityScore.overall, '%');
    console.log('Title:', content.title);
    console.log('Content length:', content.content?.length, 'chars');

    // Save to DB with correct locale mapping
    const blogPostData = {
      slug: content.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60),
      // Always save to 'en' as required fields
      title_en: content.title,
      excerpt_en: content.excerpt,
      content_en: content.content,
      meta_title_en: content.metaTitle,
      meta_description_en: content.metaDescription,
      // Also save to 'ja' fields
      title_ja: content.title,
      excerpt_ja: content.excerpt,
      content_ja: content.content,
      meta_title_ja: content.metaTitle,
      meta_description_ja: content.metaDescription,
      category: keyword.category || 'plastic-surgery',
      tags: content.tags || [],
      status: 'draft',
      cover_image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop',
      generation_metadata: {
        ...metadata,
        qualityScore: qualityScore.overall,
        keyword: keyword.keyword,
        sourceLocale: keyword.locale,
      },
    };

    console.log('\n📁 Saving to database...');
    const { data: post, error: saveErr } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (saveErr) {
      console.error('Save error:', saveErr);
      return;
    }

    console.log('✅ Saved! Post ID:', post.id);

    // Update keyword status
    await supabase
      .from('content_keywords')
      .update({
        blog_post_id: post.id,
        status: 'generated',
        quality_score: qualityScore.overall,
      })
      .eq('id', keywordId);

    console.log('✅ Keyword status updated');
    console.log('\n🎉 Japanese keyword test PASSED!');

  } catch (err) {
    console.error('Generation error:', err);
  }
}

testJapaneseKeyword().catch(console.error);
