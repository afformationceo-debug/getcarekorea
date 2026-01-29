/**
 * Scheduled Publishing Cron Job
 *
 * GET /api/cron/publish-scheduled - 예약된 포스트 자동 발행
 *
 * Vercel Cron 설정 (vercel.json):
 * "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "0/15 * * * *" }]
 * (15분마다 실행)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { autoPublishPost } from '@/lib/publishing';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Cron 인증 키
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/publish-scheduled
 * 예약된 포스트 자동 발행
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Cron 인증 확인
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    // 예약 발행 대기 중인 포스트 조회
     
    const { data: scheduledPosts, error: fetchError } = await (supabase
      .from('blog_posts') as any)
      .select('id, title, scheduled_at, locale, category')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error('Failed to fetch scheduled posts:', fetchError);
      throw fetchError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      // 크론 로그 기록
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('cron_logs') as any).insert({
        job_name: 'publish-scheduled',
        status: 'success',
        records_processed: 0,
        execution_time_ms: Date.now() - startTime,
        details: { message: 'No scheduled posts to publish' },
      });

      return NextResponse.json({
        success: true,
        data: {
          published: 0,
          message: 'No scheduled posts to publish',
        },
      });
    }

    // 각 포스트 발행
    const results: {
      postId: string;
      title: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const post of scheduledPosts) {
      try {
        const result = await autoPublishPost(supabase, post.id);

        results.push({
          postId: post.id,
          title: post.title,
          success: result.success,
          error: result.issues?.join(', '),
        });

        if (result.success) {
          console.log(`Published scheduled post: ${post.title} (${post.id})`);
        } else {
          console.warn(`Failed to publish: ${post.title} - ${result.issues?.join(', ')}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          postId: post.id,
          title: post.title,
          success: false,
          error: errorMessage,
        });
        console.error(`Error publishing ${post.title}:`, error);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // 크론 로그 기록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('cron_logs') as any).insert({
      job_name: 'publish-scheduled',
      status: failedCount === 0 ? 'success' : 'partial',
      records_processed: scheduledPosts.length,
      execution_time_ms: Date.now() - startTime,
      details: {
        published: successCount,
        failed: failedCount,
        results,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        total: scheduledPosts.length,
        published: successCount,
        failed: failedCount,
        results,
      },
      message: `Published ${successCount}/${scheduledPosts.length} scheduled posts`,
    });
  } catch (error) {
    console.error('Scheduled publishing cron error:', error);

    // 에러 로그 기록
    try {
      const supabase = await createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('cron_logs') as any).insert({
        job_name: 'publish-scheduled',
        status: 'error',
        execution_time_ms: Date.now() - startTime,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // 로그 기록 실패 무시
    }

    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
}
