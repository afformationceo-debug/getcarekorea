/**
 * Image Generation & Alt Tag Helper
 *
 * ⚠️ DEPRECATED: DO NOT USE THIS FILE
 * =====================================
 * This file uses DALL-E 3 which is NO LONGER the approved model.
 *
 * ✅ USE INSTEAD: @/lib/content/imagen4-helper.ts
 *
 * GetCareKorea uses Google Imagen 4 for ALL image generation.
 * Model: google/imagen-4 (via Replicate API)
 *
 * @deprecated Use imagen4-helper.ts instead
 */

import OpenAI from 'openai';

// =====================================================
// TYPES
// =====================================================

export interface ImageMetadata {
  position: string;              // 'after-intro', 'section-2', etc.
  placeholder: string;           // [IMAGE_PLACEHOLDER_1]
  prompt: string;                // DALL-E 3 prompt
  alt: string;                   // Required alt text (10-20 words)
  caption?: string;              // Optional caption
  contextBefore?: string;        // Content before image
  contextAfter?: string;         // Content after image
}

export interface GeneratedImage {
  placeholder: string;           // [IMAGE_PLACEHOLDER_1]
  url: string;                   // Generated image URL
  alt: string;                   // Alt text
  prompt: string;                // Original prompt
  revised_prompt?: string;       // DALL-E's revised prompt
  size: string;                  // '1024x1024', '1792x1024', etc.
  quality: 'standard' | 'hd';
}

export interface ImageGenerationOptions {
  images: ImageMetadata[];
  keyword: string;
  locale: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  total_generated: number;
  total_cost: number;            // Estimated cost in USD
  errors: Array<{
    placeholder: string;
    error: string;
  }>;
}

// =====================================================
// INITIALIZATION
// =====================================================

// Validate API key at module load time for better error messages
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey && typeof window === 'undefined') {
  console.warn('⚠️ OPENAI_API_KEY is not set. Image generation will fail.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'missing-key', // Provide fallback to prevent crash at init
});

// Configuration for image generation
const IMAGE_CONFIG = {
  MAX_CONCURRENT: 3,           // Max parallel image generations
  RATE_LIMIT_DELAY_MS: 500,    // Delay between batches for rate limiting
  TIMEOUT_MS: 60000,           // Timeout per image
};

// =====================================================
// ALT TAG GENERATION
// =====================================================

/**
 * Enhance alt text with keywords and context
 *
 * Takes a basic alt text and enhances it with:
 * - Relevant keywords from the content
 * - Location context (Seoul, Korea)
 * - Procedure/topic specificity
 */
export function enhanceAltText(
  basicAlt: string,
  keyword: string,
  context: {
    beforeText?: string;
    afterText?: string;
    locale?: string;
  }
): string {
  // Start with the basic alt
  let enhanced = basicAlt.trim();

  // Remove any existing keyword if it's redundant
  const keywordLower = keyword.toLowerCase();
  const altLower = enhanced.toLowerCase();

  // Add keyword if not already present
  if (!altLower.includes(keywordLower)) {
    // Find the best place to insert keyword (usually at the beginning or after first phrase)
    const firstComma = enhanced.indexOf(',');
    if (firstComma > 0 && firstComma < 50) {
      // Insert keyword after first phrase
      enhanced = `${enhanced.slice(0, firstComma)} for ${keyword}${enhanced.slice(firstComma)}`;
    } else {
      // Prepend keyword
      enhanced = `${keyword} - ${enhanced}`;
    }
  }

  // Add location context if not present
  const locationKeywords = ['seoul', 'korea', 'korean', '서울', '한국'];
  const hasLocation = locationKeywords.some(loc => altLower.includes(loc));

  if (!hasLocation) {
    // Add "in Seoul, South Korea" or similar
    enhanced = `${enhanced}, Seoul, South Korea`;
  }

  // Ensure it's within 10-20 words
  const wordCount = enhanced.split(/\s+/).length;
  if (wordCount > 25) {
    // Trim to ~20 words
    const words = enhanced.split(/\s+/).slice(0, 20);
    enhanced = words.join(' ') + '...';
  } else if (wordCount < 8) {
    // Too short, add more context from surrounding text
    if (context.beforeText) {
      const beforeWords = context.beforeText
        .replace(/<[^>]+>/g, '') // Strip HTML
        .split(/\s+/)
        .slice(-5)
        .join(' ');
      enhanced = `${beforeWords} - ${enhanced}`;
    }
  }

  return enhanced;
}

/**
 * Validate alt text for SEO and accessibility
 */
