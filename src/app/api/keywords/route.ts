/**
 * Keywords API
 *
 * GET /api/keywords - List all keywords
 * POST /api/keywords - Create a new keyword
 */

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient(); // Use admin client for DB operations
    const { searchParams } = new URL(request.url);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // TEMPORARILY DISABLED: Admin role check
    // TODO: Re-enable after fixing profiles table
    // For now, any authenticated user can access

    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build query - use adminSupabase to bypass RLS
    // Simplified schema: use title instead of title_en
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminSupabase.from('content_keywords') as any)
      .select(`
        *,
        blog_posts (id, slug, title, status)
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('keyword', `%${search}%`);
    }

    // Order by priority and created_at
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    console.log('[KEYWORDS API] Query result - count:', count, 'data length:', data?.length, 'error:', error?.message);

    if (error) {
      secureLog('error', 'Error fetching keywords', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    // Get unique categories for filter options - use adminSupabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories } = await (adminSupabase.from('content_keywords') as any)
      .select('category')
      .not('category', 'is', null);

    const uniqueCategories = [...new Set((categories || []).map((c: { category: string }) => c.category))];

    return createSuccessResponse(
      {
        keywords: data || [],
        categories: uniqueCategories,
      },
      {
        page,
        limit,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient(); // Use admin client for DB operations
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // TEMPORARILY DISABLED: Admin role check
    // TODO: Re-enable after fixing profiles table

    // Parse request body
    const body = await request.json();

    // Validate required fields
    validateRequired(body, ['keyword'], locale);

    // Check for duplicate keyword - use adminSupabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (adminSupabase.from('content_keywords') as any)
      .select('id')
      .eq('keyword', body.keyword)
      .eq('locale', body.locale || 'en')
      .single();

    if (existing) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Keyword already exists for this locale',
        { field: 'keyword' },
        locale
      );
    }

    const keywordLocale = body.locale || 'en';
    const keywordCategory = body.category || 'general';

    // Create keyword - use adminSupabase
    // Note: author_persona_id is assigned to blog_posts, not keywords
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyword, error: insertError } = await (adminSupabase.from('content_keywords') as any)
      .insert({
        keyword: body.keyword,
        category: keywordCategory,
        locale: keywordLocale,
        search_volume: body.search_volume || null,
        competition: body.competition || null,
        priority: body.priority || 1,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      secureLog('error', 'Error creating keyword', { error: insertError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    secureLog('info', 'Keyword created', {
      keywordId: keyword.id,
      keyword: keyword.keyword,
      createdBy: user.id,
    });

    return createSuccessResponse({
      success: true,
      keyword,
      message: 'Keyword created successfully',
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
