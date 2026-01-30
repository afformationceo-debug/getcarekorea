/**
 * Content Management API
 *
 * GET /api/content - Get all blog posts
 * PUT /api/content - Update blog post
 * DELETE /api/content - Delete blog post
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

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const locale = searchParams.get('locale');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Validate sortBy to prevent SQL injection
    // Simplified schema: single title column
    const validSortColumns = ['created_at', 'updated_at', 'view_count', 'title'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    // Build query (simplified schema)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminSupabase.from('blog_posts') as any)
      .select('*', { count: 'exact' })
      .order(safeSortBy, { ascending });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Language filter - use locale column (simplified schema)
    if (locale && locale !== 'all') {
      query = query.eq('locale', locale);
    }

    // Date range filters
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
    }

    // Search - simplified schema uses single title column
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `title.ilike.%${searchLower}%,` +
        `slug.ilike.%${searchLower}%,` +
        `excerpt.ilike.%${searchLower}%,` +
        `tags.cs.{${search}}`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      secureLog('error', 'Error fetching blog posts', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to fetch blog posts');
    }

    // Get statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: stats } = await (adminSupabase.from('blog_posts') as any)
      .select('status')
      .then(({ data }: { data: Array<{ status: string }> | null }) => {
        const statusCounts = {
          total: data?.length || 0,
          draft: data?.filter(p => p.status === 'draft').length || 0,
          review: data?.filter(p => p.status === 'review').length || 0,
          published: data?.filter(p => p.status === 'published').length || 0,
          archived: data?.filter(p => p.status === 'archived').length || 0,
        };
        return { data: statusCounts };
      });

    // Calculate total views and other aggregates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: aggregates } = await (adminSupabase.from('blog_posts') as any)
      .select('view_count')
      .then(({ data }: { data: Array<{ view_count: number }> | null }) => ({
        data: {
          totalViews: data?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0,
        }
      }));

    return createSuccessResponse({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        ...stats,
        ...aggregates,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminSupabase = await createAdminClient();
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Post ID is required');
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // If status is being changed to published, set published_at
    if (updateData.status === 'published') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingPost } = await (adminSupabase.from('blog_posts') as any)
        .select('published_at')
        .eq('id', id)
        .single();

      if (!existingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (adminSupabase.from('blog_posts') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      secureLog('error', 'Error updating blog post', { error: error.message, id });
      throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to update blog post');
    }

    // If this was linked to a keyword, update keyword status
    if (updateData.status === 'published') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminSupabase.from('content_keywords') as any)
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('blog_post_id', id);
    }

    secureLog('info', 'Blog post updated', { id, status: updateData.status });

    return createSuccessResponse({
      post,
      message: 'Blog post updated successfully',
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminSupabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'Post ID is required');
    }

    // First, unlink from any keywords
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase.from('content_keywords') as any)
      .update({ blog_post_id: null, status: 'pending' })
      .eq('blog_post_id', id);

    // Delete the blog post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminSupabase.from('blog_posts') as any)
      .delete()
      .eq('id', id);

    if (error) {
      secureLog('error', 'Error deleting blog post', { error: error.message, id });
      throw new APIError(ErrorCode.DATABASE_ERROR, 'Failed to delete blog post');
    }

    secureLog('info', 'Blog post deleted', { id });

    return createSuccessResponse({
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
