/**
 * Async Content Generation API
 *
 * POST /api/content/generate-async - Start async content generation
 *
 * Uses the unified content generation pipeline (same as cron auto-generate).
 * This ensures consistent content quality and style across all generation methods.
 */

export const maxDuration = 300; // 5 minutes

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
  validateRequired,
} from '@/lib/api/error-handler';
import {
  runContentGenerationPipeline,
  type ContentGenerationInput,
} from '@/lib/content/content-generation-pipeline';

export async function POST(request: NextRequest) {
  const requestId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;

  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Parse request body
    const body = await request.json();
    validateRequired(body, ['keyword_id'], locale);

    const {
      keyword_id,
      include_rag = true,
      include_images = true,
      image_count = 3,
      auto_publish = false,
    } = body;

    // Get keyword from database
    const { data: keyword, error: keywordError } = await (adminSupabase.from('content_keywords') as ReturnType<typeof adminSupabase.from>)
      .select('*')
      .eq('id', keyword_id)
      .single();

    if (keywordError || !keyword) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { keyword_id }, locale);
    }

    // Check if already generating
    if (keyword.status === 'generating') {
      return createSuccessResponse({
        success: true,
        status: 'already_generating',
        keyword_id,
        message: 'Content generation is already in progress',
      });
    }

    // Update keyword status to 'generating' immediately
    await (adminSupabase.from('content_keywords') as ReturnType<typeof adminSupabase.from>)
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('id', keyword_id);

    secureLog('info', 'Starting content generation (unified pipeline)', {
      requestId,
      keywordId: keyword_id,
      keyword: keyword.keyword,
      locale: keyword.locale,
      generatedBy: user.id,
    });

    // Prepare pipeline input
    const pipelineInput: ContentGenerationInput = {
      keywordId: keyword_id,
      keyword: keyword.keyword,
      locale: keyword.locale || 'en',
      category: keyword.category || 'general',
      includeRAG: include_rag,
      includeImages: include_images,
      imageCount: image_count,
      autoPublish: auto_publish,
    };

    // Run the unified pipeline (same as cron)
    const result = await runContentGenerationPipeline(
      adminSupabase,
      pipelineInput,
      { requestId }
    );

    if (result.success) {
      secureLog('info', 'Content generation completed', {
        requestId,
        keywordId: keyword_id,
        blogPostId: result.blogPostId,
        authorSlug: result.authorSlug,
        imagesGenerated: result.imagesGenerated,
      });

      return createSuccessResponse({
        success: true,
        status: 'completed',
        keyword_id,
        blog_post_id: result.blogPostId,
        author_slug: result.authorSlug,
        title: result.title,
        cover_image_url: result.coverImageUrl,
        images_generated: result.imagesGenerated,
        total_cost: result.totalCost,
        message: 'Content generation completed successfully.',
      });
    } else {
      secureLog('error', 'Content generation failed', {
        requestId,
        keywordId: keyword_id,
        error: result.error,
        validationErrors: result.validationErrors,
      });

      // Pipeline already handles rollback to 'pending' status
      throw new APIError(
        ErrorCode.INTERNAL_ERROR,
        result.error || 'Content generation failed. Please try again.',
        { validationErrors: result.validationErrors },
        locale
      );
    }

  } catch (error) {
    secureLog('error', 'Content generation API error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return createErrorResponse(error);
  }
}
