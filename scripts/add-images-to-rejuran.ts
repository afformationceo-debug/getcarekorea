/**
 * Add Images to Rejuran Blog Post
 *
 * Usage: npx tsx scripts/add-images-to-rejuran.ts
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const SLUG = 'rejuran-korea-mktjbckm';

// Image configurations for Rejuran article
const IMAGE_CONFIGS = [
  {
    position: 'after-intro',
    prompt: 'Ultra-realistic editorial photograph of an elegant Korean woman in her 30s receiving Rejuran injection treatment at a luxurious dermatology clinic in Gangnam, Seoul. Professional dermatologist in white coat carefully administering the procedure. Modern minimalist clinic interior with soft natural lighting from large windows. Warm wood accents, clean lines. Canon EOS R5, 35mm lens, f/2.8, natural skin texture visible, genuine expressions.',
    alt: 'Patient receiving Rejuran PDRN skin treatment at premium Korean dermatology clinic in Gangnam, Seoul',
    caption: 'A patient receives Rejuran treatment at a top-rated Seoul clinic'
  },
  {
    position: 'what-is-rejuran',
    prompt: 'Ultra-realistic product photography of Rejuran Healer ampoule vial and syringe on a clean white medical surface. Professional studio lighting, macro detail showing the clear serum. Medical packaging visible with Korean and English text. Premium quality glass vial with precise graduations. Canon EOS R5, 100mm macro lens, f/4, crisp focus, pharmaceutical grade appearance.',
    alt: 'Rejuran Healer PDRN serum vial used in Korean skin rejuvenation treatments',
    caption: 'Rejuran Healer - the original salmon DNA treatment from Korea'
  },
  {
    position: 'benefits',
    prompt: 'Ultra-realistic before and after style comparison photo of Korean woman showing improved skin texture. Natural lighting, no makeup, genuine skin visible. Left side showing minor imperfections, right side showing healthier, more radiant skin. Soft natural window light, neutral background. Documentary style photography capturing real transformation. Canon EOS R5, 85mm portrait lens, f/2.8.',
    alt: 'Visible skin improvement results from Rejuran treatment showing enhanced texture and radiance',
    caption: 'Natural skin improvement visible after Rejuran treatment series'
  },
  {
    position: 'clinic-interior',
    prompt: 'Ultra-realistic interior photograph of a premium Korean dermatology clinic in Gangnam district, Seoul. Modern minimalist design with warm wood panels, comfortable treatment chairs, state-of-the-art equipment. Natural light streaming through floor-to-ceiling windows with city view. Clean, calming atmosphere. Professional medical environment. Canon EOS R5, 24mm wide angle, f/5.6, architectural photography style.',
    alt: 'Modern Korean dermatology clinic interior in Gangnam Seoul with premium medical facilities',
    caption: 'A typical premium dermatology clinic in Seoul\'s Gangnam district'
  },
  {
    position: 'consultation',
    prompt: 'Ultra-realistic documentary photograph of a medical consultation at Korean clinic. Female international patient (diverse ethnicity) discussing treatment with Korean dermatologist. Doctor showing information on tablet screen. Warm, professional interaction. Modern consultation room with natural lighting. Genuine expressions, authentic moment. Canon EOS R5, 35mm lens, f/2.8, candid photojournalism style.',
    alt: 'International patient consulting with Korean dermatologist about Rejuran treatment options',
    caption: 'Personalized consultation with experienced Korean dermatologists'
  }
];

async function generateImage(config: typeof IMAGE_CONFIGS[0], index: number): Promise<string | null> {
  console.log(`\n  📷 [${index + 1}/5] Generating: ${config.position}...`);

  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: {
        prompt: config.prompt,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
        prompt_upsampling: true,
      },
    });

    const imageUrl = typeof output === 'string' ? output : String(output);

    if (!imageUrl.startsWith('http')) {
      throw new Error('Invalid URL returned');
    }

    console.log(`  ✅ [${index + 1}/5] Done: ${imageUrl.substring(0, 60)}...`);
    return imageUrl;
  } catch (error) {
    console.error(`  ❌ [${index + 1}/5] Failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

function createImageHTML(url: string, alt: string, caption: string): string {
  return `
<figure class="my-8">
  <img
    src="${url}"
    alt="${alt}"
    class="w-full rounded-lg shadow-lg"
    loading="lazy"
  />
  <figcaption class="text-center text-sm text-gray-500 mt-2 italic">${caption}</figcaption>
</figure>`;
}

function insertImagesIntoContent(content: string, images: Array<{ html: string; position: string }>): string {
  let updatedContent = content;

  // Find h2 headings and insert images after them
  const headingPatterns = [
    { position: 'after-intro', pattern: /<\/p>/, insertAfterCount: 2 }, // After second paragraph
    { position: 'what-is-rejuran', pattern: /<h2[^>]*>.*?What is Rejuran.*?<\/h2>/i },
    { position: 'benefits', pattern: /<h2[^>]*>.*?Benefits.*?<\/h2>/i },
    { position: 'clinic-interior', pattern: /<h2[^>]*>.*?Treatment Process.*?<\/h2>/i },
    { position: 'consultation', pattern: /<h2[^>]*>.*?Why Choose Korea.*?<\/h2>/i },
  ];

  for (const imgData of images) {
    const patternConfig = headingPatterns.find(p => p.position === imgData.position);

    if (patternConfig) {
      if (patternConfig.insertAfterCount) {
        // Insert after Nth occurrence
        let count = 0;
        updatedContent = updatedContent.replace(new RegExp(patternConfig.pattern.source, 'g'), (match) => {
          count++;
          if (count === patternConfig.insertAfterCount) {
            return match + imgData.html;
          }
          return match;
        });
      } else {
        // Insert after the matched heading
        updatedContent = updatedContent.replace(patternConfig.pattern, (match) => {
          return match + imgData.html;
        });
      }
    }
  }

  return updatedContent;
}

async function main() {
  console.log('\n🎨 Adding Images to Rejuran Korea Article\n');
  console.log('='.repeat(60));

  // Step 1: Fetch the blog post
  console.log('\n📋 Step 1: Fetching blog post...');
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, slug, content_en, cover_image_url')
    .eq('slug', SLUG)
    .single();

  if (fetchError || !post) {
    console.error('❌ Blog post not found:', fetchError?.message);
    return;
  }

  console.log(`   ✅ Found: ${post.id}`);

  // Step 2: Generate images
  console.log('\n🖼️ Step 2: Generating 5 images with Flux Pro 1.1...');
  console.log('   Model: black-forest-labs/flux-1.1-pro');
  console.log('   Format: 16:9 WebP @ 90% quality');

  const generatedImages: Array<{ html: string; position: string }> = [];
  let coverImageUrl: string | null = null;

  for (let i = 0; i < IMAGE_CONFIGS.length; i++) {
    const config = IMAGE_CONFIGS[i];
    const imageUrl = await generateImage(config, i);

    if (imageUrl) {
      // Use first image as cover if none exists
      if (i === 0 && !post.cover_image_url) {
        coverImageUrl = imageUrl;
      }

      generatedImages.push({
        html: createImageHTML(imageUrl, config.alt, config.caption),
        position: config.position,
      });
    }

    // Small delay between generations
    if (i < IMAGE_CONFIGS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n   📊 Generated: ${generatedImages.length}/5 images`);

  // Step 3: Insert images into content
  console.log('\n📝 Step 3: Inserting images into content...');
  const updatedContent = insertImagesIntoContent(post.content_en, generatedImages);

  const imagesAdded = (updatedContent.match(/<figure/g) || []).length;
  console.log(`   ✅ Inserted ${imagesAdded} images into content`);

  // Step 4: Update the blog post
  console.log('\n💾 Step 4: Saving to database...');

  const updateData: Record<string, unknown> = {
    content_en: updatedContent,
    updated_at: new Date().toISOString(),
  };

  if (coverImageUrl) {
    updateData.cover_image_url = coverImageUrl;
    updateData.cover_image_alt = IMAGE_CONFIGS[0].alt;
  }

  const { error: updateError } = await supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', post.id);

  if (updateError) {
    console.error('   ❌ Failed to update:', updateError.message);
    return;
  }

  console.log('   ✅ Blog post updated successfully!');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ IMAGE INSERTION COMPLETE\n');
  console.log(`📸 Images generated: ${generatedImages.length}`);
  console.log(`📝 Images inserted: ${imagesAdded}`);
  console.log(`🖼️ Cover image: ${coverImageUrl ? 'Set' : 'Already exists'}`);
  console.log(`💰 Estimated cost: $${(generatedImages.length * 0.04).toFixed(2)}`);
  console.log('\n🔗 View the updated post:');
  console.log(`   Local: http://localhost:3002/en/blog/${SLUG}`);
  console.log(`   Production: https://getcarekorea.com/en/blog/${SLUG}`);
}

main().catch(console.error);
