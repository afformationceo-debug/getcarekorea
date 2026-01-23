/**
 * Test Content Generation and Publishing
 *
 * Usage: npx tsx scripts/test-publish.ts
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

if (!anthropicApiKey) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

async function generateAndPublish() {
  const keyword = 'eyelid surgery korea';
  const locale = 'en';

  console.log(`\n🚀 Generating content for: "${keyword}" (${locale})\n`);

  // Generate content with Claude
  const systemPrompt = `You are an expert medical tourism content writer for GetCareKorea, a premier platform connecting international patients with top Korean healthcare providers.

Your task is to create engaging, informative, SEO-optimized blog content about medical procedures in Korea.

OUTPUT FORMAT (JSON):
{
  "title": "SEO-optimized title (60-70 chars)",
  "excerpt": "Compelling meta description (150-160 chars)",
  "content": "Full HTML article with proper headings (h2, h3), paragraphs, lists, etc.",
  "metaTitle": "SEO title for browser tab",
  "metaDescription": "Meta description for search engines",
  "tags": ["tag1", "tag2", "tag3"],
  "faqSchema": [
    {"question": "FAQ question 1", "answer": "Answer 1"},
    {"question": "FAQ question 2", "answer": "Answer 2"}
  ]
}

CONTENT GUIDELINES:
1. Write in native ${locale === 'en' ? 'English' : locale}
2. Include specific Korean hospital/clinic references
3. Mention real price ranges and recovery times
4. Include cultural context about Korean beauty standards
5. Add practical tips for medical tourists
6. Use engaging, trustworthy tone
7. Include internal links to /procedures and /hospitals pages
8. Minimum 1500 words for comprehensive coverage`;

  const userPrompt = `Create a comprehensive blog article about "${keyword}".

The article should cover:
1. Introduction to eyelid surgery (blepharoplasty) in Korea
2. Why Korea is the world leader for this procedure
3. Types of eyelid surgery (double eyelid, ptosis correction, etc.)
4. Cost comparison with other countries
5. Recovery process and timeline
6. How to choose the right clinic
7. Patient testimonials and success rates
8. FAQs about the procedure

Make it informative, engaging, and helpful for someone considering this procedure in Korea.`;

  try {
    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Content generated in ${generationTime}s`);

    // Parse the response
    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const content = JSON.parse(jsonMatch[0]);
    console.log(`📝 Title: ${content.title}`);

    // Generate slug
    const slug = keyword
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

    // Save to database
    console.log(`\n💾 Saving to database...`);

    const blogPostData = {
      slug,
      title_en: content.title,
      excerpt_en: content.excerpt,
      content_en: content.content,
      meta_title_en: content.metaTitle,
      meta_description_en: content.metaDescription,
      category: 'plastic-surgery',
      tags: content.tags,
      status: 'published', // Directly publish
      published_at: new Date().toISOString(),
      generation_metadata: {
        keyword,
        locale,
        generationTime: `${generationTime}s`,
        model: 'claude-sonnet-4-20250514',
        faqSchema: content.faqSchema,
      }
    };

    const { data: savedPost, error: saveError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Save error:', saveError.message);
      throw saveError;
    }

    console.log(`✅ Saved and published: ${savedPost.id}`);
    console.log(`\n🔗 View at: https://getcarekorea.com/en/blog/${slug}`);
    console.log(`   Or locally: http://localhost:3000/en/blog/${slug}`);

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Keyword: ${keyword}`);
    console.log(`   - Locale: ${locale}`);
    console.log(`   - Title: ${content.title}`);
    console.log(`   - Status: Published`);
    console.log(`   - Tags: ${content.tags.join(', ')}`);
    console.log(`   - FAQs: ${content.faqSchema?.length || 0}`);

    return savedPost;

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run
generateAndPublish()
  .then(() => {
    console.log('\n✅ Test publish complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test publish failed:', error);
    process.exit(1);
  });
