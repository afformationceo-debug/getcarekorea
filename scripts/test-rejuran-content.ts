/**
 * Test Script: Generate Rejuran Korea Content
 *
 * Usage: npx tsx scripts/test-rejuran-content.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const KEYWORD = 'rejuran korea';
const LOCALE = 'en';
const CATEGORY = 'Dermatology';

async function generateContent() {
  console.log('\n🚀 Starting Rejuran Korea Content Generation Test\n');
  console.log('='.repeat(60));

  // Step 1: Check if keyword exists
  console.log('\n📋 Step 1: Checking keyword...');
  const { data: keyword, error: kwError } = await supabase
    .from('content_keywords')
    .select('*')
    .eq('keyword', KEYWORD)
    .single();

  if (kwError || !keyword) {
    console.log('   Creating new keyword...');
    const { data: newKw, error: createError } = await supabase
      .from('content_keywords')
      .insert({
        keyword: KEYWORD,
        target_locale: LOCALE,
        category: CATEGORY,
        priority: 3,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Failed to create keyword:', createError.message);
      return;
    }
    console.log('   ✅ Keyword created:', newKw.id);
  } else {
    console.log('   ✅ Keyword found:', keyword.id);
  }

  // Step 2: Generate blog content with Claude
  console.log('\n📝 Step 2: Generating blog content with Claude...');
  const startTime = Date.now();

  const prompt = `You are a medical tourism content expert specializing in Korean aesthetic procedures.
Write a comprehensive, SEO-optimized blog post about "${KEYWORD}" for international patients considering treatment in Korea.

Target Audience: English-speaking international patients interested in skin rejuvenation treatments in Korea.

Requirements:
1. Title: Create an engaging, SEO-friendly title (60-70 characters)
2. Meta Description: Write a compelling meta description (150-160 characters)
3. Content Structure:
   - Introduction (hook the reader, explain what Rejuran is)
   - What is Rejuran? (explain PDRN/PN technology)
   - Benefits of Rejuran Treatment
   - Rejuran vs Other Treatments (comparison)
   - The Treatment Process in Korea
   - Expected Results & Recovery
   - Cost in Korea vs Other Countries
   - Why Choose Korea for Rejuran?
   - How to Prepare for Your Trip
   - FAQ Section (5-7 questions)
   - Conclusion with CTA

4. Writing Style:
   - Professional yet approachable
   - Include specific details and statistics where relevant
   - Use medical terms with explanations
   - Be informative and trustworthy

5. SEO Elements:
   - Use the keyword "rejuran korea" naturally 3-5 times
   - Include related keywords: PDRN, skin rejuvenation, salmon DNA, Korean dermatology
   - Use proper heading hierarchy (H2, H3)

6. Word Count: 2000-2500 words

Format the response as JSON:
{
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "excerpt": "...",
  "content": "<article>HTML content with proper headings</article>",
  "tags": ["tag1", "tag2", ...],
  "faqSchema": [
    {"question": "...", "answer": "..."},
    ...
  ],
  "aiSummary": {
    "keyTakeaways": ["..."],
    "quickAnswer": "...",
    "estimatedCost": "$XXX - $XXX per session",
    "recommendedStay": "X-X days",
    "recoveryTime": "..."
  }
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const generatedTime = Date.now() - startTime;
    console.log(`   ✅ Content generated in ${(generatedTime / 1000).toFixed(2)}s`);
    console.log(`   📊 Tokens - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);

    // Parse the JSON response
    let blogData;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = contentBlock.text;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      blogData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('   ⚠️ Failed to parse JSON, using raw content');
      blogData = {
        title: 'Rejuran Korea: Complete Guide to Salmon DNA Skin Treatment',
        metaTitle: 'Rejuran Korea: Complete Guide to Salmon DNA Skin Treatment',
        metaDescription: 'Discover Rejuran treatment in Korea. Learn about costs, benefits, and why Korean clinics are world leaders in this revolutionary skin rejuvenation procedure.',
        excerpt: 'Everything you need to know about Rejuran skin treatment in Korea.',
        content: contentBlock.text,
        tags: ['rejuran', 'korea', 'skin treatment', 'pdrn', 'dermatology'],
        faqSchema: [],
        aiSummary: {
          keyTakeaways: ['Revolutionary skin treatment', 'Uses salmon DNA (PDRN)', 'Popular in Korea'],
          quickAnswer: 'Rejuran is a skin rejuvenation treatment using polynucleotides derived from salmon DNA.',
          estimatedCost: '$200 - $400 per session',
          recommendedStay: '3-5 days',
          recoveryTime: '24-48 hours minimal downtime'
        }
      };
    }

    // Step 3: Create slug
    const slug = KEYWORD.toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    console.log('\n💾 Step 3: Saving to database...');
    console.log(`   Slug: ${slug}`);

    // Step 4: Save to blog_posts
    // Note: Store FAQ and AI Summary in generation_metadata since dedicated columns don't exist
    const { data: post, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title_en: blogData.title,
        content_en: blogData.content,
        excerpt_en: blogData.excerpt,
        meta_title_en: blogData.metaTitle,
        meta_description_en: blogData.metaDescription,
        category: CATEGORY,
        tags: blogData.tags,
        generation_metadata: {
          faq_schema: blogData.faqSchema,
          ai_summary: blogData.aiSummary,
          generated_at: new Date().toISOString(),
          model: 'claude-sonnet-4',
          keyword: KEYWORD,
          locale: LOCALE
        },
        status: 'draft',
        author_id: null,
        view_count: 0
      })
      .select()
      .single();

    if (saveError) {
      console.error('   ❌ Failed to save blog post:', saveError.message);
      return;
    }

    console.log(`   ✅ Blog post saved: ${post.id}`);

    // Step 5: Update keyword status
    await supabase
      .from('content_keywords')
      .update({
        status: 'generated',
        blog_post_id: post.id,
        generated_at: new Date().toISOString()
      })
      .eq('keyword', KEYWORD);

    console.log('   ✅ Keyword status updated');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONTENT GENERATION COMPLETE\n');
    console.log(`📄 Title: ${blogData.title}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`📝 Content Length: ${blogData.content?.length || 0} characters`);
    console.log(`🏷️ Tags: ${blogData.tags?.join(', ')}`);
    console.log(`❓ FAQs: ${blogData.faqSchema?.length || 0} questions`);
    console.log(`⏱️ Total Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log('\n🔗 Preview URL (after publish):');
    console.log(`   Local: http://localhost:3002/en/blog/${slug}`);
    console.log(`   Production: https://getcarekorea.com/en/blog/${slug}`);
    console.log('\n📋 Admin Preview:');
    console.log(`   http://localhost:3002/en/admin/preview/${post.id}`);

  } catch (error) {
    console.error('   ❌ Content generation failed:', error);
    throw error;
  }
}

// Run
generateContent().catch(console.error);
