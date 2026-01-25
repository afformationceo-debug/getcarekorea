/**
 * Imagen 4 Image Generation Pipeline
 *
 * ⚠️ IMPORTANT: GetCareKorea uses Google Imagen 4 for ALL image generation
 * DO NOT use DALL-E, Flux, or other models.
 *
 * Model: google/imagen-4 (via Replicate API)
 * @see https://replicate.com/google/imagen-4/api
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Imagen4Client, IMAGEN4_CONFIG } from './imagen4-client';
import type { Locale } from '@/lib/i18n/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// =====================================================
// TYPES
// =====================================================

export interface ImagePipelineOptions {
  blogPostId: string;
  title: string;
  excerpt: string;
  category: string;
  locale: Locale;
  keyword?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface ImagePipelineResult {
  success: boolean;
  imageUrl?: string;
  thumbnailUrl?: string;
  generationId?: string;
  prompt?: string;
  error?: string;
  timeMs?: number;
  model?: string;
}

export interface BatchImageResult {
  total: number;
  successful: number;
  failed: number;
  results: {
    blogPostId: string;
    success: boolean;
    imageUrl?: string;
    error?: string;
  }[];
}

// =====================================================
// SINGLETON CLIENT
// =====================================================

let imagen4Client: Imagen4Client | null = null;

function getImagen4Client(): Imagen4Client | null {
  if (!process.env.REPLICATE_API_TOKEN) {
    return null;
  }
  if (!imagen4Client) {
    imagen4Client = new Imagen4Client();
  }
  return imagen4Client;
}

// =====================================================
// PROMPT GENERATION
// =====================================================

/**
 * Generate image prompt from blog post metadata
 */
function generatePromptFromContent(options: ImagePipelineOptions): string {
  const { title, excerpt, category, keyword } = options;

  // Base prompt from title and excerpt
  let prompt = `Professional medical photography for blog post titled "${title}".`;

  if (excerpt) {
    prompt += ` Context: ${excerpt.substring(0, 200)}`;
  }

  // Category-specific additions
  const categoryPrompts: Record<string, string> = {
    'Dermatology': 'Featuring modern Korean dermatology clinic, skin treatment procedure, dermatologist consultation.',
    'Plastic Surgery': 'Featuring premium Korean plastic surgery clinic, consultation room, before/after documentation.',
    'Dentistry': 'Featuring advanced Korean dental clinic, dental treatment, modern dental equipment.',
    'Health Checkup': 'Featuring comprehensive health screening center, medical examination, health diagnostic equipment.',
    'Hair Transplant': 'Featuring Korean hair restoration clinic, hair transplant procedure, follicle extraction.',
    'General': 'Featuring modern Korean medical facility, patient care, professional healthcare.',
  };

  prompt += ' ' + (categoryPrompts[category] || categoryPrompts['General']);

  // Add keyword if provided
  if (keyword) {
    prompt += ` Related to ${keyword} treatment in Korea.`;
  }

  return prompt;
}

/**
 * Generate alt text for SEO
 */
function generateAltText(options: ImagePipelineOptions): string {
  const { title, category, keyword } = options;

  let alt = `${category} treatment`;
  if (keyword) {
    alt += ` for ${keyword}`;
  }
  alt += ` at premium Korean medical clinic - ${title}`;

  // Ensure alt text is within 10-25 words
  const words = alt.split(/\s+/);
  if (words.length > 25) {
    alt = words.slice(0, 25).join(' ') + '...';
  }

  return alt;
}

// =====================================================
// IMAGE PIPELINE
// =====================================================

/**
 * Run image generation pipeline for a single blog post
 *
 * ⚠️ Uses Google Imagen 4 - DO NOT change to DALL-E or Flux
 */
export async function runImagePipeline(
  supabase: AnySupabaseClient,
  options: ImagePipelineOptions
): Promise<ImagePipelineResult> {
  const startTime = Date.now();
  const client = getImagen4Client();

  if (!client) {
    return {
      success: false,
      error: 'Imagen 4 client not configured (REPLICATE_API_TOKEN missing)',
      timeMs: Date.now() - startTime,
    };
  }

  try {
    // 1. Generate prompt
    const prompt = generatePromptFromContent(options);
    const altText = generateAltText(options);

    console.log(`\n🎨 Imagen 4 Pipeline: Generating image for ${options.blogPostId}`);
    console.log(`   Category: ${options.category}`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    // 2. Create image generation record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: generation, error: insertError } = await (supabase
      .from('image_generations') as any)
      .insert({
        blog_post_id: options.blogPostId,
        prompt: prompt,
        model: IMAGEN4_CONFIG.MODEL,
        status: 'generating',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create image generation record:', insertError);
    }

    // 3. Generate image with Imagen 4
    const response = await client.generateImage({
      prompt,
      aspectRatio: options.aspectRatio || '16:9',
      outputFormat: 'webp',
      outputQuality: 90,
    });

    if (!response.success || !response.imageUrl) {
      // Update record as failed
      if (generation?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('image_generations') as any)
          .update({
            status: 'failed',
            error_message: response.error,
          })
          .eq('id', generation.id);
      }

      return {
        success: false,
        prompt,
        error: response.error || 'Image generation failed',
        timeMs: Date.now() - startTime,
        model: IMAGEN4_CONFIG.MODEL,
      };
    }

    // 4. Upload to Supabase Storage
    const storedUrl = await uploadToStorage(
      supabase,
      response.imageUrl,
      options.blogPostId,
      `cover-${Date.now()}`
    );

    // 5. Update blog post with cover image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('blog_posts') as any)
      .update({
        cover_image_url: storedUrl,
        cover_image_alt: altText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.blogPostId);

    // 6. Update generation record as completed
    if (generation?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('image_generations') as any)
        .update({
          status: 'completed',
          image_url: storedUrl,
          generation_time_ms: Date.now() - startTime,
        })
        .eq('id', generation.id);
    }

    console.log(`   ✅ Image generated successfully`);
    console.log(`   URL: ${storedUrl.substring(0, 80)}...`);

    return {
      success: true,
      imageUrl: storedUrl,
      prompt,
      generationId: generation?.id,
      timeMs: Date.now() - startTime,
      model: IMAGEN4_CONFIG.MODEL,
    };
  } catch (error) {
    console.error('Image pipeline error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: Date.now() - startTime,
      model: IMAGEN4_CONFIG.MODEL,
    };
  }
}

