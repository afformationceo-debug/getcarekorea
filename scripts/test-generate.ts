/**
 * Test content generation API
 * Run with: npx tsx scripts/test-generate.ts
 */

import * as dotenv from 'dotenv';
// Load from .env.local first
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateBlogContent, scoreContent } from '../src/lib/content/generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure .env.local has:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  console.log('🚀 Starting content generation test...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Get first pending keyword
  console.log('1. Fetching pending keywords...');
  const { data: keywords, error: keywordError } = await supabase
    .from('content_keywords')
    .select('*')
    .eq('status', 'pending')
    .limit(1);

  if (keywordError) {
    console.error('Error fetching keywords:', keywordError);
    return;
  }

  if (!keywords || keywords.length === 0) {
    console.log('No pending keywords found. Creating a test keyword...');

    // Create a test keyword
    const { data: newKeyword, error: insertError } = await supabase
      .from('content_keywords')
      .insert({
        keyword: 'korean rhinoplasty cost 2025',
        category: 'plastic-surgery',
        locale: 'en',
        search_volume: 5000,
        competition: '0.65',
        priority: 5,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating test keyword:', insertError);
      return;
    }

    console.log('Created test keyword:', newKeyword.keyword);
    keywords.push(newKeyword);
  }

  const keyword = keywords[0];
  console.log(`\n✅ Using keyword: "${keyword.keyword}" (locale: ${keyword.locale})\n`);

  // 2. Generate content
  console.log('2. Generating content with Claude AI...');
  console.log('   This may take 30-60 seconds...\n');

  const startTime = Date.now();

  try {
    const { result, metadata } = await generateBlogContent({
      keyword: keyword.keyword,
      locale: keyword.locale || 'en',
      category: keyword.category || 'general',
      targetWordCount: 1500,
    });

    const generationTime = (Date.now() - startTime) / 1000;

    console.log('✅ Content generated successfully!\n');
    console.log('📊 Generation Stats:');
    console.log(`   - Time: ${generationTime.toFixed(2)}s`);
    console.log(`   - Input tokens: ${metadata.inputTokens}`);
    console.log(`   - Output tokens: ${metadata.outputTokens}`);
    console.log(`   - Model: ${metadata.model}`);

    console.log('\n📝 Content Preview:');
    console.log(`   Title: ${result.title}`);
    console.log(`   Excerpt: ${result.excerpt?.substring(0, 100)}...`);
    console.log(`   Meta Title: ${result.metaTitle}`);
    console.log(`   Tags: ${result.tags?.join(', ')}`);
    console.log(`   FAQ Count: ${result.faqSchema?.length || 0}`);
    console.log(`   Content Length: ${result.content?.length || 0} chars`);

    // 3. Score the content
    console.log('\n3. Scoring content quality...');
    const qualityScore = scoreContent(result, keyword.keyword);

    console.log('\n📈 Quality Scores:');
    console.log(`   Overall: ${qualityScore.overall}%`);
    console.log(`   SEO: ${qualityScore.seo}%`);
    console.log(`   AEO: ${qualityScore.aeo}%`);
    console.log(`   E-E-A-T: ${qualityScore.eeat}%`);
    console.log(`   Readability: ${qualityScore.readability}%`);
    console.log(`   Completeness: ${qualityScore.completeness}%`);

    // 4. Save to database
    console.log('\n4. Saving to database...');

    const blogPostData = {
      slug: result.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 60),
      title_en: result.title,
      excerpt_en: result.excerpt,
      content_en: result.content,
      meta_title_en: result.metaTitle,
      meta_description_en: result.metaDescription,
      category: keyword.category || 'medical-tourism',
      tags: result.tags || [],
      status: 'draft',
      cover_image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=630&fit=crop',
      generation_metadata: {
        ...metadata,
        qualityScore: qualityScore.overall,
        keyword: keyword.keyword,
        sourceLocale: keyword.locale || 'en',
      },
    };

    const { data: blogPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving blog post:', saveError);
      return;
    }

    console.log(`✅ Blog post saved! ID: ${blogPost.id}`);

    // 5. Update keyword status
    const { error: updateError } = await supabase
      .from('content_keywords')
      .update({
        blog_post_id: blogPost.id,
        status: 'generated',
        quality_score: qualityScore.overall,
      })
      .eq('id', keyword.id);

    if (updateError) {
      console.error('Error updating keyword:', updateError);
      return;
    }

    console.log('✅ Keyword status updated to "generated"');

    console.log('\n🎉 Test completed successfully!');
    console.log(`\n📌 View the content at: http://localhost:3001/en/admin/content`);

  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

main().catch(console.error);
