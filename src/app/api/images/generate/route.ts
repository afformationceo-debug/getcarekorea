/**
 * Image Generation API
 *
 * POST /api/images/generate - 단일/배치 이미지 생성
 * GET /api/images/generate - 이미지 생성 대기 중인 포스트 목록
 *
 * ⚠️ IMPORTANT: Uses Google Imagen 4 via Replicate API
 * DO NOT change to DALL-E, Flux, or other models.
 *
 * @see https://replicate.com/google/imagen-4/api
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// ⚠️ IMPORTANT: Use Imagen 4 for ALL image generation
import {
  runImagePipeline,
  runBatchImagePipeline,
  getPostsNeedingImages,
  IMAGEN4_CONFIG,
} from '@/lib/images';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5분 타임아웃

/**
 * GET /api/images/generate
 * 이미지 생성이 필요한 포스트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const posts = await getPostsNeedingImages(supabase, { status, limit });

    // 최근 이미지 생성 기록 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentGenerations } = await (supabase
      .from('image_generations') as any)
      .select('blog_post_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        postsNeedingImages: posts,
        totalCount: posts.length,
        recentGenerations: recentGenerations || [],
      },
    });
  } catch (error) {
    console.error('Image generation list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image generation list' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images/generate
 * 이미지 생성 요청 (단일 또는 배치)
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { blogPostId, blogPostIds } = body;
    // Note: useSimplePrompt is deprecated with Imagen 4

    // 단일 포스트 이미지 생성
    if (blogPostId) {
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

      // ⚠️ Uses Imagen 4 - DO NOT change to DALL-E or Flux
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
        message: 'Image generated successfully with Imagen 4',
      });
    }

    // 배치 이미지 생성
    if (blogPostIds && Array.isArray(blogPostIds)) {
      if (blogPostIds.length > 20) {
        return NextResponse.json(
          { error: 'Maximum 20 posts per batch' },
          { status: 400 }
        );
      }

      // ⚠️ Uses Imagen 4 - DO NOT change to DALL-E or Flux
      const result = await runBatchImagePipeline(supabase, blogPostIds, {
        concurrency: IMAGEN4_CONFIG.MAX_CONCURRENT,
      });

      return NextResponse.json({
        success: true,
        data: {
          total: result.total,
          successful: result.successful,
          failed: result.failed,
          results: result.results,
          model: IMAGEN4_CONFIG.MODEL,
        },
        message: `Generated ${result.successful}/${result.total} images with Imagen 4`,
      });
    }

    return NextResponse.json(
      { error: 'blogPostId or blogPostIds required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
