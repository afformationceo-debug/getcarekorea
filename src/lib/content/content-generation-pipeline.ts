/**
 * Unified Content Generation Pipeline
 *
 * Single source of truth for content generation logic.
 * Used by both manual generation API and cron auto-generation.
 *
 * Pipeline steps:
 * 1. Fetch & select author persona (with retry)
 * 2. Validate all required data
 * 3. Generate content with Claude
 * 4. Generate images with Imagen 4
 * 5. Save to database
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { generateSingleLanguageContent } from './single-content-generator';
import {
  generateImagen4Images,
  insertImagesIntoContent,
  type ImageMetadata,
} from './imagen4-helper';
import type { Locale } from './multi-language-generator';

// =====================================================
// TYPES
// =====================================================

export interface ContentGenerationInput {
  keywordId: string;
  keyword: string;
  locale: string;
  category: string;
  includeRAG?: boolean;
  includeImages?: boolean;
  imageCount?: number;
  autoPublish?: boolean;
  additionalInstructions?: string;
}

export interface AuthorPersonaData {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  years_of_experience: number;
  primary_specialty: string;
  languages: Array<{ code: string; proficiency: string }>;
  bio_short_en?: string | null;
  bio_short_ko?: string | null;
}

export interface ContentGenerationResult {
  success: boolean;
  keywordId: string;
  keyword: string;
  locale: string;
  blogPostId?: string;
  authorPersonaId?: string;
  authorSlug?: string;
  title?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  imagesGenerated?: number;
  totalCost?: number;
  error?: string;
  validationErrors?: string[];
}

interface PipelineContext {
  requestId: string;
  supabase: SupabaseClient;
  input: ContentGenerationInput;
}

// =====================================================
// CONSTANTS
// =====================================================

const MAX_PERSONA_RETRIES = 5;
const VALID_LOCALES: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];

// Image generation config
const IMAGE_GENERATION_CONFIG = {
  MODEL: 'google/imagen-4',
  ASPECT_RATIO: '16:9' as const,
  OUTPUT_FORMAT: 'png' as const,
  OUTPUT_QUALITY: 90,
};

// =====================================================
// STEP 1: FETCH AUTHOR PERSONA (with retry)
// =====================================================

async function fetchAuthorPersona(
  ctx: PipelineContext,
  category: string,
  locale: string,
  assignedInBatch?: Map<string, number>
): Promise<{ authorPersonaId: string | null; authorData: AuthorPersonaData | null }> {
  const { requestId, supabase } = ctx;
  let authorPersonaId: string | null = null;
  let authorData: AuthorPersonaData | null = null;
  let retryCount = 0;

  while (!authorPersonaId && retryCount < MAX_PERSONA_RETRIES) {
    retryCount++;
    console.log(`   🔄 [${requestId}] Author persona fetch attempt ${retryCount}/${MAX_PERSONA_RETRIES}...`);

    try {
      // Fetch all active personas
      // Schema uses JSONB: name = {"en": "...", "ko": "..."}, bio_short = {"en": "...", "ko": "..."}
      // Get personas with dynamic post counts using the RPC function
      const { data: personas, error: personaError } = await supabase.rpc('get_authors_with_post_counts');

      if (personaError) {
        console.warn(`   ⚠️ [${requestId}] Error fetching personas (attempt ${retryCount}): ${personaError.message}`);
        if (retryCount < MAX_PERSONA_RETRIES) {
          await sleep(1000 * retryCount);
        }
        continue;
      }

      console.log(`   📋 [${requestId}] Found ${personas?.length || 0} active personas`);

      if (!personas || personas.length === 0) {
        console.warn(`   ⚠️ [${requestId}] No active personas found in database`);
        if (retryCount < MAX_PERSONA_RETRIES) {
          await sleep(1000 * retryCount);
        }
        continue;
      }

      // Filter personas by locale
      let matchingPersonas = personas.filter((p: { languages: Array<{ code: string }> }) => {
        if (!p.languages || !Array.isArray(p.languages)) return false;
        return p.languages.some((lang: { code: string }) => lang.code === locale);
      });

      console.log(`   📋 [${requestId}] ${matchingPersonas.length} personas match locale "${locale}"`);

      // Fallback logic on retry 3+
      if (matchingPersonas.length === 0 && retryCount >= 3) {
        console.log(`   🔄 [${requestId}] Trying fallback: looking for 'en' locale or any persona...`);

        // Try English locale
        matchingPersonas = personas.filter((p: { languages: Array<{ code: string }> }) => {
          if (!p.languages || !Array.isArray(p.languages)) return false;
          return p.languages.some((lang: { code: string }) => lang.code === 'en');
        });

        // If still none, use any persona
        if (matchingPersonas.length === 0) {
          matchingPersonas = personas;
          console.log(`   🔄 [${requestId}] Using any available persona as fallback`);
        }
      }

      if (matchingPersonas.length === 0) {
        console.warn(`   ⚠️ [${requestId}] No matching personas found (attempt ${retryCount})`);
        const availableLanguages = personas.flatMap((p: { languages: Array<{ code: string }> }) =>
          p.languages?.map((l: { code: string }) => l.code) || []
        );
        console.warn(`   Available languages: ${[...new Set(availableLanguages)].join(', ')}`);

        if (retryCount < MAX_PERSONA_RETRIES) {
          await sleep(1000 * retryCount);
        }
        continue;
      }

      // Calculate effective posts (for batch round-robin)
      // post_count comes from the RPC function (dynamic count from blog_posts)
      const personasWithBatchCount = matchingPersonas.map((p: any) => ({
        ...p,
        effectivePosts: (p.post_count || 0) + (assignedInBatch?.get(p.id) || 0),
      }));

      // Priority: specialty match + lowest posts
      const specialtyMatched = personasWithBatchCount.filter(
        (p: { primary_specialty: string }) => p.primary_specialty === category
      );

      let candidates = specialtyMatched.length > 0 ? specialtyMatched : personasWithBatchCount;

      // Sort by effective posts (Round Robin), or shuffle on retry
      if (retryCount > 1) {
        candidates = candidates.sort(() => Math.random() - 0.5);
      } else {
        candidates.sort((a: { effectivePosts: number }, b: { effectivePosts: number }) =>
          a.effectivePosts - b.effectivePosts
        );
      }

      const selectedPersona = candidates[0];
      authorPersonaId = selectedPersona.id;

      // Extract from JSONB fields
      const nameObj = selectedPersona.name || {};
      const bioShortObj = selectedPersona.bio_short || {};
      authorData = {
        id: selectedPersona.id,
        slug: selectedPersona.slug,
        name_en: nameObj.en || nameObj.ko || selectedPersona.slug,
        name_ko: nameObj.ko || nameObj.en || selectedPersona.slug,
        years_of_experience: selectedPersona.years_of_experience || 5,
        primary_specialty: selectedPersona.primary_specialty || 'general',
        languages: selectedPersona.languages || [],
        bio_short_en: bioShortObj.en,
        bio_short_ko: bioShortObj.ko,
      };

      console.log(`   ✅ [${requestId}] Author selected: ${selectedPersona.slug} (id: ${authorPersonaId})`);

    } catch (err) {
      console.warn(`   ⚠️ [${requestId}] Error in persona fetch (attempt ${retryCount}):`, err instanceof Error ? err.message : 'Unknown error');
      if (retryCount < MAX_PERSONA_RETRIES) {
        await sleep(1000 * retryCount);
      }
    }
  }

  if (!authorPersonaId) {
    console.error(`   ❌ [${requestId}] Failed to fetch author persona after ${MAX_PERSONA_RETRIES} attempts`);
  }

  return { authorPersonaId, authorData };
}

// =====================================================
// STEP 2: VALIDATE DATA
// =====================================================

interface ValidationResult {
  isValid: boolean;
  criticalErrors: string[];
  warnings: string[];
}

function validatePipelineInput(
  ctx: PipelineContext,
  authorPersonaId: string | null,
  authorData: AuthorPersonaData | null
): ValidationResult {
  const { requestId, input } = ctx;
  const { keyword, locale, includeImages } = input;

  console.log(`\n🔍 [${requestId}] PRE-GENERATION VALIDATION:`);

  const criticalErrors: string[] = [];
  const warnings: string[] = [];

  // Check keyword
  if (!keyword || keyword.trim().length === 0) {
    criticalErrors.push('Keyword is empty or missing');
  }

  // Check locale
  if (!locale || !VALID_LOCALES.includes(locale as Locale)) {
    criticalErrors.push(`Invalid locale: ${locale}. Must be one of: ${VALID_LOCALES.join(', ')}`);
  }

  // Check author persona (now required - rollback handled in main pipeline)
  if (!authorPersonaId) {
    criticalErrors.push('Author persona not found - cannot generate content without author');
  } else {
    console.log(`   ✅ Author Persona: ${authorData?.slug} (${authorPersonaId})`);
  }

  // Check author persona data completeness
  if (authorData) {
    if (!authorData.name_en && !authorData.name_ko) {
      warnings.push('Author persona has no name');
    }
    if (!authorData.years_of_experience) {
      warnings.push('Author persona has no years_of_experience, using default: 5');
    }
  }

  // Check API keys
  if (!process.env.ANTHROPIC_API_KEY) {
    criticalErrors.push('ANTHROPIC_API_KEY is not configured');
  } else {
    console.log(`   ✅ ANTHROPIC_API_KEY: Configured`);
  }

  if (includeImages && !process.env.REPLICATE_API_TOKEN) {
    warnings.push('REPLICATE_API_TOKEN not configured - images will NOT be generated');
  } else if (includeImages) {
    console.log(`   ✅ REPLICATE_API_TOKEN: Configured`);
  }

  // Log summary
  console.log(`   📊 Keyword: "${keyword}"`);
  console.log(`   📊 Locale: ${locale}`);
  console.log(`   📊 Category: ${input.category}`);
  console.log(`   📊 Include Images: ${includeImages} (count: ${input.imageCount || 3})`);

  if (criticalErrors.length > 0) {
    console.error(`   ❌ VALIDATION FAILED:`, criticalErrors);
  }

  if (warnings.length > 0) {
    console.warn(`   ⚠️ Validation warnings:`, warnings);
  }

  const isValid = criticalErrors.length === 0;
  if (isValid) {
    console.log(`   ✅ VALIDATION PASSED\n`);
  }

  return { isValid, criticalErrors, warnings };
}

// =====================================================
// STEP 3-5: GENERATE CONTENT, IMAGES, SAVE
// =====================================================

async function generateAndSaveContent(
  ctx: PipelineContext,
  authorPersonaId: string | null,
  authorData: AuthorPersonaData | null
): Promise<ContentGenerationResult> {
  const { requestId, supabase, input } = ctx;
  const {
    keywordId,
    keyword,
    locale,
    category,
    includeRAG = true,
    includeImages = true,
    imageCount = 3,
    autoPublish = false,
    additionalInstructions,
  } = input;

  try {
    // STEP 3: Generate content
    console.log(`\n📝 [${requestId}] Generating content...`);
    const generatedContent = await generateSingleLanguageContent({
      keyword,
      locale: locale as Locale,
      category,
      includeRAG,
      includeImages,
      imageCount,
      additionalInstructions,
      dbAuthorPersona: authorData || undefined,
    });

    // STEP 4: Generate images
    let finalContent = generatedContent.content;
    let generatedImageResults: Array<{ url: string; alt: string; placeholder: string }> = [];
    let totalImageCost = 0;

    console.log(`\n📸 [${requestId}] IMAGE GENERATION:`);
    console.log(`   includeImages: ${includeImages}`);
    console.log(`   images in content: ${generatedContent.images?.length || 0}`);
    console.log(`   REPLICATE_API_TOKEN: ${process.env.REPLICATE_API_TOKEN ? 'SET' : '❌ NOT SET'}`);

    if (includeImages && generatedContent.images && generatedContent.images.length > 0 && process.env.REPLICATE_API_TOKEN) {
      console.log(`   🎨 [${requestId}] Generating ${generatedContent.images.length} images with ${IMAGE_GENERATION_CONFIG.MODEL}...`);

      try {
        const imageMetadata: ImageMetadata[] = generatedContent.images.map(img => ({
          position: img.position,
          placeholder: img.placeholder,
          prompt: img.prompt,
          alt: img.alt,
          caption: img.caption,
        }));

        const imageResult = await generateImagen4Images({
          images: imageMetadata,
          keyword,
          locale,
          aspectRatio: IMAGE_GENERATION_CONFIG.ASPECT_RATIO,
          outputFormat: IMAGE_GENERATION_CONFIG.OUTPUT_FORMAT,
          outputQuality: IMAGE_GENERATION_CONFIG.OUTPUT_QUALITY,
        });

        generatedImageResults = imageResult.images;
        totalImageCost = imageResult.total_cost;

        if (imageResult.images.length > 0) {
          const captions: Record<string, string> = {};
          generatedContent.images.forEach(img => {
            if (img.caption) {
              captions[img.placeholder] = img.caption;
            }
          });

          finalContent = insertImagesIntoContent(generatedContent.content, imageResult.images, captions);
          console.log(`   ✅ [${requestId}] ${imageResult.images.length} images generated and injected`);
        }

        if (imageResult.errors.length > 0) {
          console.warn(`   ⚠️ [${requestId}] ${imageResult.errors.length} images failed to generate`);
        }
      } catch (imageError) {
        console.error(`   ❌ [${requestId}] Image generation failed:`, imageError instanceof Error ? imageError.message : imageError);
      }
    } else if (!process.env.REPLICATE_API_TOKEN) {
      console.log(`   ⏭️ [${requestId}] Skipping images: REPLICATE_API_TOKEN not configured`);
    }

    // STEP 5: Save to database
    console.log(`\n💾 [${requestId}] Saving to database...`);

    const coverImageUrl = generatedImageResults.length > 0 ? generatedImageResults[0].url : null;
    const coverImageAlt = generatedImageResults.length > 0 ? generatedImageResults[0].alt : null;
    const totalCost = generatedContent.estimatedCost + totalImageCost;

    const slug = generateSlug(generatedContent.title || keyword, locale);

    const blogPostData = {
      slug,
      locale,
      title: generatedContent.title,
      excerpt: generatedContent.excerpt,
      content: finalContent,
      category,
      tags: generatedContent.tags || [],
      status: autoPublish ? 'published' : 'draft',
      author_persona_id: authorPersonaId,
      cover_image_url: coverImageUrl,
      cover_image_alt: coverImageAlt,
      seo_meta: {
        meta_title: generatedContent.metaTitle,
        meta_description: generatedContent.metaDescription,
        og_title: generatedContent.metaTitle,
        og_description: generatedContent.metaDescription,
        og_image: coverImageUrl,
        twitter_title: generatedContent.metaTitle,
        twitter_description: generatedContent.metaDescription,
        twitter_image: coverImageUrl,
      },
      // Store faq, howto, links, cost in generation_metadata JSONB
      generation_metadata: {
        keyword,
        locale,
        category,
        generation_cost: totalCost,
        content_cost: generatedContent.estimatedCost,
        image_cost: totalImageCost,
        images_generated: generatedImageResults.length,
        faq_schema: generatedContent.faqSchema || [],
        howto_schema: generatedContent.howToSchema || [],
        internal_links: generatedContent.internalLinks || [],
        author_persona_id: authorPersonaId,
        author_slug: authorData?.slug,
        generated_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: autoPublish ? new Date().toISOString() : null,
    };

    const { data: savedPost, error: saveError } = await (supabase.from('blog_posts') as any)
      .insert(blogPostData)
      .select('id, slug, title')
      .single();

    if (saveError) {
      console.error(`   ❌ [${requestId}] Failed to save blog post:`, saveError.message);
      throw new Error(`Database save failed: ${saveError.message}`);
    }

    console.log(`   ✅ [${requestId}] Blog post saved: ${savedPost.id}`);

    // Update keyword status and link to blog post
    const keywordStatus = autoPublish ? 'published' : 'generated';
    const { error: keywordUpdateError } = await (supabase.from('content_keywords') as any)
      .update({
        status: keywordStatus,
        blog_post_id: savedPost.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId);

    if (keywordUpdateError) {
      console.warn(`   ⚠️ [${requestId}] Failed to update keyword status:`, keywordUpdateError.message);
    } else {
      console.log(`   ✅ [${requestId}] Keyword status updated to '${keywordStatus}'`);
    }

    // Note: total_posts is now calculated dynamically from blog_posts table
    // No need to update it manually

    return {
      success: true,
      keywordId,
      keyword,
      locale,
      blogPostId: savedPost.id,
      authorPersonaId: authorPersonaId || undefined,
      authorSlug: authorData?.slug,
      title: generatedContent.title,
      coverImageUrl: coverImageUrl || undefined,
      coverImageAlt: coverImageAlt || undefined,
      imagesGenerated: generatedImageResults.length,
      totalCost,
    };

  } catch (error) {
    console.error(`   ❌ [${requestId}] Content generation failed:`, error instanceof Error ? error.message : error);

    // Note: Rollback is now handled centrally in runContentGenerationPipeline
    // Re-throw to let the main function handle atomic rollback
    throw error;
  }
}

// =====================================================
// MAIN PIPELINE FUNCTION
// =====================================================

/**
 * Rollback keyword status to pending
 * Used when pipeline fails at any step to maintain atomic behavior
 */
