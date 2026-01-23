/**
 * Auto Publish Cron Job
 *
 * GET /api/cron/auto-publish - 고품질 드래프트 자동 발행
 *
 * Vercel Cron 설정 (vercel.json):
 * "crons": [{ "path": "/api/cron/auto-publish", "schedule": "0 10 * * *" }]
 * (매일 오전 10시 실행 - auto-generate 1시간 후)
 *
 * 동작 방식:
 * 1. draft 상태의 blog_posts 조회
 * 2. 품질 점수 75점 이상인 포스트 필터링
 * 3. 자동 발행 (published 상태로 변경)
 * 4. ISR 재검증 트리거
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  autoPublishPendingPosts,
  DEFAULT_PUBLISHING_CRITERIA,
} from '@/lib/publishing/auto-publish';
import { triggerISRRevalidation } from '@/lib/publishing/isr-revalidation';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2분 타임아웃

// Cron 인증 키
const CRON_SECRET = process.env.CRON_SECRET;

// 일일 발행 제한
const DAILY_PUBLISH_LIMIT = 10;

/**
 * GET /api/cron/auto-publish
 * 고품질 드래프트 자동 발행
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

    console.log('\n🚀 Auto-publish cron: Starting...');

    // 1. 고품질 드래프트 자동 발행
    const publishResult = await autoPublishPendingPosts(supabase, {
      criteria: {
        ...DEFAULT_PUBLISHING_CRITERIA,
        minQualityScore: 75, // 75점 이상만 자동 발행
      },
      limit: DAILY_PUBLISH_LIMIT,
      dryRun: false,
    });

    console.log(`   📊 Total: ${publishResult.total}, Published: ${publishResult.published}`);

    // 2. 발행된 포스트에 대해 ISR 재검증 트리거
    const revalidationResults: { postId: string; success: boolean; error?: string }[] = [];

    if (publishResult.published > 0) {
      console.log(`   🔄 Triggering ISR revalidation for ${publishResult.published} posts...`);

      for (const result of publishResult.results.filter(r => r.success)) {
        try {
          // 포스트 정보 조회
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: post } = await (supabase.from('blog_posts') as any)
            .select('slug')
            .eq('id', result.blogPostId)
            .single();

          if (post) {
            // 모든 로케일에 대해 ISR 재검증
            const locales = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'th', 'mn', 'ru'];
            const paths = locales.map(locale => `/${locale}/blog/${post.slug}`);

            await triggerISRRevalidation(paths);

            revalidationResults.push({
              postId: result.blogPostId,
              success: true,
            });
          }
        } catch (error: unknown) {
          revalidationResults.push({
            postId: result.blogPostId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // 3. 결과 로그 기록
    const totalTime = Date.now() - startTime;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cron_logs') as any).insert({
      job_name: 'auto-publish',
      status: publishResult.failed === 0 ? 'success' : 'partial',
      records_processed: publishResult.published,
      execution_time_ms: totalTime,
      details: {
        total: publishResult.total,
        published: publishResult.published,
        skipped: publishResult.skipped,
        failed: publishResult.failed,
        revalidation: revalidationResults,
        results: publishResult.results,
      },
      created_at: new Date().toISOString(),
    }).catch(() => {
      // cron_logs 테이블 없으면 무시
    });

    console.log(`\n✅ Auto-publish completed in ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Published: ${publishResult.published}/${publishResult.total}`);
    console.log(`   Skipped: ${publishResult.skipped}`);
    console.log(`   Failed: ${publishResult.failed}`);

    return NextResponse.json({
      success: true,
      data: {
        total: publishResult.total,
        published: publishResult.published,
        skipped: publishResult.skipped,
        failed: publishResult.failed,
        revalidation: revalidationResults,
        results: publishResult.results,
      },
      message: `Published ${publishResult.published}/${publishResult.total} draft posts`,
    });

  } catch (error: unknown) {
    console.error('Auto-publish cron error:', error);

    // 에러 로그 기록
    try {
      const supabase = await createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('cron_logs') as any).insert({
        job_name: 'auto-publish',
        status: 'error',
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        created_at: new Date().toISOString(),
      });
    } catch {
      // 로그 기록 실패 무시
    }

    return NextResponse.json(
      { error: 'Failed to process auto-publish' },
      { status: 500 }
    );
  }
}