export function validateAltText(alt: string): {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check length
  const wordCount = alt.split(/\s+/).length;
  if (wordCount < 5) {
    warnings.push('Alt text is too short (< 5 words). Aim for 10-20 words.');
    suggestions.push('Add more descriptive details about the image content.');
  } else if (wordCount > 30) {
    warnings.push('Alt text is too long (> 30 words). Keep it concise.');
    suggestions.push('Focus on the most important visual elements.');
  }

  // Check for keyword stuffing
  const words = alt.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = words.length / uniqueWords.size;
  if (repetitionRatio > 1.5) {
    warnings.push('Possible keyword stuffing detected.');
    suggestions.push('Use more varied vocabulary.');
  }

  // Check for starting with "Image of" or "Picture of"
  if (/^(image|picture|photo)\s+(of|showing)/i.test(alt)) {
    suggestions.push('Avoid starting with "Image of" or "Picture of". Screen readers already announce it as an image.');
  }

  // Check for meaningful content
  if (alt.length < 10) {
    warnings.push('Alt text too short to be meaningful.');
  }

  // Check for ending punctuation
  if (!/[.!?]$/.test(alt) && wordCount > 10) {
    suggestions.push('Consider ending alt text with punctuation for better readability.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions,
  };
}

// =====================================================
// IMAGE GENERATION
// =====================================================

/**
 * Generate a single image with timeout protection
 */
async function generateSingleImage(
  imageMetadata: ImageMetadata,
  options: {
    keyword: string;
    locale: string;
    size: '1024x1024' | '1792x1024' | '1024x1792';
    quality: 'standard' | 'hd';
    style: 'vivid' | 'natural';
  }
): Promise<GeneratedImage> {
  const { keyword, locale, size, quality, style } = options;

  // Enhance prompt with style and quality guidelines
  const enhancedPrompt = enhanceImagePrompt(imageMetadata.prompt, {
    keyword,
    locale,
    style,
  });

  // Generate image with DALL-E 3 (with timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), IMAGE_CONFIG.TIMEOUT_MS);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size,
      quality,
      style,
    });

    clearTimeout(timeoutId);

    if (!response.data || !response.data[0]) {
      throw new Error('No data returned from DALL-E');
    }

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    // Validate and enhance alt text
    const enhancedAlt = enhanceAltText(imageMetadata.alt, keyword, {
      beforeText: imageMetadata.contextBefore,
      afterText: imageMetadata.contextAfter,
      locale,
    });

    return {
      placeholder: imageMetadata.placeholder,
      url: imageUrl,
      alt: enhancedAlt,
      prompt: imageMetadata.prompt,
      revised_prompt: revisedPrompt,
      size,
      quality,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate images using DALL-E 3 with parallel processing
 *
 * Optimized for speed:
 * - Parallel generation (up to 3 concurrent)
 * - Timeout protection per image
 * - Graceful error handling
 */
export async function generateImages(
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    images,
    keyword,
    locale,
    size = '1024x1024',
    quality = 'hd',
    style = 'natural',
  } = options;

  // Validate API key before proceeding
  if (!process.env.OPENAI_API_KEY) {
    return {
      images: [],
      total_generated: 0,
      total_cost: 0,
      errors: images.map(img => ({
        placeholder: img.placeholder,
        error: 'OPENAI_API_KEY not configured',
      })),
    };
  }

  const generatedImages: GeneratedImage[] = [];
  const errors: Array<{ placeholder: string; error: string }> = [];

  console.log(`\n🎨 Generating ${images.length} images with DALL-E 3 (parallel)...`);

  // Process images in batches for parallel generation
  const batchSize = IMAGE_CONFIG.MAX_CONCURRENT;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);

    console.log(`\n  📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`);

    // Generate batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (imageMetadata) => {
        console.log(`  📷 ${imageMetadata.placeholder}: Starting...`);

        const result = await generateSingleImage(imageMetadata, {
          keyword,
          locale,
          size,
          quality,
          style,
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

    // Brief delay between batches to respect rate limits
    if (i + batchSize < images.length) {
      await new Promise(resolve => setTimeout(resolve, IMAGE_CONFIG.RATE_LIMIT_DELAY_MS));
    }
  }

  // Calculate total cost
  const totalCost = generatedImages.length * (quality === 'hd' ? 0.080 : 0.040);

  console.log(`\n✅ Image generation complete!`);
  console.log(`   Generated: ${generatedImages.length}/${images.length}`);
  console.log(`   Failed: ${errors.length}`);
  console.log(`   Total cost: $${totalCost.toFixed(3)}`);

  return {
    images: generatedImages,
    total_generated: generatedImages.length,
    total_cost: totalCost,
    errors,
  };
}

/**
 * Enhance DALL-E prompt for REAL STOCK PHOTO quality
 *
 * Creates prompts that generate images indistinguishable from professional
 * Getty/Shutterstock medical photography. NO AI-looking artifacts.
 */
