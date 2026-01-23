/**
 * Sitemap Update Cron Job
 *
 * GET /api/cron/sitemap-update - 사이트맵 자동 업데이트
 *
 * Vercel Cron 설정 (vercel.json):
 * "crons": [{ "path": "/api/cron/sitemap-update", "schedule": "0 0 * * *" }]
 * (매일 자정 실행)
 *
 * 동작 방식:
 * 1. 모든 발행된 포스트 조회
 * 2. 동적 사이트맵 URL 갱신
 * 3. Google Search Console에 사이트맵 제출 알림 (선택적)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generateSitemap, submitSitemapToGoogle } from '@/lib/publishing/sitemap-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Cron 인증 키
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/sitemap-update
 * 사이트맵 자동 업데이트
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    console.log('\n🗺️  Sitemap update cron: Starting...');

    // 1. 발행된 포스트 수 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: publishedCount } = await (supabase.from('blog_posts') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    // 2. 통역사(Author Personas) 수 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: interpreterCount } = await (supabase.from('author_personas') as any)
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log(`   📊 Published posts: ${publishedCount || 0}`);
    console.log(`   📊 Active interpreters: ${interpreterCount || 0}`);

    // 3. 사이트맵 생성
    const sitemapResult = await generateSitemap(supabase);

    console.log(`   📄 Sitemap URLs: ${sitemapResult.urlCount}`);

    // 4. Google Search Console에 사이트맵 제출 알림 (선택적)
    let gscSubmitResult = null;
    if (process.env.GSC_SITE_URL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        gscSubmitResult = await submitSitemapToGoogle();
        console.log(`   ✅ Sitemap submitted to GSC`);
      } catch (error: unknown) {
        console.warn(`   ⚠️  GSC submission failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // 5. 결과 로그 기록
    const totalTime = Date.now() - startTime;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cron_logs') as any).insert({
      job_name: 'sitemap-update',
      status: 'success',
      records_processed: sitemapResult.urlCount,
      execution_time_ms: totalTime,
      details: {
        publishedPosts: publishedCount || 0,
        interpreters: interpreterCount || 0,
        sitemapUrls: sitemapResult.urlCount,
        gscSubmitted: !!gscSubmitResult,
      },
      created_at: new Date().toISOString(),
    }).catch(() => {
      // cron_logs 테이블 없으면 무시
    });

    console.log(`\n✅ Sitemap update completed in ${(totalTime / 1000).toFixed(1)}s`);

    return NextResponse.json({
      success: true,
      data: {
        publishedPosts: publishedCount || 0,
        interpreters: interpreterCount || 0,
        sitemapUrls: sitemapResult.urlCount,
        gscSubmitted: !!gscSubmitResult,
      },
      message: `Sitemap updated with ${sitemapResult.urlCount} URLs`,
    });

  } catch (error: unknown) {
    console.error('Sitemap update cron error:', error);

    // 에러 로그 기록
    try {
      const supabase = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('cron_logs') as any).insert({
        job_name: 'sitemap-update',
        status: 'error',
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString(),
      });
    } catch {
      // 로그 기록 실패 무시
    }

    return NextResponse.json(
      { error: 'Failed to update sitemap' },
      { status: 500 }
    );
  }
}
