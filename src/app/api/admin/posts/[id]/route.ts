/**
 * Admin Post Detail API
 *
 * GET /api/admin/posts/[id] - Get blog post by ID (for admin preview)
 * Includes author_persona data and works with any status
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
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

    // Get blog post by ID (any status for admin preview)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('blog_posts') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found', message: error?.message },
        { status: 404 }
      );
    }

    // Fetch author_persona if available
    let authorPersona = null;
    if (post.author_persona_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: persona } = await (supabase.from('author_personas') as any)
        .select('*')
        .eq('id', post.author_persona_id)
        .single();

      if (persona) {
        authorPersona = persona;
      }
    }

    // Return post with author_persona
    return NextResponse.json({
      success: true,
      post: {
        ...post,
        author_persona: authorPersona,
      },
    });
  } catch (error: unknown) {
    console.error('Admin post fetch error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch post', message },
      { status: 500 }
    );
  }
}
