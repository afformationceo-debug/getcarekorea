/**
 * Single Content Draft API
 *
 * GET /api/content/draft/[id] - Get single draft
 * PUT /api/content/draft/[id] - Update draft
 * DELETE /api/content/draft/[id] - Delete draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// =====================================================
// GET HANDLER
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch draft
    const { data: draft, error } = await supabase
      .from('content_drafts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch draft:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT HANDLER (Update)
// =====================================================

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Update draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error } = await (supabase.from('content_drafts') as any)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error: unknown) {
    console.error('Failed to update draft:', error);

    return NextResponse.json(
      {
        error: 'Failed to update draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE HANDLER
// =====================================================

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete draft
    const { error } = await supabase
      .from('content_drafts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      deleted: id,
    });
  } catch (error: unknown) {
    console.error('Failed to delete draft:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete draft',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
