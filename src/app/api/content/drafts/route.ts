/**
 * Content Drafts List API
 *
 * GET /api/content/drafts
 *
 * Fetch content drafts with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// GET HANDLER
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const hreflangGroup = searchParams.get('hreflangGroup');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('content_drafts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (locale) {
      query = query.eq('locale', locale);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (hreflangGroup) {
      query = query.eq('hreflang_group', hreflangGroup);
    }

    if (search) {
      query = query.or(
        `keyword_text.ilike.%${search}%,title.ilike.%${search}%`
      );
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: drafts, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      drafts: drafts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: {
        locale,
        status,
        category,
        search,
        hreflangGroup,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch drafts:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch drafts',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE HANDLER (Bulk Delete)
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids array required' },
        { status: 400 }
      );
    }

    // Delete drafts
    const { error } = await supabase
      .from('content_drafts')
      .delete()
      .in('id', ids);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (error: any) {
    console.error('Failed to delete drafts:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete drafts',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