function enhanceImagePrompt(
  basePrompt: string,
  context: {
    keyword: string;
    locale: string;
    style: 'vivid' | 'natural';
  }
): string {
  // CRITICAL: Stock photo technical specifications
  const stockPhotoSpecs = `Professional stock photography, shot on Sony A7R IV full-frame mirrorless camera with Zeiss 35mm f/1.4 lens. `;

  // Clean the base prompt - aggressively remove AI/illustration triggers
  let cleaned = basePrompt
    .replace(/\b(illustration|infographic|diagram|cartoon|graphic|vector|icon|clipart|drawing|sketch|animated|3d render|render|CGI|digital art|concept art|artistic|stylized)\b/gi, '')
    .replace(/\b(medical illustration|educational diagram|split composition|morphing)\b/gi, 'medical documentation photo')
    .replace(/\b(vibrant|vivid|saturated|HDR|hyper|ultra)\b/gi, 'natural')
    .trim();

  // Build enhanced prompt with stock photo realism
  let enhanced = stockPhotoSpecs + cleaned;

  // CRITICAL: Anti-AI artifact instructions
  enhanced += `. TECHNICAL: ISO 400, 1/125s shutter speed, natural color temperature 5500K. `;
  enhanced += `Shot in RAW, processed in Lightroom with minimal editing. `;
  enhanced += `REAL photography characteristics: slight lens distortion at edges, natural bokeh, film-like grain texture. `;

  // Human realism (most important for medical content)
  enhanced += `HUMANS: Real people with natural imperfections - visible pores, varied skin tones, asymmetrical features. `;
  enhanced += `Natural body language, candid expressions, not posed like stock photo clichés. `;
  enhanced += `Clothing with natural wrinkles and folds. Real hair with flyaways. `;

  // Medical facility realism
  if (/surgery|medical|hospital|clinic|doctor|patient|consultation|recovery/i.test(basePrompt)) {
    enhanced += `MEDICAL SETTING: Actual working Korean hospital/clinic environment. `;
    enhanced += `Real medical equipment with manufacturer branding visible but not prominent. `;
    enhanced += `Authentic details: papers on desks, real computer screens, medical charts. `;
    enhanced += `Staff in proper Korean medical uniforms (white coats, scrubs). `;
    enhanced += `Patients in hospital gowns or casual clothes, not perfect model appearances. `;
  }

  // Korean location authenticity
  enhanced += `LOCATION: Premium Gangnam medical district, Seoul, South Korea. `;
  enhanced += `Subtle Korean design elements: minimalist interiors, warm wood tones, plants, natural light. `;
  enhanced += `Korean text on signs/documents visible but not focal point. `;

  // Lighting (critical for realism)
  enhanced += `LIGHTING: Large window natural daylight as key light, soft fill from white walls. `;
  enhanced += `Avoid: harsh shadows, artificial blue tint, overexposed highlights. `;
  enhanced += `Golden hour warmth for recovery/comfort scenes. Clinical bright for consultation scenes. `;

  // ABSOLUTE PROHIBITIONS
  enhanced += `ABSOLUTELY NO: AI artifacts, plastic skin texture, uncanny valley faces, `;
  enhanced += `perfect symmetry, floating objects, warped hands, extra fingers, `;
  enhanced += `text/watermarks, illustration style, 3D render look, oversaturated colors, `;
  enhanced += `generic stock photo poses, sterile/empty environments. `;
  enhanced += `This must be indistinguishable from a real Getty Images medical photography portfolio.`;

  return enhanced;
}

// =====================================================
// HTML INJECTION
// =====================================================

/**
 * Replace image placeholders in HTML content with actual image tags
 */
export function injectImagesIntoHTML(
  htmlContent: string,
  generatedImages: GeneratedImage[]
): string {
  let injectedContent = htmlContent;

  for (const image of generatedImages) {
    // Find the placeholder img tag
    const placeholderRegex = new RegExp(
      `<img[^>]*src=["']${escapeRegExp(image.placeholder)}["'][^>]*>`,
      'gi'
    );

    // Create the new img tag with actual URL
    const newImgTag = `<img src="${image.url}" alt="${image.alt}" class="content-image" loading="lazy" />`;

    // Replace placeholder with actual image
    injectedContent = injectedContent.replace(placeholderRegex, newImgTag);
  }

  return injectedContent;
}

/**
 * Extract image metadata from HTML content
 */
export function extractImageMetadata(htmlContent: string): ImageMetadata[] {
  const images: ImageMetadata[] = [];

  // Match all img tags with placeholders
  const imgRegex = /<img[^>]*src=["'](\[IMAGE_PLACEHOLDER_\d+\])["'][^>]*alt=["']([^"']+)["'][^>]*>/gi;
  let match;

  let index = 0;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const placeholder = match[1];
    const alt = match[2];

    // Extract context (50 chars before and after)
    const matchIndex = match.index;
    const contextBefore = htmlContent
      .substring(Math.max(0, matchIndex - 200), matchIndex)
      .replace(/<[^>]+>/g, '')
      .trim();
    const contextAfter = htmlContent
      .substring(matchIndex + match[0].length, matchIndex + match[0].length + 200)
      .replace(/<[^>]+>/g, '')
      .trim();

    images.push({
      position: `position-${index}`,
      placeholder,
      prompt: '', // Will be filled by content generator
      alt,
      contextBefore,
      contextAfter,
    });

    index++;
  }

  return images;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Default export
export default generateImages;
