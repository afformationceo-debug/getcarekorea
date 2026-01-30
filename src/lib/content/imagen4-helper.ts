/**
 * Google Imagen 4 Image Generation Helper
 *
 * ⚠️ IMPORTANT: This is the OFFICIAL image generation library for GetCareKorea
 * DO NOT use DALL-E, Flux, or other models. Always use Imagen 4.
 *
 * Model: google/imagen-4 (via Replicate API)
 * Cost: ~$0.02 per image
 *
 * Images are uploaded to Supabase Storage for permanent URLs.
 *
 * @see https://replicate.com/google/imagen-4/api
 */

import Replicate from 'replicate';
import { createAdminClient } from '@/lib/supabase/server';

// =====================================================
// CONFIGURATION - DO NOT CHANGE
// =====================================================

const IMAGEN_CONFIG = {
  MODEL: 'google/imagen-4' as const,      // Official Google Imagen 4
  MAX_CONCURRENT: 1,                       // Max parallel generations (reduced for rate limit)
  TIMEOUT_MS: 120000,                      // 2 minute timeout
  COST_PER_IMAGE: 0.02,                    // USD
  DEFAULT_ASPECT_RATIO: '16:9' as const,
  DEFAULT_OUTPUT_FORMAT: 'png' as const,  // Imagen 4 only supports 'jpg' or 'png'
  DEFAULT_QUALITY: 90,
  REQUEST_DELAY_MS: 12000,                // 12 seconds between requests (for rate limit)
};

// Export config for reference
export const IMAGE_GENERATION_CONFIG = IMAGEN_CONFIG;

// =====================================================
// TYPES
// =====================================================

export interface ImageMetadata {
  position: string;              // 'after-intro', 'section-2', etc.
  placeholder: string;           // [IMAGE_PLACEHOLDER_1]
  prompt: string;                // Image generation prompt
  alt: string;                   // Required alt text for SEO
  caption?: string;              // Optional caption
}

export interface GeneratedImage {
  placeholder: string;           // [IMAGE_PLACEHOLDER_1]
  url: string;                   // Generated image URL
  alt: string;                   // Alt text
  prompt: string;                // Original prompt
  aspectRatio: string;           // '16:9', '1:1', etc.
}

export interface ImageGenerationOptions {
  images: ImageMetadata[];
  keyword: string;
  locale: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  outputFormat?: 'jpg' | 'png';  // Imagen 4 only supports jpg and png (NOT webp)
  outputQuality?: number;        // 1-100
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  total_generated: number;
  total_failed: number;
  total_cost: number;            // Estimated cost in USD
  errors: Array<{
    placeholder: string;
    error: string;
  }>;
}

// =====================================================
// INITIALIZATION
// =====================================================

let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured. Add it to .env.local');
    }
    replicateClient = new Replicate({
      auth: apiToken,
    });
  }
  return replicateClient;
}

// =====================================================
// PROMPT ENHANCEMENT
// =====================================================

/**
 * Enhance prompt for medical tourism context
 *
 * Imagen 4 works best with detailed, specific descriptions.
 * This adds Korean medical tourism context for consistent styling.
 */
function enhancePrompt(basePrompt: string, keyword: string): string {
  // Photography style prefix
  const stylePrefix = 'Ultra-realistic professional photograph, ';

  // Medical tourism context
  const contextSuffix = `. Setting: Premium Korean medical clinic or dermatology center in Seoul's Gangnam district. Style: Editorial documentary photography, natural lighting, warm professional atmosphere, genuine expressions. Technical: 8K resolution, sharp focus, natural colors, professional color grading.`;

  // Ensure keyword is mentioned if relevant
  let enhanced = stylePrefix + basePrompt;

  if (keyword && !basePrompt.toLowerCase().includes(keyword.toLowerCase())) {
    enhanced = enhanced.replace('.', ` related to ${keyword}.`);
  }

  return enhanced + contextSuffix;
}

// =====================================================
// SUPABASE STORAGE UPLOAD
// =====================================================

/**
 * Upload image to Supabase Storage for permanent URL
 */
