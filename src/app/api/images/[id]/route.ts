/**
 * Individual Image API
 *
 * GET /api/images/[id] - 특정 포스트의 이미지 생성 상태 조회
 * DELETE /api/images/[id] - 이미지 삭제 및 재생성
 *
 * ⚠️ IMPORTANT: Uses Google Imagen 4 via Replicate API
 * DO NOT change to DALL-E, Flux, or other models.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// ⚠️ IMPORTANT: Use Imagen 4 for ALL image generation
import {
  getImageGenerationStatus,
  deleteStoredImage,
  runImagePipeline,
  IMAGEN4_CONFIG,
} from '@/lib/images';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/images/[id]
 * 특정 포스트의 이미지 생성 상태 조회
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: blogPostId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 포스트 존재 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (supabase
      .from('blog_posts') as any)
      .select('id, title, cover_image_url, cover_image_alt')
      .eq('id', blogPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 이미지 생성 상태 조회
    const status = await getImageGenerationStatus(supabase, blogPostId);

    // 생성 히스토리 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: history } = await (supabase
      .from('image_generations') as any)
      .select('id, status, prompt, image_url, generation_time_ms, created_at')
      .eq('blog_post_id', blogPostId)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          coverImageUrl: post.cover_image_url,
          coverImageAlt: post.cover_image_alt,
        },
        hasImage: status.hasImage,
        latestGeneration: status.latestGeneration,
        history: history || [],
      },
    });
  } catch (error) {
    console.error('Image status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[id]
 * 이미지 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: blogPostId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Storage에서 이미지 삭제
    await deleteStoredImage(supabase, blogPostId);

    // 블로그 포스트 이미지 URL 제거
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('blog_posts') as any)
      .update({
        cover_image_url: null,
        cover_image_alt: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blogPostId);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/images/[id]
 * 이미지 재생성
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: blogPostId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 권한 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 포스트 정보 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (supabase
      .from('blog_posts') as any)
      .select('id, title_en, excerpt_en, category')
      .eq('id', blogPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Note: useSimplePrompt is deprecated with Imagen 4
    await request.json().catch(() => ({}));

    // 기존 이미지 삭제
    await deleteStoredImage(supabase, blogPostId);

    // 새 이미지 생성 with Imagen 4
    // ⚠️ DO NOT change to DALL-E or Flux
    const result = await runImagePipeline(supabase, {
      blogPostId: post.id,
      title: post.title_en || 'Untitled',
      excerpt: post.excerpt_en || '',
      category: post.category || 'general',
      locale: 'en',
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        generationId: result.generationId,
        timeMs: result.timeMs,
        model: IMAGEN4_CONFIG.MODEL,
      },
      message: 'Image regenerated successfully with Imagen 4',
    });
  } catch (error) {
    console.error('Image regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate image' },
      { status: 500 }
    );
  }
}
