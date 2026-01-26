/**
 * Blog API
 *
 * GET /api/blog - List blog posts with filtering and pagination
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';
import type { BlogPost } from '@/types/database';

// Enable edge runtime for faster cold starts
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 60 seconds

// Map locale to database field suffix
const localeFieldMap: Record<string, string> = {
  en: 'en',
  ko: 'ko',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  ja: 'ja',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
};

// Transform blog post to include localized fields
function transformBlogPost(post: BlogPost, locale: string) {
  const suffix = localeFieldMap[locale] || 'en';
  const titleKey = `title_${suffix}` as keyof BlogPost;
  const excerptKey = `excerpt_${suffix}` as keyof BlogPost;
  const contentKey = `content_${suffix}` as keyof BlogPost;

  return {
    ...post,
    title: (post[titleKey] as string) || post.title_en,
    excerpt: (post[excerptKey] as string | null) || post.excerpt_en,
    content: (post[contentKey] as string | null) || post.content_en,
    // Map cover_image_url to featured_image for frontend compatibility
    featured_image: (post as Record<string, unknown>).cover_image_url || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'published_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - select only required fields for list view (faster)
    const selectFields = [
      'id', 'slug', 'category', 'tags', 'author_id', 'cover_image_url',
      'published_at', 'view_count', 'status',
      'title_en', 'excerpt_en',
      'title_ko', 'excerpt_ko',
      'title_zh_tw', 'excerpt_zh_tw',
      'title_zh_cn', 'excerpt_zh_cn',
      'title_ja', 'excerpt_ja',
      'title_th', 'excerpt_th',
      'title_mn', 'excerpt_mn',
      'title_ru', 'excerpt_ru',
    ].join(',');

    let query = supabase
      .from('blog_posts')
      .select(selectFields, { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null);

    // CRITICAL: Filter by target_locale to show only locale-specific posts
    // This ensures US keywords show only in EN, Taiwan keywords only in zh-TW, etc.
    query = query.eq('target_locale', locale);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Text search
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(`title_en.ilike.${searchPattern},excerpt_en.ilike.${searchPattern}`);
    }

    // Apply sorting
    const validSortFields = ['published_at', 'view_count', 'title_en', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'published_at';
    query = query.order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const startTime = Date.now();
    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    secureLog('info', 'Blog posts query executed', {
      responseTimeMs: responseTime,
      recordCount: data?.length || 0,
      totalCount: count || 0,
    });

    if (error) {
      secureLog('error', 'Database error fetching blog posts', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    // Transform data with locale-specific fields
    const posts = (data || []).map(post => transformBlogPost(post, locale));

    return createSuccessResponse(posts, {
      page,
      limit,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
