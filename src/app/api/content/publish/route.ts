/**
 * Content Publishing API
 *
 * POST /api/content/publish - Publish draft to live blog
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getKSTTimestamp } from '@/lib/utils';

export const maxDuration = 60;

// =====================================================
// POST HANDLER
// =====================================================

export async function POST(request: NextRequest) {
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

    // Parse request
    const { contentDraftId } = await request.json();

    if (!contentDraftId) {
      return NextResponse.json(
        { error: 'contentDraftId required' },
        { status: 400 }
      );
    }

    console.log(`📤 Publishing single-language content: ${contentDraftId}`);


    // Fetch content draft
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error: fetchError } = await (supabase.from('content_drafts') as any)
      .select('*')
      .eq('id', contentDraftId)
      .single();

    if (fetchError || !draft) {
      return NextResponse.json(
        { error: 'Content draft not found' },
        { status: 404 }
      );
    }

    // Generate slug from title
    const slug = generateSlug(draft.title as string, draft.locale as string);

    // Insert or update in blog_posts table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blogPost, error: publishError } = await (supabase.from('blog_posts') as any)
      .upsert(
        {
          slug,
          locale: draft.locale,
          keyword_text: draft.keyword_text,
          category: draft.category,
          title: draft.title,
          excerpt: draft.excerpt,
          content: draft.content,
          content_format: 'html',
          meta_title: draft.meta_title,
          meta_description: draft.meta_description,
          author_name: draft.author_name,
          author_name_en: draft.author_name_en,
          author_bio: draft.author_bio,
          author_years_experience: draft.author_years_experience,
          tags: draft.tags,
          faq_schema: draft.faq_schema,
          howto_schema: draft.howto_schema,
          images: draft.images,
          hreflang_group: draft.hreflang_group,
          published_at: getKSTTimestamp(),
          updated_at: getKSTTimestamp(),
        },
        { onConflict: 'slug,locale' }
      )
      .select()
      .single();

    if (publishError) {
      throw publishError;
    }

    // Update draft status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('content_drafts') as any)
      .update({
        status: 'published',
        published_at: getKSTTimestamp(),
      })
      .eq('id', contentDraftId);

    // Revalidate Next.js ISR cache
    const blogPath = `/${draft.locale}/blog/${slug}`;
    try {
      revalidatePath(blogPath);
      revalidatePath(`/${draft.locale}/blog`);
      console.log(`✅ Revalidated: ${blogPath}`);
    } catch (error) {
      console.warn('Failed to revalidate path:', error);
    }

    // Publishing complete
    const blogUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://getcarekorea.com'}${blogPath}`;

    console.log(`✅ Publishing complete!`);
    console.log(`   URL: ${blogUrl}`);

    return NextResponse.json({
      success: true,
      blogPostId: blogPost.id,
      slug,
      url: blogUrl,
      locale: draft.locale,
      published_at: getKSTTimestamp(),
    });
  } catch (error: any) {
    console.error('Publishing error:', error);

    return NextResponse.json(
      {
        error: 'Failed to publish content',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// HELPERS
// =====================================================

function generateSlug(title: string, locale: string): string {
  // Remove special characters and convert to lowercase
  let slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .trim();

  // Limit length
  slug = slug.substring(0, 60);

  // Add locale prefix if not English
  if (locale !== 'en') {
    slug = `${locale}-${slug}`;
  }

  return slug;
}
