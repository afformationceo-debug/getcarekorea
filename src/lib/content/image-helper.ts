/**
 * Image Generation & Alt Tag Helper
 *
 * Handles contextual image generation with DALL-E 3
 * and automatic alt tag generation for SEO and accessibility.
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
 * Generate images using DALL-E 3 with context-aware prompts
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

  const generatedImages: GeneratedImage[] = [];
  const errors: Array<{ placeholder: string; error: string }> = [];
  let totalCost = 0;

  console.log(`\n🎨 Generating ${images.length} images with DALL-E 3...`);

  for (const imageMetadata of images) {
    try {
      console.log(`\n  📷 ${imageMetadata.placeholder}`);
      console.log(`     Prompt: ${imageMetadata.prompt.substring(0, 80)}...`);

      // Enhance prompt with style and quality guidelines
      const enhancedPrompt = enhanceImagePrompt(imageMetadata.prompt, {
        keyword,
        locale,
        style,
      });

      // Generate image with DALL-E 3
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        style,
      });

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

      const validation = validateAltText(enhancedAlt);
      if (!validation.valid) {
        console.log(`     ⚠️  Alt text warnings:`, validation.warnings);
      }

      generatedImages.push({
        placeholder: imageMetadata.placeholder,
        url: imageUrl,
        alt: enhancedAlt,
        prompt: imageMetadata.prompt,
        revised_prompt: revisedPrompt,
        size,
        quality,
      });

      // Calculate cost (as of 2024 pricing)
      const imageCost = quality === 'hd' ? 0.080 : 0.040;
      totalCost += imageCost;

      console.log(`     ✅ Generated: ${imageUrl.substring(0, 50)}...`);
      console.log(`     Alt: ${enhancedAlt.substring(0, 80)}...`);

      // Rate limiting: DALL-E 3 has strict rate limits
      // Wait 2 seconds between requests to avoid hitting limits
      if (images.indexOf(imageMetadata) < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`     ❌ Error: ${error.message}`);
      errors.push({
        placeholder: imageMetadata.placeholder,
        error: error.message,
      });
    }
  }

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
 * Enhance DALL-E prompt with style and quality guidelines
 */
function enhanceImagePrompt(
  basePrompt: string,
  context: {
    keyword: string;
    locale: string;
    style: 'vivid' | 'natural';
  }
): string {
  let enhanced = basePrompt;

  // Add style guidance
  if (context.style === 'natural') {
    enhanced += ', professional photography style, natural lighting, realistic';
  } else {
    enhanced += ', vibrant colors, dynamic composition, eye-catching';
  }

  // Add medical content guidelines
  if (/surgery|medical|hospital|clinic|doctor|patient/i.test(basePrompt)) {
    enhanced += ', medical accuracy, professional healthcare setting, clean and modern';
  }

  // Add location context if relevant
  if (/korea|seoul|korean/i.test(context.keyword.toLowerCase())) {
    if (!/(korea|seoul|korean)/i.test(basePrompt)) {
      enhanced += ', Seoul South Korea';
    }
  }

  // Ensure quality descriptors
  enhanced += ', high quality, detailed, professional';

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

// =====================================================
// EXPORTS
// =====================================================

export {
  generateImages as default,
  generateImages,
  enhanceAltText,
  validateAltText,
  injectImagesIntoHTML,
  extractImageMetadata,
};
