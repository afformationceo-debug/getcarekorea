/**
 * Performance Data API
 *
 * GET /api/performance - 성과 요약 조회
 * POST /api/performance - GSC 데이터 수집 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  collectGSCData,
  getPerformanceSummary,
  getPerformanceSummaryByLocale,
} from '@/lib/gsc';

export const runtime = 'nodejs';

/**
 * GET /api/performance
 * 성과 요약 데이터 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const daysAgo = parseInt(searchParams.get('days') || '28', 10);
    const byLocale = searchParams.get('byLocale') === 'true';

    // 성과 요약 조회
    const summary = await getPerformanceSummary(supabase, daysAgo);

    let localeSummary = null;
    if (byLocale) {
      const localeMap = await getPerformanceSummaryByLocale(supabase, daysAgo);
      if (localeMap) {
        localeSummary = Object.fromEntries(localeMap);
      }
    }

    // 최근 고성과 콘텐츠 조회
     
    const { data: topPerformers } = await (supabase
      .from('content_performance') as any)
      .select(`
        *,
        blog_posts(id, title, slug, locale)
      `)
      .eq('is_high_performer', true)
      .order('gsc_clicks', { ascending: false })
      .limit(10);

    // 성과 등급별 분포
     
    const { data: tierDistribution } = await (supabase
      .from('content_performance') as any)
      .select('performance_tier')
      .not('performance_tier', 'is', null);

    const tierCounts = {
      top: 0,
      mid: 0,
      low: 0,
    };

    if (tierDistribution) {
      for (const record of tierDistribution) {
        if (record.performance_tier === 'top') tierCounts.top++;
        else if (record.performance_tier === 'mid') tierCounts.mid++;
        else if (record.performance_tier === 'low') tierCounts.low++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        localeSummary,
        topPerformers: topPerformers || [],
        tierDistribution: tierCounts,
        period: {
          daysAgo,
        },
      },
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance
 * GSC 데이터 수집 실행 (관리자 전용)
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

    // 요청 본문 파싱
    const body = await request.json().catch(() => ({}));
    const daysAgo = body.daysAgo || 28;

    // GSC 데이터 수집 실행
    const result = await collectGSCData(supabase, daysAgo);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data collection failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        pagesProcessed: result.pagesProcessed,
        newRecords: result.newRecords,
        updatedRecords: result.updatedRecords,
        highPerformers: result.highPerformers,
      },
      message: `Processed ${result.pagesProcessed} pages, found ${result.highPerformers} high performers`,
    });
  } catch (error) {
    console.error('Performance collection error:', error);
    return NextResponse.json(
      { error: 'Failed to collect performance data' },
      { status: 500 }
    );
  }
}
