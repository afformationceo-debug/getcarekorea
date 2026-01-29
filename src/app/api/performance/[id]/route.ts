/**
 * Individual Post Performance API
 *
 * GET /api/performance/[id] - 특정 포스트의 성과 데이터 조회
 * POST /api/performance/[id] - 특정 포스트의 GSC 데이터 갱신
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { collectGSCDataForPost } from '@/lib/gsc';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/performance/[id]
 * 특정 포스트의 성과 데이터 조회
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
     
    const { data: post, error: postError } = await (supabase
      .from('blog_posts') as any)
      .select('id, title, slug, locale, status')
      .eq('id', blogPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 성과 데이터 조회 (최근 데이터)
     
    const { data: performances } = await (supabase
      .from('content_performance') as any)
      .select('*')
      .eq('blog_post_id', blogPostId)
      .order('date_range_end', { ascending: false })
      .limit(10);

    // 히스토리 데이터 (일별)
     
    const { data: history } = await (supabase
      .from('content_performance') as any)
      .select('gsc_clicks, gsc_impressions, gsc_ctr, gsc_position, date_range_start, date_range_end')
      .eq('blog_post_id', blogPostId)
      .order('date_range_end', { ascending: true });

    // 쿼리별 성과 (가장 최근 데이터에서)
    const latestPerformance = performances?.[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        post: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          locale: post.locale,
          status: post.status,
        },
        latestPerformance,
        history: history || [],
        totalRecords: performances?.length || 0,
      },
    });
  } catch (error) {
    console.error('Performance detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance/[id]
 * 특정 포스트의 GSC 데이터 갱신 (관리자 전용)
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

    // 요청 본문 파싱
    const body = await request.json().catch(() => ({}));
    const daysAgo = body.daysAgo || 28;

    // GSC 데이터 갱신
    const performance = await collectGSCDataForPost(supabase, blogPostId, daysAgo);

    if (!performance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to collect GSC data. GSC may not be configured or no data available.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        page: performance.page,
        clicks: performance.clicks,
        impressions: performance.impressions,
        ctr: performance.ctr,
        position: performance.position,
        queriesCount: performance.queries.length,
      },
      message: 'Performance data updated successfully',
    });
  } catch (error) {
    console.error('Performance refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh performance data' },
      { status: 500 }
    );
  }
}
