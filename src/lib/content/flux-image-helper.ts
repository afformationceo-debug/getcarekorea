/**
 * Flux Pro 1.1 Image Generation Helper
 *
 * Uses Replicate API for ultra-realistic image generation.
 * Flux Pro 1.1 is currently the best model for photorealistic images.
 */

import Replicate from 'replicate';
import { ImageMetadata, GeneratedImage, ImageGenerationResult } from './image-helper';

// =====================================================
// INITIALIZATION
// =====================================================

// Lazy initialization to prevent build errors
let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }
    replicateClient = new Replicate({
      auth: apiToken,
    });
  }
  return replicateClient;
}

// Configuration
const FLUX_CONFIG = {
  MAX_CONCURRENT: 2,           // Flux is slower, so fewer concurrent
  TIMEOUT_MS: 120000,          // 2 minute timeout (Flux takes longer)
  MODEL: 'black-forest-labs/flux-1.1-pro' as const,
};

// =====================================================
// FLUX PRO 1.1 IMAGE GENERATION
// =====================================================

interface FluxGenerationOptions {
  images: ImageMetadata[];
  keyword: string;
  locale: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  outputFormat?: 'webp' | 'jpg' | 'png';
  outputQuality?: number;
  safetyTolerance?: number;
}

/**
 * Generate a single image with Flux Pro 1.1
 */
async function generateSingleFluxImage(
  imageMetadata: ImageMetadata,
  options: {
    keyword: string;
    locale: string;
    aspectRatio: string;
    outputFormat: string;
    outputQuality: number;
    safetyTolerance: number;
  }
): Promise<GeneratedImage> {
  const replicate = getReplicateClient();

  // Enhance prompt for Flux (different approach than DALL-E)
  const enhancedPrompt = enhanceFluxPrompt(imageMetadata.prompt, {
    keyword: options.keyword,
    locale: options.locale,
  });

  console.log(`  📸 Generating with Flux Pro 1.1...`);

  // Run Flux Pro 1.1
  const output = await replicate.run(FLUX_CONFIG.MODEL, {
    input: {
      prompt: enhancedPrompt,
      aspect_ratio: options.aspectRatio,
      output_format: options.outputFormat,
      output_quality: options.outputQuality,
      safety_tolerance: options.safetyTolerance,
      prompt_upsampling: true, // Let Flux enhance the prompt
    },
  });

  // Output is a URL string
  const imageUrl = typeof output === 'string' ? output : String(output);

  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('Invalid image URL returned from Flux');
  }

  return {
    placeholder: imageMetadata.placeholder,
    url: imageUrl,
    alt: imageMetadata.alt,
    prompt: imageMetadata.prompt,
    revised_prompt: enhancedPrompt,
    size: options.aspectRatio === '16:9' ? '1792x1024' : '1024x1024',
    quality: 'hd',
  };
}

/**
 * Generate images using Flux Pro 1.1
 *
 * Flux Pro 1.1 advantages over DALL-E 3:
 * - Much better photorealism (humans look real)
 * - Natural skin textures and lighting
 * - Better at avoiding AI artifacts
 * - More consistent style
 */
