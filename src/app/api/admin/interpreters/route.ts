/**
 * Admin Interpreters API
 * POST /api/admin/interpreters - Create a new interpreter
 * GET /api/admin/interpreters - List all interpreters
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('author_personas')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching interpreters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('author_personas')
      .select('id')
      .eq('slug', body.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Insert new interpreter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('author_personas') as any)
      .insert({
        slug: body.slug,
        name: body.name,
        bio_short: body.bio_short || {},
        bio_full: body.bio_full || {},
        photo_url: body.photo_url,
        years_of_experience: body.years_of_experience || 5,
        primary_specialty: body.primary_specialty || 'plastic-surgery',
        secondary_specialties: body.secondary_specialties || [],
        languages: body.languages || [{ code: 'en', proficiency: 'native' }],
        certifications: body.certifications || [],
        location: body.location || 'Seoul, Gangnam',
        preferred_messenger: body.preferred_messenger,
        display_order: body.display_order || 0,
        is_active: body.is_active ?? true,
        is_verified: body.is_verified ?? false,
        is_featured: body.is_featured ?? false,
        avg_rating: body.avg_rating ?? 4.8,
        review_count: body.review_count ?? 0,
        total_bookings: 0,
        total_posts: 0,
        total_views: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interpreter:', error);
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating interpreter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
