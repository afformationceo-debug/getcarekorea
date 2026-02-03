/**
 * Blog API
 *
 * GET /api/blog - List blog posts with filtering and pagination
 *
 * Simplified schema: single title/content/excerpt columns with locale field
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

import { getCategoryName } from '@/lib/i18n/translations';

// Enable edge runtime for faster cold starts
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 60 seconds

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
    const search = searchParams.get('search');

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'published_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query - simplified schema (single title/content/excerpt)
    let query = supabase
      .from('blog_posts')
      .select(`
        id, slug, locale, category, tags, cover_image_url,
        published_at, view_count, status,
        title, excerpt,
        author_persona_id,
        seo_meta
      `, { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null);

    // Filter by locale to show only posts in the requested language
    query = query.eq('locale', locale);

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
      query = query.or(`title.ilike.${searchPattern},excerpt.ilike.${searchPattern},slug.ilike.${searchPattern}`);
    }

    // Apply sorting
    const validSortFields = ['published_at', 'view_count', 'title', 'created_at'];
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

    // Transform data for frontend compatibility
    interface BlogPostRow {
      id: string;
      slug: string;
      locale: string;
      category: string | null;
      tags: string[] | null;
      cover_image_url: string | null;
      published_at: string | null;
      view_count: number;
      status: string;
      title: string;
      excerpt: string | null;
      author_persona_id: string | null;
      seo_meta: { meta_title?: string; meta_description?: string } | null;
    }

    const posts = ((data || []) as BlogPostRow[]).map(post => ({
      ...post,
      // Map cover_image_url to featured_image for frontend compatibility
      featured_image: post.cover_image_url || null,
      // Translated category name
      categoryDisplayName: getCategoryName(post.category, locale),
      // Extract meta from seo_meta JSONB
      meta_title: post.seo_meta?.meta_title || post.title,
      meta_description: post.seo_meta?.meta_description || post.excerpt,
    }));

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