export async function generateFluxImages(
  options: FluxGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    images,
    keyword,
    locale,
    aspectRatio = '16:9',
    outputFormat = 'webp',
    outputQuality = 90,
    safetyTolerance = 2,
  } = options;

  // Validate API token before proceeding
  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      images: [],
      total_generated: 0,
      total_cost: 0,
      errors: images.map(img => ({
        placeholder: img.placeholder,
        error: 'REPLICATE_API_TOKEN not configured',
      })),
    };
  }

  const generatedImages: GeneratedImage[] = [];
  const errors: Array<{ placeholder: string; error: string }> = [];

  console.log(`\n🎨 Generating ${images.length} images with Flux Pro 1.1...`);
  console.log(`   Model: ${FLUX_CONFIG.MODEL}`);
  console.log(`   Aspect Ratio: ${aspectRatio}`);

  // Process images in batches
  const batchSize = FLUX_CONFIG.MAX_CONCURRENT;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);

    console.log(`\n  📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`);

    // Generate batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (imageMetadata) => {
        console.log(`  📷 ${imageMetadata.placeholder}: Starting...`);

        const result = await generateSingleFluxImage(imageMetadata, {
          keyword,
          locale,
          aspectRatio,
          outputFormat,
          outputQuality,
          safetyTolerance,
        });

        console.log(`  ✅ ${imageMetadata.placeholder}: Done`);
        return result;
      })
    );

    // Process results
    batchResults.forEach((result, index) => {
      const imageMetadata = batch[index];
      if (result.status === 'fulfilled') {
        generatedImages.push(result.value);
      } else {
        console.error(`  ❌ ${imageMetadata.placeholder}: ${result.reason?.message || 'Unknown error'}`);
        errors.push({
          placeholder: imageMetadata.placeholder,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });
  }

  // Calculate total cost (Flux Pro 1.1 is ~$0.04 per image)
  const totalCost = generatedImages.length * 0.04;

  console.log(`\n✅ Flux Pro 1.1 generation complete!`);
  console.log(`   Generated: ${generatedImages.length}/${images.length}`);
  console.log(`   Failed: ${errors.length}`);
  console.log(`   Estimated cost: $${totalCost.toFixed(3)}`);

  return {
    images: generatedImages,
    total_generated: generatedImages.length,
    total_cost: totalCost,
    errors,
  };
}

/**
 * Enhance prompt for Flux Pro 1.1
 *
 * Flux works differently than DALL-E - it's better at following
 * natural language descriptions and doesn't need as many
 * anti-AI artifact instructions.
 */
function enhanceFluxPrompt(
  basePrompt: string,
  context: {
    keyword: string;
    locale: string;
  }
): string {
  // Flux Pro 1.1 is naturally photorealistic, so we focus on scene description
  let enhanced = basePrompt;

  // Add photography style (Flux responds well to camera/lens descriptions)
  const photoStyle = `Professional documentary photography, Canon EOS R5, 35mm lens, f/2.8, natural lighting. `;

  // Korean medical tourism context
  const locationContext = `Modern Korean medical clinic in Gangnam, Seoul. Clean minimalist interior with warm wood accents and natural sunlight through large windows. `;

  // Human realism (Flux handles this much better than DALL-E)
  const humanContext = `Real Korean and international patients and medical staff. Natural expressions, authentic poses, candid moment. Visible skin texture and natural imperfections. `;

  // Build the enhanced prompt
  enhanced = photoStyle + enhanced;

  // Add location context if medical-related
  if (/surgery|medical|hospital|clinic|doctor|patient|consultation|recovery|treatment/i.test(basePrompt)) {
    enhanced = enhanced + ' ' + locationContext + humanContext;
  }

  // Add style modifiers for realism
  enhanced += ` Style: photojournalistic, editorial photography, real moment captured, no artificial posing, authentic atmosphere.`;

  // Flux-specific quality modifiers
  enhanced += ` Technical: sharp focus on subject, natural depth of field, professional color grading, high resolution detail.`;

  return enhanced;
}

/**
 * Check if Flux API is available
 */
export async function checkFluxAvailability(): Promise<{
  available: boolean;
  message: string;
}> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return {
      available: false,
      message: 'REPLICATE_API_TOKEN not configured. Add it to .env.local',
    };
  }

  try {
    const replicate = getReplicateClient();
    // Try to get the model info
    const model = await replicate.models.get('black-forest-labs', 'flux-1.1-pro');
    return {
      available: true,
      message: `Flux Pro 1.1 available. Latest version: ${model.latest_version?.id || 'unknown'}`,
    };
  } catch (error) {
    return {
      available: false,
      message: `Flux Pro 1.1 check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export default generateFluxImages;