async function uploadToSupabaseStorage(
  imageUrl: string,
  fileName: string,
  outputFormat: string
): Promise<string> {
  try {
    console.log(`     📤 Uploading to Supabase Storage...`);

    // Download image from Replicate
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    // Generate unique file path
    const sanitizedFileName = fileName.replace(/[^a-z0-9-]/gi, '-').substring(0, 50);
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = outputFormat === 'jpg' ? 'jpg' : outputFormat === 'png' ? 'png' : 'webp';
    const filePath = `generated/${timestamp}-${randomStr}-${sanitizedFileName}.${extension}`;

    // Get admin client for storage access
    const adminClient = await createAdminClient();

    // Upload to Supabase Storage
    const { error } = await adminClient.storage
      .from('blog-images')
      .upload(filePath, uint8Array, {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        upsert: true,
      });

    if (error) {
      console.error(`     ❌ Storage upload error:`, error.message);
      // Return original URL as fallback (note: Replicate URLs may expire)
      return imageUrl;
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    console.log(`     ✅ Uploaded to Storage: ${publicUrl.substring(0, 60)}...`);

    return publicUrl;
  } catch (error) {
    console.error('     ❌ Storage upload failed:', error);
    // Return original URL as fallback
    return imageUrl;
  }
}

// =====================================================
// SINGLE IMAGE GENERATION
// =====================================================

/**
 * Generate a single image with Imagen 4 and upload to Supabase Storage
 */
async function generateSingleImage(
  metadata: ImageMetadata,
  options: {
    keyword: string;
    aspectRatio: string;
    outputFormat: string;
    outputQuality: number;
  }
): Promise<GeneratedImage> {
  const replicate = getReplicateClient();

  // Enhance the prompt
  const enhancedPrompt = enhancePrompt(metadata.prompt, options.keyword);

  console.log(`     Prompt: ${metadata.prompt.substring(0, 80)}...`);

  // Call Imagen 4 via Replicate
  const output = await replicate.run(IMAGEN_CONFIG.MODEL, {
    input: {
      prompt: enhancedPrompt,
      aspect_ratio: options.aspectRatio,
      output_format: options.outputFormat,
      output_quality: options.outputQuality,
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text overlay, cartoon, anime, illustration, 3d render, CGI',
    },
  });

  // Extract URL from Replicate output
  const replicateUrl = typeof output === 'string' ? output :
                   Array.isArray(output) ? String(output[0]) :
                   String(output);

  if (!replicateUrl || !replicateUrl.startsWith('http')) {
    throw new Error(`Invalid image URL returned: ${replicateUrl}`);
  }

  // Upload to Supabase Storage for permanent URL
  const permanentUrl = await uploadToSupabaseStorage(
    replicateUrl,
    `${options.keyword}-${metadata.position}`,
    options.outputFormat
  );

  return {
    placeholder: metadata.placeholder,
    url: permanentUrl,  // Use permanent Supabase Storage URL
    alt: metadata.alt,
    prompt: metadata.prompt,
    aspectRatio: options.aspectRatio,
  };
}

// =====================================================
// BATCH IMAGE GENERATION
// =====================================================

/**
 * Generate multiple images with Imagen 4
 *
 * This is the main function to use for generating images.
 * It handles batching, error recovery, and cost tracking.
 */
export async function generateImagen4Images(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    images,
    keyword,
    locale,
    aspectRatio = IMAGEN_CONFIG.DEFAULT_ASPECT_RATIO,
    outputFormat = IMAGEN_CONFIG.DEFAULT_OUTPUT_FORMAT,
    outputQuality = IMAGEN_CONFIG.DEFAULT_QUALITY,
  } = options;

  // Validate API token
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not configured');
    return {
      images: [],
      total_generated: 0,
      total_failed: images.length,
      total_cost: 0,
      errors: images.map(img => ({
        placeholder: img.placeholder,
        error: 'REPLICATE_API_TOKEN not configured',
      })),
    };
  }

  console.log(`\n🎨 Generating ${images.length} images with Google Imagen 4`);
  console.log(`   Model: ${IMAGEN_CONFIG.MODEL}`);
  console.log(`   Aspect: ${aspectRatio} | Format: ${outputFormat} | Quality: ${outputQuality}%`);
  console.log(`   Keyword: ${keyword} | Locale: ${locale}`);

  const generatedImages: GeneratedImage[] = [];
  const errors: Array<{ placeholder: string; error: string }> = [];

  // Process in batches
  const batchSize = IMAGEN_CONFIG.MAX_CONCURRENT;
  const totalBatches = Math.ceil(images.length / batchSize);

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`\n  📦 Batch ${batchNum}/${totalBatches}`);

    // Generate batch in parallel
    const results = await Promise.allSettled(
      batch.map(async (metadata, idx) => {
        const imageNum = i + idx + 1;
        console.log(`  📷 [${imageNum}/${images.length}] ${metadata.position}...`);

        const result = await generateSingleImage(metadata, {
          keyword,
          aspectRatio,
          outputFormat,
          outputQuality,
        });

        console.log(`  ✅ [${imageNum}/${images.length}] Done`);
        return result;
      })
    );

    // Process results
    results.forEach((result, idx) => {
      const metadata = batch[idx];
      if (result.status === 'fulfilled') {
        generatedImages.push(result.value);
      } else {
        const errorMsg = result.reason?.message || 'Unknown error';
        console.error(`  ❌ ${metadata.position}: ${errorMsg}`);
        errors.push({
          placeholder: metadata.placeholder,
          error: errorMsg,
        });
      }
    });

    // Delay between batches to avoid rate limiting
    // Note: Imagen 4 via Replicate has strict rate limits without payment method
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, IMAGEN_CONFIG.REQUEST_DELAY_MS));
    }
  }

  // Calculate cost
  const totalCost = generatedImages.length * IMAGEN_CONFIG.COST_PER_IMAGE;

  console.log(`\n✅ Imagen 4 generation complete!`);
  console.log(`   Generated: ${generatedImages.length}/${images.length}`);
  console.log(`   Failed: ${errors.length}`);
  console.log(`   Cost: $${totalCost.toFixed(3)}`);

  return {
    images: generatedImages,
    total_generated: generatedImages.length,
    total_failed: errors.length,
    total_cost: totalCost,
    errors,
  };
}

