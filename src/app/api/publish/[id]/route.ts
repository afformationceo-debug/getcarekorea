/**
 * Individual Post Publishing API
 *
 * GET /api/publish/[id] - 특정 포스트의 발행 상태 및 검증 결과
 * POST /api/publish/[id] - 특정 포스트 발행
 * DELETE /api/publish/[id] - 발행 취소 (draft로 변경)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validateForPublishing,
  autoPublishPost,
  schedulePublication,
  cancelScheduledPublication,
} from '@/lib/publishing';
import { revalidateOnPublish } from '@/lib/publishing/isr-revalidation';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/publish/[id]
 * 특정 포스트의 발행 상태 및 검증 결과 조회
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

    // 포스트 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error: postError } = await (supabase
      .from('blog_posts') as any)
      .select('id, title, slug, locale, status, published_at, scheduled_at, created_at, updated_at')
      .eq('id', blogPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 발행 검증
    const validation = await validateForPublishing(supabase, blogPostId);

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          locale: post.locale,
          status: post.status,
          publishedAt: post.published_at,
          scheduledAt: post.scheduled_at,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
        },
        validation: {
          isValid: validation.isValid,
          canPublish: validation.canPublish,
          qualityScore: validation.qualityScore,
          issues: validation.issues,
          warnings: validation.warnings,
        },
      },
    });
  } catch (error) {
    console.error('Publish status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publish status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publish/[id]
 * 특정 포스트 발행 또는 예약
 */
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { scheduledAt } = body;
    const revalidateSecret = process.env.REVALIDATE_SECRET || '';

    // 예약 발행
    if (scheduledAt) {
      const result = await schedulePublication(
        supabase,
        blogPostId,
        new Date(scheduledAt)
      );

      return NextResponse.json({
        success: result.success,
        data: { blogPostId, scheduledAt },
        message: result.success
          ? `Scheduled for ${scheduledAt}`
          : result.error,
      });
    }

    // 즉시 발행
    const result = await autoPublishPost(supabase, blogPostId);

    if (result.success && revalidateSecret) {
      // 포스트 정보 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post } = await (supabase
        .from('blog_posts') as any)
        .select('slug, locale')
        .eq('id', blogPostId)
        .single();

      if (post) {
        // ISR 재검증
        await revalidateOnPublish(post.slug, post.locale, revalidateSecret);
      }
    }

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success
        ? 'Published successfully'
        : `Failed to publish: ${result.issues?.join(', ')}`,
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/publish/[id]
 * 발행 취소 (draft로 변경) 또는 예약 취소
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

    // 현재 상태 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post } = await (supabase
      .from('blog_posts') as any)
      .select('status')
      .eq('id', blogPostId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 예약 취소
    if (post.status === 'scheduled') {
      const result = await cancelScheduledPublication(supabase, blogPostId);

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? 'Schedule cancelled'
          : result.error,
      });
    }

    // 발행 취소 (published → draft)
    if (post.status === 'published') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('blog_posts') as any)
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', blogPostId);

      if (error) {
        return NextResponse.json(
          { error: `Failed to unpublish: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Post unpublished successfully',
      });
    }

    return NextResponse.json({
      success: false,
      message: `Cannot cancel: post is ${post.status}`,
    });
  } catch (error) {
    console.error('Unpublish error:', error);
    return NextResponse.json(
      { error: 'Failed to unpublish' },
      { status: 500 }
    );
  }
}
