/**
 * Auto Publish Cron Job
 *
 * GET /api/cron/auto-publish - 고품질 드래프트 자동 발행
 *
 * Vercel Cron: 15분마다 실행 (vercel.json)
 * DB 설정에 따라 실제 실행 여부 결정
 *
 * 동작 방식:
 * 1. system_settings에서 스케줄 설정 조회
 * 2. 현재 시간이 설정된 스케줄에 맞는지 확인
 * 3. draft 상태의 blog_posts 조회
 * 4. 품질 점수 75점 이상인 포스트 필터링
 * 5. 자동 발행 (published 상태로 변경)
 * 6. ISR 재검증 트리거
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

// 기본 발행 제한
const DEFAULT_PUBLISH_LIMIT = 10;

// =====================================================
// SCHEDULE CHECK HELPERS
// =====================================================

interface CronPublishSettings {
  enabled: boolean;
  schedule: string;
  max_publish_per_run: number;
}

/**
 * Parse cron expression and check if current time matches
 */
function shouldRunNow(cronExpression: string): boolean {
  const now = new Date();
  const currentMinute = now.getMinutes();
  const currentHour = now.getHours();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentDow = now.getDay();

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return false;

  const [minutePart, hourPart, dayPart, monthPart, dowPart] = parts;

  // Check minute
  if (!matchesCronField(minutePart, currentMinute, 0, 59)) return false;

  // Check hour
  if (!matchesCronField(hourPart, currentHour, 0, 23)) return false;

  // Check day of month
  if (!matchesCronField(dayPart, currentDay, 1, 31)) return false;

  // Check month
  if (!matchesCronField(monthPart, currentMonth, 1, 12)) return false;

  // Check day of week
  if (!matchesCronField(dowPart, currentDow, 0, 6)) return false;

  return true;
}

/**
 * Check if a value matches a cron field
 */
function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  if (field === '*') return true;

  // Step values: */15, */2, etc.
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2));
    return (value - min) % step === 0;
  }

  // Range: 1-5
  if (field.includes('-') && !field.includes(',')) {
    const [start, end] = field.split('-').map(n => parseInt(n));
    return value >= start && value <= end;
  }

  // List: 1,3,5
  if (field.includes(',')) {
    const values = field.split(',').map(n => parseInt(n.trim()));
    return values.includes(value);
  }

  // Exact value
  return parseInt(field) === value;
}

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

    // 0. 시스템 설정 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData } = await (supabase.from('system_settings') as any)
      .select('value')
      .eq('key', 'cron_auto_publish')
      .single();

    const settings: CronPublishSettings = settingsData?.value || {
      enabled: true,
      schedule: '0 10 * * *',
      max_publish_per_run: DEFAULT_PUBLISH_LIMIT,
    };

    // 0-1. 비활성화 체크
    if (!settings.enabled) {
      console.log('🔕 Auto-publish is disabled');
      return NextResponse.json({
        success: true,
        data: { skipped: true, reason: 'Auto-publish is disabled' },
      });
    }

    // 0-2. 스케줄 체크 (현재 시간이 설정된 스케줄에 맞는지)
    if (!shouldRunNow(settings.schedule)) {
      console.log(`⏭️ Skipping: Current time does not match schedule (${settings.schedule})`);
      return NextResponse.json({
        success: true,
        data: { skipped: true, reason: 'Not scheduled to run at this time', schedule: settings.schedule },
      });
    }

    console.log(`\n🚀 Auto-publish cron: Schedule matched (${settings.schedule})`);

    // 사용할 발행 제한 (DB 설정 우선)
    const publishLimit = settings.max_publish_per_run || DEFAULT_PUBLISH_LIMIT;

    // 1. 고품질 드래프트 자동 발행
    const publishResult = await autoPublishPendingPosts(supabase, {
      criteria: {
        ...DEFAULT_PUBLISHING_CRITERIA,
        minQualityScore: 75, // 75점 이상만 자동 발행
      },
      limit: publishLimit,
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
