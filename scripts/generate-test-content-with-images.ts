/**
 * Test Script: Generate Content with Imagen 4 Images
 *
 * ⚠️ Uses Google Imagen 4 for ALL image generation
 *
 * Usage: npx tsx scripts/generate-test-content-with-images.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Replicate from 'replicate';

// =====================================================
// CLIENTS
// =====================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// =====================================================
// CONFIGURATION
// =====================================================

const KEYWORD = 'korean skin whitening treatment';
const LOCALE = 'en';
const CATEGORY = 'Dermatology';

const IMAGEN4_CONFIG = {
  MODEL: 'google/imagen-4' as const,
  COST_PER_IMAGE: 0.02,
  OUTPUT_FORMAT: 'png' as const,  // Imagen 4 only supports jpg/png (NOT webp)
  REQUEST_DELAY_MS: 12000,        // 12 seconds between requests for rate limit
};

// =====================================================
// IMAGE GENERATION
// =====================================================

interface ImagePrompt {
  position: string;
  placeholder: string;
  prompt: string;
  alt: string;
}

async function generateImageWithImagen4(imagePrompt: ImagePrompt): Promise<{ url: string; alt: string; placeholder: string } | null> {
  console.log(`   📷 Generating: ${imagePrompt.position}...`);

  // Enhance prompt for medical tourism context
  const enhancedPrompt = `Ultra-realistic professional photograph, ${imagePrompt.prompt}. Setting: Premium Korean medical clinic in Seoul's Gangnam district. Style: Editorial documentary photography, natural lighting, professional atmosphere. Technical: 8K resolution, sharp focus, natural colors.`;

  try {
    const output = await replicate.run(IMAGEN4_CONFIG.MODEL, {
      input: {
        prompt: enhancedPrompt,
        aspect_ratio: '16:9',
        output_format: IMAGEN4_CONFIG.OUTPUT_FORMAT,  // Must be 'jpg' or 'png'
        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text overlay, cartoon, anime, illustration, 3d render, CGI',
      },
    });

    const imageUrl = typeof output === 'string' ? output :
                     Array.isArray(output) ? String(output[0]) :
                     String(output);

    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ Invalid URL returned`);
      return null;
    }

    console.log(`   ✅ Generated: ${imagePrompt.position}`);
    return {
      url: imageUrl,
      alt: imagePrompt.alt,
      placeholder: imagePrompt.placeholder,
    };
  } catch (error) {
    console.error(`   ❌ Error generating ${imagePrompt.position}:`, error);
    return null;
  }
}

// =====================================================
// CONTENT GENERATION
// =====================================================

async function generateContent() {
  console.log('\n🚀 Starting Content Generation with Imagen 4 Images');
  console.log('='.repeat(60));
  console.log(`Keyword: ${KEYWORD}`);
  console.log(`Locale: ${LOCALE}`);
  console.log(`Category: ${CATEGORY}`);
  console.log(`Image Model: ${IMAGEN4_CONFIG.MODEL}`);

  // Step 1: Generate blog content with Claude
  console.log('\n📝 Step 1: Generating blog content with Claude...');
  const startTime = Date.now();

  const contentPrompt = `You are a medical tourism content expert specializing in Korean aesthetic procedures.
Write a comprehensive, SEO-optimized blog post about "${KEYWORD}" for international patients considering treatment in Korea.

Target Audience: English-speaking international patients interested in skin whitening/brightening treatments in Korea.

Requirements:
1. Title: Create an engaging, SEO-friendly title (60-70 characters)
2. Meta Description: Write a compelling meta description (150-160 characters)
3. Content Structure:
   - Introduction (what is skin whitening/brightening in Korean dermatology)
   - Types of Treatments Available (IV glutathione, laser toning, topical treatments, etc.)
   - Benefits of Korean Skin Whitening Treatments
   - The Treatment Process
   - Expected Results & Maintenance
   - Cost Comparison (Korea vs other countries)
   - Why Choose Korea?
   - Safety Considerations
   - FAQ Section (5 questions)
   - Conclusion with CTA

4. Include exactly 5 image placeholders in this exact format:
   [IMAGE_PLACEHOLDER_1] - after introduction
   [IMAGE_PLACEHOLDER_2] - in treatments section
   [IMAGE_PLACEHOLDER_3] - in process section
   [IMAGE_PLACEHOLDER_4] - in results section
   [IMAGE_PLACEHOLDER_5] - before conclusion

5. For each placeholder, also provide in JSON:
   - position: where it goes
   - prompt: detailed image generation prompt (describe the scene)
   - alt: SEO-optimized alt text (10-20 words)

6. Writing Style: Professional yet approachable, include specific details
7. Word Count: 1800-2200 words

Format response as JSON:
{
  "title": "...",
  "metaTitle": "...",
  "metaDescription": "...",
  "excerpt": "2-3 sentence summary",
  "content": "<article>HTML content with [IMAGE_PLACEHOLDER_X] markers</article>",
  "tags": ["tag1", "tag2", ...],
  "images": [
    {
      "position": "after-intro",
      "placeholder": "IMAGE_PLACEHOLDER_1",
      "prompt": "Detailed scene description for image generation",
      "alt": "SEO alt text"
    },
    ...
  ],
  "faqSchema": [
    {"question": "...", "answer": "..."},
    ...
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentPrompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const generatedTime = Date.now() - startTime;
    console.log(`   ✅ Content generated in ${(generatedTime / 1000).toFixed(2)}s`);
    console.log(`   📊 Tokens - Input: ${response.usage.input_tokens}, Output: ${response.usage.output_tokens}`);

    // Parse JSON response
    let blogData;
    try {
      let jsonStr = contentBlock.text;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }
      blogData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('   ⚠️ Failed to parse JSON:', parseError);
      throw new Error('Failed to parse content JSON');
    }

    console.log(`   📄 Title: ${blogData.title}`);
    console.log(`   📸 Images to generate: ${blogData.images?.length || 0}`);

    // Step 2: Generate images with Imagen 4
    console.log('\n🎨 Step 2: Generating images with Imagen 4...');
    const imageStartTime = Date.now();
    const generatedImages: Array<{ url: string; alt: string; placeholder: string }> = [];

    if (blogData.images && blogData.images.length > 0) {
      // Limit to 3 images for rate limit compliance
      const imagesToGenerate = blogData.images.slice(0, 3);
      console.log(`   (Limiting to ${imagesToGenerate.length} images due to rate limits)`);

      for (let i = 0; i < imagesToGenerate.length; i++) {
        const imagePrompt = imagesToGenerate[i];
        const result = await generateImageWithImagen4(imagePrompt);
        if (result) {
          generatedImages.push(result);
        }
        // Wait 12 seconds between requests to avoid rate limiting
        if (i < imagesToGenerate.length - 1) {
          console.log(`   ⏳ Waiting ${IMAGEN4_CONFIG.REQUEST_DELAY_MS / 1000}s for rate limit...`);
          await new Promise(resolve => setTimeout(resolve, IMAGEN4_CONFIG.REQUEST_DELAY_MS));
        }
      }
    }

    const imageTime = ((Date.now() - imageStartTime) / 1000).toFixed(2);
    console.log(`\n   ✅ Generated ${generatedImages.length}/${blogData.images?.length || 0} images in ${imageTime}s`);
    console.log(`   💰 Image cost: $${(generatedImages.length * IMAGEN4_CONFIG.COST_PER_IMAGE).toFixed(3)}`);

    // Step 3: Inject images into content
    console.log('\n💉 Step 3: Injecting images into content...');
    let finalContent = blogData.content;

    for (const image of generatedImages) {
      const placeholderRegex = new RegExp(`\\[${image.placeholder}\\]`, 'gi');
      const imageHtml = `
<figure class="my-8">
  <img
    src="${image.url}"
    alt="${image.alt}"
    class="w-full rounded-lg shadow-lg"
    loading="lazy"
    width="1792"
    height="1024"
  />
</figure>`;
      finalContent = finalContent.replace(placeholderRegex, imageHtml);
    }

    console.log(`   ✅ Images injected into content`);

    // Step 4: Save to database
    console.log('\n💾 Step 4: Saving to database...');
    const slug = KEYWORD.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    const { data: post, error: saveError } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title_en: blogData.title,
        content_en: finalContent,
        excerpt_en: blogData.excerpt,
        meta_title_en: blogData.metaTitle,
        meta_description_en: blogData.metaDescription,
        category: CATEGORY,
        tags: blogData.tags,
        generation_metadata: {
          keyword: KEYWORD,
          locale: LOCALE,
          model: 'claude-sonnet-4',
          image_model: IMAGEN4_CONFIG.MODEL,
          faq_schema: blogData.faqSchema,
          generated_images: generatedImages,
          generated_at: new Date().toISOString(),
        },
        status: 'published',  // Publish immediately
        author_id: null,
        view_count: 0,
      })
      .select()
      .single();

    if (saveError) {
      console.error('   ❌ Failed to save:', saveError.message);
      throw saveError;
    }

    console.log(`   ✅ Saved with ID: ${post.id}`);
    console.log(`   📝 Slug: ${slug}`);

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONTENT GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Images generated: ${generatedImages.length}`);
    console.log(`   Image cost: $${(generatedImages.length * IMAGEN4_CONFIG.COST_PER_IMAGE).toFixed(3)}`);
    console.log(`\n🔗 Published URLs:`);
    console.log(`   Production: https://getcarekorea.com/en/blog/${slug}`);
    console.log(`   Local: http://localhost:3002/en/blog/${slug}`);

    return { slug, postId: post.id };

  } catch (error) {
    console.error('\n❌ Content generation failed:', error);
    throw error;
  }
}

// Run
generateContent()
  .then(result => {
    console.log(`\n✅ Done! View your post at:`);
    console.log(`   https://getcarekorea.com/en/blog/${result.slug}`);
  })
  .catch(console.error);
