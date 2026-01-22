/**
 * Content Generation Status API
 *
 * GET /api/content/generate-status?keyword_id=xxx - Check generation status
 */

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keyword_id');
    const locale = searchParams.get('locale') || 'en';

    if (!keywordId) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'keyword_id is required', undefined, locale);
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Get keyword status
    const { data: keyword, error: keywordError } = await (adminSupabase.from('content_keywords') as ReturnType<typeof adminSupabase.from>)
      .select('id, keyword, status, blog_post_id, quality_score, updated_at')
      .eq('id', keywordId)
      .single();

    if (keywordError || !keyword) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { keywordId }, locale);
    }

    // If generated, also get blog post info
    let blogPost = null;
    if (keyword.blog_post_id) {
      const { data: post } = await (adminSupabase.from('blog_posts') as ReturnType<typeof adminSupabase.from>)
        .select('id, slug, title_en, status, created_at')
        .eq('id', keyword.blog_post_id)
        .single();
      blogPost = post;
    }

    return createSuccessResponse({
      success: true,
      keyword_id: keyword.id,
      keyword: keyword.keyword,
      status: keyword.status,
      quality_score: keyword.quality_score,
      updated_at: keyword.updated_at,
      blog_post: blogPost,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