async function rollbackKeywordStatus(
  supabase: SupabaseClient,
  keywordId: string,
  requestId: string,
  reason: string
): Promise<void> {
  console.log(`   🔄 [${requestId}] ROLLBACK: Resetting keyword status to 'pending' (reason: ${reason})`);

  try {
    const { error } = await (supabase.from('content_keywords') as any)
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId);

    if (error) {
      console.error(`   ❌ [${requestId}] Rollback failed:`, error.message);
    } else {
      console.log(`   ✅ [${requestId}] Rollback successful: keyword status reset to 'pending'`);
    }
  } catch (rollbackError) {
    console.error(`   ❌ [${requestId}] Rollback exception:`, rollbackError instanceof Error ? rollbackError.message : rollbackError);
  }
}

/**
 * Run the complete content generation pipeline
 *
 * @param supabase - Supabase client (admin client recommended for RLS bypass)
 * @param input - Content generation input parameters
 * @param options - Optional pipeline options
 * @returns Content generation result
 */
export async function runContentGenerationPipeline(
  supabase: SupabaseClient,
  input: ContentGenerationInput,
  options?: {
    requestId?: string;
    assignedInBatch?: Map<string, number>;
    preAssignedAuthorId?: string;
  }
): Promise<ContentGenerationResult> {
  const requestId = options?.requestId || `GEN-${Date.now().toString(36)}`;
  const { keyword, locale, category, keywordId } = input;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 [${requestId}] CONTENT GENERATION PIPELINE`);
  console.log(`   Keyword: "${keyword}"`);
  console.log(`   Locale: ${locale}`);
  console.log(`   Category: ${category}`);
  if (options?.preAssignedAuthorId) {
    console.log(`   Pre-assigned Author: ${options.preAssignedAuthorId}`);
  }
  console.log(`${'='.repeat(60)}`);

  const ctx: PipelineContext = { requestId, supabase, input };

  try {
    let authorPersonaId: string | null = null;
    let authorData: AuthorPersonaData | null = null;

    // STEP 1: Fetch author persona (or use pre-assigned)
    if (options?.preAssignedAuthorId) {
      console.log(`\n👤 [${requestId}] STEP 1: Using pre-assigned author persona...`);
      // Fetch the pre-assigned author's data
      const { data: preAssignedAuthor } = await (supabase.from('author_personas') as any)
        .select('*')
        .eq('id', options.preAssignedAuthorId)
        .single();

      if (preAssignedAuthor) {
        authorPersonaId = preAssignedAuthor.id;
        const nameObj = preAssignedAuthor.name || {};
        const bioShortObj = preAssignedAuthor.bio_short || {};
        authorData = {
          id: preAssignedAuthor.id,
          slug: preAssignedAuthor.slug,
          name_en: nameObj.en || '',
          name_ko: nameObj.ko || '',
          bio_short_en: bioShortObj.en || '',
          bio_short_ko: bioShortObj.ko || '',
          years_of_experience: preAssignedAuthor.years_of_experience || 0,
          primary_specialty: preAssignedAuthor.primary_specialty || '',
          languages: preAssignedAuthor.languages || [],
        };
        console.log(`   ✅ [${requestId}] Pre-assigned author loaded: ${preAssignedAuthor.slug}`);
      }
    }

    // Fallback to normal fetch if no pre-assigned or pre-assigned not found
    if (!authorPersonaId) {
      console.log(`\n👤 [${requestId}] STEP 1: Fetching author persona...`);
      const fetchResult = await fetchAuthorPersona(
        ctx,
        category,
        locale,
        options?.assignedInBatch
      );
      authorPersonaId = fetchResult.authorPersonaId;
      authorData = fetchResult.authorData;
    }

    // ATOMIC ROLLBACK: If author persona fetch failed after all retries
    if (!authorPersonaId) {
      console.error(`   ❌ [${requestId}] Author persona fetch failed - initiating atomic rollback`);
      await rollbackKeywordStatus(supabase, keywordId, requestId, 'author persona fetch failed');

      return {
        success: false,
        keywordId,
        keyword,
        locale,
        error: 'Failed to fetch author persona after maximum retries',
        validationErrors: ['No author persona available for content generation'],
      };
    }

    // STEP 2: Validate
    console.log(`\n🔍 [${requestId}] STEP 2: Validating input...`);
    const validation = validatePipelineInput(ctx, authorPersonaId, authorData);

    if (!validation.isValid) {
      // ATOMIC ROLLBACK: Validation failed
      console.error(`   ❌ [${requestId}] Validation failed - initiating atomic rollback`);
      await rollbackKeywordStatus(supabase, keywordId, requestId, 'validation failed');

      return {
        success: false,
        keywordId,
        keyword,
        locale,
        error: 'Validation failed',
        validationErrors: validation.criticalErrors,
      };
    }

    // STEP 3-5: Generate and save
    console.log(`\n📝 [${requestId}] STEP 3-5: Generating and saving content...`);
    const result = await generateAndSaveContent(ctx, authorPersonaId, authorData);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ [${requestId}] PIPELINE COMPLETE`);
    console.log(`   Success: ${result.success}`);
    if (result.blogPostId) console.log(`   Blog Post ID: ${result.blogPostId}`);
    if (result.totalCost) console.log(`   Total Cost: $${result.totalCost.toFixed(4)}`);
    console.log(`${'='.repeat(60)}\n`);

    return result;

  } catch (error) {
    console.error(`\n❌ [${requestId}] PIPELINE ERROR:`, error instanceof Error ? error.message : error);

    // ATOMIC ROLLBACK: Unexpected error
    await rollbackKeywordStatus(supabase, keywordId, requestId, 'unexpected pipeline error');

    return {
      success: false,
      keywordId,
      keyword,
      locale,
      error: error instanceof Error ? error.message : 'Unknown pipeline error',
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateSlug(title: string, locale: string): string {
  const timestamp = Date.now().toString(36);
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  return `${sanitized}-${locale}-${timestamp}`;
}

// Types are already exported at definition (lines 28, 52, 40)
