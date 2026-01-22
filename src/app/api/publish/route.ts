/**
 * Publishing API
 *
 * POST /api/publish - 콘텐츠 발행
 * GET /api/publish - 발행 대기 중인 콘텐츠 목록
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  autoPublishPost,
  autoPublishBatch,
  autoPublishPendingPosts,
  validateForPublishing,
  schedulePublication,
  DEFAULT_PUBLISHING_CRITERIA,
} from '@/lib/publishing';
import { revalidateOnPublish } from '@/lib/publishing/isr-revalidation';

export const runtime = 'nodejs';

/**
 * GET /api/publish
 * 발행 대기 중인 콘텐츠 목록 및 검증 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'draft,pending';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const validateAll = searchParams.get('validate') === 'true';

    // 상태별 포스트 조회
    const statusArray = status.split(',').map(s => s.trim());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: posts, error } = await (supabase
      .from('blog_posts') as any)
      .select('id, title, slug, locale, status, created_at, updated_at, cover_image_url')
      .in('status', statusArray)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // 검증 수행 (옵션)
    let validationResults = null;
    if (validateAll && posts) {
      validationResults = [];
      for (const post of posts) {
        const validation = await validateForPublishing(supabase, post.id);
        validationResults.push({
          blogPostId: post.id,
          title: post.title,
          canPublish: validation.canPublish,
          qualityScore: validation.qualityScore?.overall,
          issues: validation.issues,
          warnings: validation.warnings,
        });
      }
    }

    // 발행 기준 정보
    const criteria = DEFAULT_PUBLISHING_CRITERIA;

    return NextResponse.json({
      success: true,
      data: {
        posts: posts || [],
        totalCount: posts?.length || 0,
        validationResults,
        criteria: {
          minQualityScore: criteria.minQualityScore,
          requireImage: criteria.requireImage,
          requireMetaDescription: criteria.requireMetaDescription,
          requireExcerpt: criteria.requireExcerpt,
        },
      },
    });
  } catch (error) {
    console.error('Publish list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publish list' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publish
 * 콘텐츠 발행 (단일/배치/자동)
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
    const {
      blogPostId,
      blogPostIds,
      autoPublish,
      schedule,
      scheduledAt,
      dryRun,
    } = body;

    const revalidateSecret = process.env.REVALIDATE_SECRET || '';

    // 단일 포스트 발행
    if (blogPostId && !schedule) {
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
          ? `Published successfully`
          : `Failed to publish: ${result.issues?.join(', ')}`,
      });
    }

    // 예약 발행
    if (blogPostId && schedule && scheduledAt) {
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

    // 배치 발행
    if (blogPostIds && Array.isArray(blogPostIds)) {
      if (blogPostIds.length > 50) {
        return NextResponse.json(
          { error: 'Maximum 50 posts per batch' },
          { status: 400 }
        );
      }

      const result = await autoPublishBatch(supabase, blogPostIds);

      // ISR 재검증 (성공한 포스트만)
      if (revalidateSecret) {
        for (const publishResult of result.results) {
          if (publishResult.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: post } = await (supabase
              .from('blog_posts') as any)
              .select('slug, locale')
              .eq('id', publishResult.blogPostId)
              .single();

            if (post) {
              await revalidateOnPublish(post.slug, post.locale, revalidateSecret);
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          total: result.total,
          published: result.published,
          skipped: result.skipped,
          failed: result.failed,
        },
        message: `Published ${result.published}/${result.total} posts`,
      });
    }

    // 자동 발행 (조건 충족 포스트 모두)
    if (autoPublish) {
      const result = await autoPublishPendingPosts(supabase, { dryRun });

      return NextResponse.json({
        success: true,
        data: {
          total: result.total,
          published: result.published,
          skipped: result.skipped,
          failed: result.failed,
          dryRun: dryRun || false,
        },
        message: dryRun
          ? `Dry run: ${result.published} posts would be published`
          : `Auto-published ${result.published}/${result.total} posts`,
      });
    }

    return NextResponse.json(
      { error: 'blogPostId, blogPostIds, or autoPublish required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish' },
      { status: 500 }
    );
  }
}
