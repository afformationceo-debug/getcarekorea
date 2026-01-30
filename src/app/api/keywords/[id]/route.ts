/**
 * Keyword Detail API
 *
 * GET /api/keywords/[id] - Get keyword details
 * PUT /api/keywords/[id] - Update keyword
 * DELETE /api/keywords/[id] - Delete keyword
 */

import { NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Get keyword with related blog post
    // Simplified schema: use title, excerpt instead of title_en, excerpt_en
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyword, error } = await (supabase.from('content_keywords') as any)
      .select(`
        *,
        blog_posts (id, slug, title, excerpt, status, created_at, published_at)
      `)
      .eq('id', id)
      .single();

    if (error || !keyword) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { id }, locale);
    }

    return createSuccessResponse(keyword);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role (use adminClient to bypass RLS on profiles table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      secureLog('error', 'Profile fetch error', { userId: user.id, error: profileError.message });
    }

    if (!profile || profile.role !== 'admin') {
      secureLog('warn', 'Admin access denied', { userId: user.id, role: profile?.role });
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Get existing keyword
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (adminClient.from('content_keywords') as any)
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { id }, locale);
    }

    // Parse request body
    const body = await request.json();

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.keyword !== undefined) updateData.keyword = body.keyword;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.locale !== undefined) updateData.locale = body.locale;
    if (body.search_volume !== undefined) updateData.search_volume = body.search_volume;
    if (body.competition !== undefined) updateData.competition = body.competition;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;

    if (Object.keys(updateData).length === 0) {
      throw new APIError(ErrorCode.VALIDATION_ERROR, 'No valid updates provided', undefined, locale);
    }

    updateData.updated_at = new Date().toISOString();

    // Update keyword with admin client (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (adminClient.from('content_keywords') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      secureLog('error', 'Error updating keyword', { error: updateError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Keyword updated', {
      keywordId: id,
      updates: Object.keys(updateData),
      updatedBy: user.id,
    });

    return createSuccessResponse(updated);
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role (use adminClient to bypass RLS on profiles table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error: profileError } = await (adminClient.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      secureLog('error', 'Profile fetch error', { userId: user.id, error: profileError.message });
    }

    if (!profile || profile.role !== 'admin') {
      secureLog('warn', 'Admin access denied', { userId: user.id, role: profile?.role });
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Get existing keyword
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: fetchError } = await (adminClient.from('content_keywords') as any)
      .select('id, blog_post_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Keyword not found', { id }, locale);
    }

    // Check if keyword has generated content
    if (existing.blog_post_id) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Cannot delete keyword with generated content. Delete the blog post first.',
        { blog_post_id: existing.blog_post_id },
        locale
      );
    }

    // Delete keyword with admin client (bypasses RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (adminClient.from('content_keywords') as any)
      .delete()
      .eq('id', id);

    if (deleteError) {
      secureLog('error', 'Error deleting keyword', { error: deleteError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Keyword deleted', {
      keywordId: id,
      deletedBy: user.id,
    });

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    return createErrorResponse(error);
  }
}
