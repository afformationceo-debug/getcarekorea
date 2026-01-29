/**
 * Admin Interpreter API
 * GET /api/admin/interpreters/[id] - Get single interpreter
 * PUT /api/admin/interpreters/[id] - Update interpreter
 * DELETE /api/admin/interpreters/[id] - Delete interpreter
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('author_personas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching interpreter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const body = await request.json();

    // Validate required fields
    const hasName = body.name && Object.keys(body.name).some(key => body.name[key]?.trim());
    if (!body.slug || !hasName) {
      return NextResponse.json(
        { error: 'Missing required fields: slug and at least one name' },
        { status: 400 }
      );
    }

    // Check if slug already exists (for other interpreters)
    const { data: existing } = await supabase
      .from('author_personas')
      .select('id')
      .eq('slug', body.slug)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Update interpreter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('author_personas') as any)
      .update({
        slug: body.slug,
        name: body.name,
        bio_short: body.bio_short || {},
        bio_full: body.bio_full || {},
        photo_url: body.photo_url,
        years_of_experience: body.years_of_experience,
        primary_specialty: body.primary_specialty,
        secondary_specialties: body.secondary_specialties || [],
        languages: body.languages || [],
        certifications: body.certifications || [],
        location: body.location,
        preferred_messenger: body.preferred_messenger,
        display_order: body.display_order,
        avg_rating: body.avg_rating,
        review_count: body.review_count,
        is_active: body.is_active,
        is_verified: body.is_verified,
        is_featured: body.is_featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Interpreter not found' }, { status: 404 });
      }
      console.error('Error updating interpreter:', error);
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating interpreter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();

    const { error } = await supabase
      .from('author_personas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting interpreter:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interpreter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