// =====================================================
// HTML HELPERS
// =====================================================

/**
 * Create HTML figure element for an image
 */
export function createImageHTML(
  image: ImageForInsertion | GeneratedImage,
  caption?: string
): string {
  return `
<figure class="my-8">
  <img
    src="${image.url}"
    alt="${image.alt}"
    class="w-full rounded-lg shadow-lg"
    loading="lazy"
    width="1792"
    height="1024"
  />
  ${caption ? `<figcaption class="text-center text-sm text-gray-500 mt-2 italic">${caption}</figcaption>` : ''}
</figure>`;
}

// Simplified image type for insertion (only needs url, alt, placeholder)
export interface ImageForInsertion {
  placeholder: string;
  url: string;
  alt: string;
}

/**
 * Insert images into HTML content at specified positions
 *
 * Handles multiple placeholder formats:
 * - Plain: [IMAGE_PLACEHOLDER_1]
 * - In paragraph: <p>[IMAGE_PLACEHOLDER_1]</p>
 * - In img tag: <img src="[IMAGE_PLACEHOLDER_1]" alt="..." />
 *
 * @param content - HTML content with placeholders or headings
 * @param images - Generated images with their positions (only needs url, alt, placeholder)
 * @returns Updated HTML content with images
 */
export function insertImagesIntoContent(
  content: string,
  images: ImageForInsertion[] | GeneratedImage[],
  captions?: Record<string, string>
): string {
  let updatedContent = content;

  console.log(`🖼️ Inserting ${images.length} images into content...`);

  for (const image of images) {
    // Get placeholder name without brackets
    const placeholderName = image.placeholder.replace(/[[\]]/g, '');
    const imageHtml = createImageHTML(image, captions?.[image.placeholder]);

    // 1. Replace <p>[IMAGE_PLACEHOLDER_X]</p> pattern
    const pWrapperRegex = new RegExp(
      `<p>\\s*\\[${placeholderName}\\]\\s*</p>`,
      'gi'
    );
    if (pWrapperRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(pWrapperRegex, imageHtml);
      console.log(`   ✅ Replaced <p>[${placeholderName}]</p>`);
      continue;
    }

    // 2. Replace <img src="[IMAGE_PLACEHOLDER_X]" ... /> pattern
    const imgTagRegex = new RegExp(
      `<img[^>]*src=["']\\[${placeholderName}\\]["'][^>]*\\/?>`,
      'gi'
    );
    if (imgTagRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(imgTagRegex, imageHtml);
      console.log(`   ✅ Replaced <img src="[${placeholderName}]" />`);
      continue;
    }

    // 3. Replace plain [IMAGE_PLACEHOLDER_X] text
    const plainRegex = new RegExp(
      `\\[${placeholderName}\\]`,
      'gi'
    );
    if (plainRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(plainRegex, imageHtml);
      console.log(`   ✅ Replaced [${placeholderName}]`);
      continue;
    }

    console.log(`   ⚠️ Placeholder [${placeholderName}] not found in content`);
  }

  return updatedContent;
}

// =====================================================
// AVAILABILITY CHECK
// =====================================================

/**
 * Check if Imagen 4 API is available
 */
export async function checkImagen4Availability(): Promise<{
  available: boolean;
  message: string;
}> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      available: false,
      message: 'REPLICATE_API_TOKEN not configured',
    };
  }

  try {
    const replicate = getReplicateClient();
    // Try to get model info
    await replicate.models.get('google', 'imagen-4');
    return {
      available: true,
      message: 'Imagen 4 is available and ready',
    };
  } catch (error) {
    return {
      available: false,
      message: `Imagen 4 check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default generateImagen4Images;
