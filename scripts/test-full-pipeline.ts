/**
 * Full Pipeline Test: Content + DALL-E Image Generation
 * Run with: npx tsx scripts/test-full-pipeline.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { runContentPipeline } from '../src/lib/content/generator';
import { runImagePipeline } from '../src/lib/images/image-pipeline';
import type { Locale } from '../src/lib/i18n/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFullPipeline() {
  console.log('🚀 Full Pipeline Test: Content + DALL-E Image\n');

  // 1. Get a pending keyword
  console.log('1. Finding pending keyword...');
  const { data: keywords, error: fetchError } = await supabase
    .from('content_keywords')
    .select('*')
    .eq('status', 'pending')
    .limit(1);

  if (fetchError || !keywords || keywords.length === 0) {
    console.log('No pending keywords found.');
    return;
  }

  const keyword = keywords[0];
  console.log(`   Keyword: "${keyword.keyword}" (${keyword.locale})`);
  console.log(`   Category: ${keyword.category}\n`);

  // 2. Update status to generating
  console.log('2. Setting status to "generating"...');
  await supabase
    .from('content_keywords')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', keyword.id);

  const startTime = Date.now();

  try {
    // 3. Generate content
    console.log('3. Generating content with Claude AI...');
    console.log('   (약 60-90초 소요)\n');

    const contentResult = await runContentPipeline({
      keyword: keyword.keyword,
      locale: (keyword.locale as Locale) || 'en',
      category: keyword.category || 'general',
      targetWordCount: 1500,
    });

    const { content, metadata, qualityScore } = contentResult;
    console.log(`✅ Content generated!`);
    console.log(`   Title: ${content.title}`);
    console.log(`   Quality: ${qualityScore.overall}%\n`);

    // 4. Save blog post
    console.log('4. Saving blog post to database...');

    const baseSlug = content.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

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
      cover_image_url: null, // Will be set by DALL-E
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

    // 5. Generate DALL-E image
    console.log('5. Generating cover image with DALL-E 3...');
    console.log('   (약 10-20초 소요)\n');

    const imageStartTime = Date.now();
    const imageResult = await runImagePipeline(supabase, {
      blogPostId: blogPost.id,
      title: content.title,
      excerpt: content.excerpt,
      category: keyword.category || 'medical-tourism',
      locale: (keyword.locale as Locale) || 'en',
      keyword: keyword.keyword,
      useSimplePrompt: false,
    });

    if (imageResult.success) {
      console.log(`✅ DALL-E image generated!`);
      console.log(`   URL: ${imageResult.imageUrl}`);
      console.log(`   Time: ${((Date.now() - imageStartTime) / 1000).toFixed(2)}s\n`);
    } else {
      console.log(`⚠️ Image generation failed: ${imageResult.error}`);
      console.log('   Using fallback Unsplash image.\n');

      // Set fallback
      const fallbackUrl = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=630&fit=crop';
      await supabase
        .from('blog_posts')
        .update({ cover_image_url: fallbackUrl })
        .eq('id', blogPost.id);
    }

    // 6. Update keyword status
    console.log('6. Updating keyword status...');
    await supabase
      .from('content_keywords')
      .update({
        blog_post_id: blogPost.id,
        status: 'generated',
        quality_score: qualityScore.overall,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyword.id);

    const totalTime = (Date.now() - startTime) / 1000;

    // 7. Final verification
    console.log('\n7. Verifying results...');
    const { data: verifyPost } = await supabase
      .from('blog_posts')
      .select('id, slug, title_en, cover_image_url, status')
      .eq('id', blogPost.id)
      .single();

    console.log('\n📋 Final Result:');
    console.log(`   ID: ${verifyPost?.id}`);
    console.log(`   Title: ${verifyPost?.title_en}`);
    console.log(`   Slug: ${verifyPost?.slug}`);
    console.log(`   Status: ${verifyPost?.status}`);
    console.log(`   Cover Image: ${verifyPost?.cover_image_url ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Total Time: ${totalTime.toFixed(2)}s`);

    console.log('\n🎉 Full Pipeline Test PASSED!');
    console.log(`\n📌 View at: http://localhost:3001/en/admin/content`);

  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);

    await supabase
      .from('content_keywords')
      .update({ status: 'pending' })
      .eq('id', keyword.id);
  }
}

testFullPipeline().catch(console.error);
