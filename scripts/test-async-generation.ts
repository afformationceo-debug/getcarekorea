/**
 * E2E Test for async content generation
 * Tests the complete flow: API request -> generation -> DB save
 *
 * Run with: npx tsx scripts/test-async-generation.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { runContentPipeline } from '../src/lib/content/generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAsyncGeneration() {
  console.log('🚀 E2E Test: Async Content Generation\n');

  // 1. Get a pending keyword
  console.log('1. Finding pending keyword...');
  const { data: keywords, error: fetchError } = await supabase
    .from('content_keywords')
    .select('*')
    .eq('status', 'pending')
    .limit(1);

  let keywordsList = keywords;

  if (fetchError || !keywords || keywords.length === 0) {
    console.log('No pending keywords. Creating test keyword...');

    const { data: newKeyword, error: insertError } = await supabase
      .from('content_keywords')
      .insert({
        keyword: 'eyelid surgery korea recovery time',
        category: 'plastic-surgery',
        locale: 'en',
        search_volume: 2000,
        competition: '0.45',
        priority: 3,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError || !newKeyword) {
      console.error('Error creating keyword:', insertError);
      return;
    }

    keywordsList = [newKeyword];
  }

  const keyword = keywordsList![0];
  console.log(`   Found: "${keyword.keyword}" (${keyword.locale})\n`);

  // 2. Simulate API flow - update status to generating
  console.log('2. Setting status to "generating"...');
  await supabase
    .from('content_keywords')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', keyword.id);

  // 3. Run content pipeline
  console.log('3. Running content pipeline...');
  console.log('   (This takes 60-90 seconds)\n');

  const startTime = Date.now();

  try {
    const result = await runContentPipeline({
      keyword: keyword.keyword,
      locale: keyword.locale || 'en',
      category: keyword.category || 'general',
      targetWordCount: 1500,
    });

    const { content, metadata, qualityScore } = result;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Content generated in ${duration}s`);
    console.log(`   Title: ${content.title}`);
    console.log(`   Quality: ${qualityScore.overall}%`);
    console.log(`   Tokens: ${metadata.inputTokens} in / ${metadata.outputTokens} out\n`);

    // 4. Save to database
    console.log('4. Saving to database...');

    const slug = content.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);

    const blogPostData = {
      slug,
      title_en: content.title,
      excerpt_en: content.excerpt,
      content_en: content.content,
      meta_title_en: content.metaTitle,
      meta_description_en: content.metaDescription,
      status: 'draft',
      category: keyword.category || 'plastic-surgery',
      tags: content.tags,
      cover_image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=630&fit=crop',
      generation_metadata: {
        ...metadata,
        qualityScore: qualityScore.overall,
        keyword: keyword.keyword,
      },
    };

    const { data: blogPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (saveError) {
      console.error('   ❌ Save failed:', saveError.message);
      await supabase
        .from('content_keywords')
        .update({ status: 'pending' })
        .eq('id', keyword.id);
      return;
    }

    console.log(`   ✅ Blog post saved: ${blogPost.id}\n`);

    // 5. Update keyword status
    console.log('5. Updating keyword status...');
    await supabase
      .from('content_keywords')
      .update({
        blog_post_id: blogPost.id,
        status: 'generated',
        quality_score: qualityScore.overall,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyword.id);

    console.log('   ✅ Status: generated\n');

    // 6. Verify
    console.log('6. Verifying...');
    const { data: verifyKeyword } = await supabase
      .from('content_keywords')
      .select('id, keyword, status, blog_post_id, quality_score')
      .eq('id', keyword.id)
      .single();

    const { data: verifyPost } = await supabase
      .from('blog_posts')
      .select('id, slug, title_en, status')
      .eq('id', blogPost.id)
      .single();

    console.log('   Keyword:', JSON.stringify(verifyKeyword, null, 2));
    console.log('   Post:', JSON.stringify(verifyPost, null, 2));

    console.log('\n🎉 E2E Test PASSED!');
    console.log(`\n📌 View at: http://localhost:3001/en/admin/content`);

  } catch (error) {
    console.error('\n❌ Generation failed:', error);

    // Reset status
    await supabase
      .from('content_keywords')
      .update({ status: 'pending' })
      .eq('id', keyword.id);
  }
}

testAsyncGeneration().catch(console.error);
