/**
 * Blog Post View Counter API
 *
 * POST /api/blog/[slug]/view
 *
 * Increments the view count for a blog post.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const supabase = await createAdminClient();

    // Increment view count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('blog_posts') as any)
      .update({ view_count: supabase.rpc('increment_view_count', { post_slug: slug }) })
      .eq('slug', slug);

    // If RPC doesn't exist, do a simple increment
    if (error) {
      // Fallback: fetch current count and increment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post } = await (supabase.from('blog_posts') as any)
        .select('view_count')
        .eq('slug', slug)
        .single();

      if (post) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('blog_posts') as any)
          .update({ view_count: (post.view_count || 0) + 1 })
          .eq('slug', slug);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
