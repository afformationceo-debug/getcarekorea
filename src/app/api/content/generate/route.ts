/**
 * Content Generation API (Single Language)
 *
 * POST /api/content/generate - Generate content in target language only
 *
 * 키워드의 타겟 언어로만 콘텐츠 생성 (자동 번역 제거)
 * - Performance: 78% faster (4.5x speed improvement)
 * - Cost: 68% reduction
 * - Quality: Native content, not translations
 *
 * ⚠️ IMAGE GENERATION: Uses Google Imagen 4 via Replicate API
 * DO NOT change to DALL-E, Flux, or other models.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateSingleLanguageContent } from '@/lib/content/single-content-generator';
// ⚠️ IMPORTANT: Use Imagen 4 for image generation (NOT DALL-E or Flux)
import {
  generateImagen4Images,
  insertImagesIntoContent,
  type ImageMetadata,
  IMAGE_GENERATION_CONFIG,
} from '@/lib/content/imagen4-helper';
import type { Locale } from '@/lib/content/multi-language-generator';

export const maxDuration = 300; // 5 minutes (increased for image generation)

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // 1. Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const {
      keyword,
      locale,
      category = 'general',
      includeRAG = true,
      includeImages = true,
      imageCount = 3,
      autoSave = true,
      additionalInstructions,
    } = body;

    // Validation
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: 'keyword is required and must be a string'
        },
        { status: 400 }
      );
    }

    if (!locale || typeof locale !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: 'locale is required and must be a string'
        },
        { status: 400 }
      );
    }

    // Validate locale
    const validLocales: Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];
    if (!validLocales.includes(locale as Locale)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: `locale must be one of: ${validLocales.join(', ')}`
        },
        { status: 400 }
      );
    }

    console.log(`\n🚀 Content generation request`);
    console.log(`   User: ${user.email}`);
    console.log(`   Keyword: ${keyword}`);
    console.log(`   Locale: ${locale}`);
    console.log(`   Category: ${category}`);

    // 3. Select Author (DB 통역사 - Cron과 동일한 로직)
    // Schema uses JSONB: name = {"en": "...", "ko": "..."}, bio_short = {"en": "...", "ko": "..."}
    const adminClient = await createAdminClient();
    let dbAuthorForContent: {
      id: string;
      slug: string;
      name_en: string;
      name_ko: string;
      years_of_experience: number;
      primary_specialty: string;
      languages: Array<{ code: string; proficiency: string }>;
      bio_short_en?: string | null;
      bio_short_ko?: string | null;
    } | undefined = undefined;
    let authorPersonaId: string | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: personas } = await (adminClient.from('author_personas') as any)
        .select('id, slug, name, languages, primary_specialty, years_of_experience, total_posts, bio_short')
        .eq('is_active', true);

      if (personas && personas.length > 0) {
        // Filter personas who speak this locale's language
        const matchingPersonas = personas.filter((p: { languages: Array<{ code: string }> }) => {
          if (!p.languages || !Array.isArray(p.languages)) return false;
          return p.languages.some((lang: { code: string }) => lang.code === locale);
        });

        if (matchingPersonas.length > 0) {
          // 1순위: specialty 매칭 + 가장 적은 posts
          const specialtyMatched = matchingPersonas.filter(
            (p: { primary_specialty: string }) => p.primary_specialty === category
          );

          let candidates = specialtyMatched.length > 0 ? specialtyMatched : matchingPersonas;

          // total_posts 기준 정렬 (Round Robin)
          candidates.sort(
            (a: { total_posts: number }, b: { total_posts: number }) =>
              (a.total_posts || 0) - (b.total_posts || 0)
          );

          const selectedPersona = candidates[0];
          authorPersonaId = selectedPersona.id;

          // Extract from JSONB fields
          const nameObj = selectedPersona.name || {};
          const bioShortObj = selectedPersona.bio_short || {};
          dbAuthorForContent = {
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

          console.log(`   ✅ Author (DB): ${selectedPersona.slug} (language: ${locale}, specialty: ${selectedPersona.primary_specialty})`);
        } else {
          console.warn(`   ⚠️  No author persona found for locale: ${locale}`);
        }
      }
    } catch (personaError: unknown) {
      console.warn(`   ⚠️  Could not find author persona:`, personaError instanceof Error ? personaError.message : 'Unknown error');
    }

    // 4. Generate content (single language only)
    const generatedContent = await generateSingleLanguageContent({
      keyword,
      locale: locale as Locale,
      category,
      includeRAG,
      includeImages,
      imageCount,
      additionalInstructions,
      dbAuthorPersona: dbAuthorForContent, // ✅ 실제 통역사 정보 전달
    });

    // 5. Generate images with Google Imagen 4 (via Replicate API)
    // ⚠️ IMPORTANT: Always use Imagen 4 - DO NOT change to DALL-E or Flux
    let finalContent = generatedContent.content;
    let generatedImageResults: Array<{ url: string; alt: string; placeholder: string }> = [];
    let totalImageCost = 0;

    if (includeImages && generatedContent.images && generatedContent.images.length > 0) {
      console.log(`   🎨 Generating ${generatedContent.images.length} images with ${IMAGE_GENERATION_CONFIG.MODEL}...`);

      try {
        const imageMetadata: ImageMetadata[] = generatedContent.images.map(img => ({
          position: img.position,
          placeholder: img.placeholder,
          prompt: img.prompt,
          alt: img.alt,
          caption: img.caption,
        }));

        // Generate images with Imagen 4
        // ⚠️ Imagen 4 only supports jpg/png (NOT webp)
        const imageResult = await generateImagen4Images({
          images: imageMetadata,
          keyword,
          locale,
          aspectRatio: '16:9',      // Widescreen for blog posts
          outputFormat: 'png',      // Imagen 4 only supports jpg/png
          outputQuality: 90,        // High quality
        });

        generatedImageResults = imageResult.images;
        totalImageCost = imageResult.total_cost;

        // Inject generated images into HTML content
        if (imageResult.images.length > 0) {
          // Create caption map
          const captions: Record<string, string> = {};
          generatedContent.images.forEach(img => {
            if (img.caption) {
              captions[img.placeholder] = img.caption;
            }
          });

          finalContent = insertImagesIntoContent(generatedContent.content, imageResult.images, captions);
          console.log(`   ✅ ${imageResult.images.length} images generated with Imagen 4 and injected`);
        }

        if (imageResult.errors.length > 0) {
          console.warn(`   ⚠️  ${imageResult.errors.length} images failed to generate`);
          imageResult.errors.forEach(err => console.warn(`      - ${err.placeholder}: ${err.error}`));
        }
      } catch (imageError: unknown) {
        console.error(`   ❌ Image generation failed:`, imageError instanceof Error ? imageError.message : imageError);
        // Continue without images - don't fail the entire request
      }
    }

    // 6. Save to database if requested
    let savedDraft = null;
    const totalCost = generatedContent.estimatedCost + totalImageCost;

    if (autoSave) {
      console.log(`   💾 Saving to database...`);

      // ✅ Author는 이미 위에서 선택됨 (authorPersonaId, dbAuthorForContent)

      // Generate slug from keyword
      const slug = `${keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now()}`;

      // Prepare blog_posts insert (simplified schema)
      // Use single title/content/excerpt columns with locale field
      const blogPostData: Record<string, unknown> = {
        slug,
        locale, // Language code (en, ko, ja, zh-CN, etc.)

        // Single locale content fields
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        content: finalContent, // With images injected

        // SEO meta as JSONB (comprehensive SEO fields)
        seo_meta: {
          meta_title: generatedContent.metaTitle,
          meta_description: generatedContent.metaDescription,
          meta_keywords: generatedContent.tags?.join(', ') || '',
          meta_author: dbAuthorForContent?.name_en || 'GetCareKorea',
          robots: 'index, follow',
          og_title: generatedContent.metaTitle || generatedContent.title,
          og_description: generatedContent.metaDescription || generatedContent.excerpt,
          og_type: 'article',
          twitter_card: 'summary_large_image',
          twitter_title: generatedContent.metaTitle || generatedContent.title,
          twitter_description: generatedContent.metaDescription || generatedContent.excerpt,
        },

        // Common fields
        category,
        tags: generatedContent.tags,
        author_persona_id: authorPersonaId, // Link to author_personas (interpreter)
        status: 'draft',

        // Generation metadata (JSONB)
        generation_metadata: {
          keyword,
          locale,
          estimatedCost: totalCost,
          generationTimestamp: generatedContent.generationTimestamp,
          includeRAG,
          includeImages,
          imageCount,
          author: generatedContent.author,
          aiSummary: generatedContent.aiSummary,
          faqSchema: generatedContent.faqSchema,
          howToSchema: generatedContent.howToSchema,
          images: generatedContent.images,
          generatedImages: generatedImageResults,
          imageCost: totalImageCost,
          internalLinks: generatedContent.internalLinks || [],
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: draft, error: saveError } = await (adminClient.from('blog_posts') as any)
        .insert(blogPostData)
        .select()
        .single();

      if (saveError) {
        console.error(`   ❌ Database save failed:`, saveError.message);

        // Don't fail the entire request if save fails
        // Return success with warning
        return NextResponse.json(
          {
            success: true,
            warning: 'Content generated but failed to save to database',
            content: generatedContent,
            saved: false,
            meta: {
              estimatedCost: generatedContent.estimatedCost,
              generationTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
              generatedAt: generatedContent.generationTimestamp,
            }
          },
          { status: 200 }
        );
      }

      savedDraft = draft;
      console.log(`   ✅ Saved to database: ${draft.id}`);

      // Update keyword status and link to blog post (use admin client for RLS bypass)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: keywordUpdateError } = await (adminClient.from('content_keywords') as any)
        .update({
          blog_post_id: draft.id,
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('keyword', keyword)
        .eq('locale', locale);

      if (keywordUpdateError) {
        console.warn(`   ⚠️  Failed to update keyword status:`, keywordUpdateError.message);
      } else {
        console.log(`   ✅ Keyword status updated to 'generated'`);
      }
    }

    // 6. Return success response
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Content generation complete!`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   Content cost: $${generatedContent.estimatedCost.toFixed(4)}`);
    console.log(`   Image cost: $${totalImageCost.toFixed(4)}`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   Images generated: ${generatedImageResults.length}`);
    console.log(`   Saved: ${autoSave && savedDraft ? 'Yes' : 'No'}`);

    return NextResponse.json(
      {
        success: true,
        content: {
          id: savedDraft?.id,
          keyword,
          locale,
          category,
          title: generatedContent.title,
          excerpt: generatedContent.excerpt,
          content: finalContent,
          contentFormat: 'html',
          metaTitle: generatedContent.metaTitle,
          metaDescription: generatedContent.metaDescription,
          author: generatedContent.author,
          tags: generatedContent.tags,
          faqSchema: generatedContent.faqSchema,
          howToSchema: generatedContent.howToSchema,
          images: generatedContent.images,
          generatedImages: generatedImageResults,
          internalLinks: generatedContent.internalLinks,
        },
        saved: autoSave && !!savedDraft,
        meta: {
          estimatedCost: totalCost,
          contentCost: generatedContent.estimatedCost,
          imageCost: totalImageCost,
          imagesGenerated: generatedImageResults.length,
          generationTime: `${totalTime}s`,
          generatedAt: generatedContent.generationTimestamp,
          savedToDraft: autoSave && !!savedDraft,
          draftId: savedDraft?.id || null,
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.error(`\n❌ Content generation failed (${totalTime}s):`, error.message);

    // Security: Generic error message, no sensitive details
    // Log full error internally, return safe message to client
    const isDevelopment = process.env.NODE_ENV === 'development';

    return NextResponse.json(
      {
        error: 'Content generation failed',
        code: 'GENERATION_ERROR',
        message: isDevelopment ? error.message : 'An error occurred during content generation. Please try again.',
        timestamp: new Date().toISOString(),
        // Only include stack trace in development
        ...(isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
