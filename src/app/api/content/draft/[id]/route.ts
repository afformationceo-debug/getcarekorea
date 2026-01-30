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

    // Fetch from blog_posts (content is saved there, not content_drafts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select(`
        *,
        author_personas (
          id, slug, name, photo_url, bio_short,
          years_of_experience, primary_specialty
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Transform to ContentDraft format expected by preview page
    const seoMeta = post.seo_meta || {};
    const genMeta = post.generation_metadata || {};
    const authorPersona = post.author_personas;
    const authorName = authorPersona?.name || {};

    const content = {
      id: post.id,
      keyword_text: genMeta.keyword || '',
      locale: post.locale,
      category: post.category,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      meta_title: seoMeta.meta_title || post.title,
      meta_description: seoMeta.meta_description || post.excerpt,
      author_name: authorName.ko || authorName.en || 'GetCareKorea',
      author_name_en: authorName.en || authorName.ko || 'GetCareKorea',
      author_bio: authorPersona?.bio_short?.ko || authorPersona?.bio_short?.en || '',
      author_years_experience: authorPersona?.years_of_experience || 0,
      tags: post.tags || [],
      faq_schema: genMeta.faqSchema || [],
      images: genMeta.generatedImages || genMeta.images || [],
      cover_image_url: post.cover_image_url,
      status: post.status,
      hreflang_group: post.slug?.split('-').slice(0, -1).join('-') || '',
      created_at: post.created_at,
      updated_at: post.updated_at,
    };

    return NextResponse.json({
      success: true,
      content,
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

    // Update blog_posts (not content_drafts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
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
      content: post,
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

    // Delete from blog_posts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('blog_posts') as any)
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
