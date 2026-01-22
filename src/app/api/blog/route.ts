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

// Map locale to database field suffix
const localeFieldMap: Record<string, string> = {
  en: 'en',
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

    // Build query
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null);

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

    // Transform data with locale-specific fields (excluding content for list view)
    const posts = (data || []).map(post => {
      const transformed = transformBlogPost(post, locale);
      // Remove content for list view to reduce payload
      const { content_en, content_zh_tw, content_zh_cn, content_ja, content_th, content_mn, content_ru, content, ...rest } = transformed;
      return rest;
    });

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