/**
 * Run batch image generation
 */
export async function runBatchImagePipeline(
  supabase: AnySupabaseClient,
  blogPostIds: string[],
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<BatchImageResult> {
  const { concurrency = IMAGEN4_CONFIG.MAX_CONCURRENT, onProgress } = options;

  const result: BatchImageResult = {
    total: blogPostIds.length,
    successful: 0,
    failed: 0,
    results: [],
  };

  console.log(`\n🎨 Imagen 4 Batch Pipeline: ${blogPostIds.length} posts`);
  console.log(`   Concurrency: ${concurrency}`);

  // Fetch blog post info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: posts, error } = await (supabase.from('blog_posts') as any)
    .select('id, title_en, excerpt_en, category')
    .in('id', blogPostIds);

  if (error || !posts) {
    result.failed = blogPostIds.length;
    result.results = blogPostIds.map(id => ({
      blogPostId: id,
      success: false,
      error: 'Failed to fetch blog posts',
    }));
    return result;
  }

  // Process in batches
  for (let i = 0; i < posts.length; i += concurrency) {
    const batch = posts.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (post: { id: string; title_en: string; excerpt_en: string; category: string }) => {
        const pipelineResult = await runImagePipeline(supabase, {
          blogPostId: post.id,
          title: post.title_en || 'Untitled',
          excerpt: post.excerpt_en || '',
          category: post.category || 'general',
          locale: 'en',
        });

        return {
          blogPostId: post.id,
          success: pipelineResult.success,
          imageUrl: pipelineResult.imageUrl,
          error: pipelineResult.error,
        };
      })
    );

    for (const res of batchResults) {
      result.results.push(res);
      if (res.success) {
        result.successful++;
      } else {
        result.failed++;
      }
    }

    if (onProgress) {
      onProgress(result.successful + result.failed, result.total);
    }

    // Delay between batches
    if (i + concurrency < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Batch complete: ${result.successful}/${result.total} succeeded`);

  return result;
}

// =====================================================
// STORAGE FUNCTIONS
// =====================================================

/**
 * Upload image to Supabase Storage
 */
async function uploadToStorage(
  supabase: AnySupabaseClient,
  imageUrl: string,
  blogPostId: string,
  fileName: string
): Promise<string> {
  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);

    // Generate file path
    const sanitizedFileName = fileName.replace(/[^a-z0-9-]/gi, '-').substring(0, 50);
    const filePath = `blog/${blogPostId}/${sanitizedFileName}.webp`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, uint8Array, {
        contentType: 'image/webp',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      // Return original URL as fallback (note: Replicate URLs may expire)
      return imageUrl;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Storage upload failed:', error);
    return imageUrl;
  }
}

/**
 * Delete stored image
 */
export async function deleteStoredImage(
  supabase: AnySupabaseClient,
  blogPostId: string
): Promise<boolean> {
  try {
    const { data: files } = await supabase.storage
      .from('blog-images')
      .list(`blog/${blogPostId}`);

    if (files && files.length > 0) {
      const filePaths = files.map(f => `blog/${blogPostId}/${f.name}`);
      await supabase.storage.from('blog-images').remove(filePaths);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete stored image:', error);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get posts that need images
 */
export async function getPostsNeedingImages(
  supabase: AnySupabaseClient,
  options: {
    status?: string;
    limit?: number;
  } = {}
): Promise<{ id: string; title: string }[]> {
  const { status = 'published', limit = 50 } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: posts } = await (supabase.from('blog_posts') as any)
    .select('id, title_en')
    .eq('status', status)
    .is('cover_image_url', null)
    .limit(limit);

  return (posts || []).map((p: { id: string; title_en: string }) => ({
    id: p.id,
    title: p.title_en,
  }));
}

/**
 * Get image generation status for a blog post
 */
export async function getImageGenerationStatus(
  supabase: AnySupabaseClient,
  blogPostId: string
): Promise<{
  hasImage: boolean;
  latestGeneration?: {
    status: string;
    imageUrl?: string;
    createdAt: string;
    model: string;
  };
}> {
  // Check blog post
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: post } = await (supabase.from('blog_posts') as any)
    .select('cover_image_url')
    .eq('id', blogPostId)
    .single();

  // Check latest generation record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: generation } = await (supabase.from('image_generations') as any)
    .select('status, image_url, created_at, model')
    .eq('blog_post_id', blogPostId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    hasImage: !!post?.cover_image_url,
    latestGeneration: generation ? {
      status: generation.status,
      imageUrl: generation.image_url,
      createdAt: generation.created_at,
      model: generation.model || IMAGEN4_CONFIG.MODEL,
    } : undefined,
  };
}
