/**
 * Content Generation Status API (SSE)
 *
 * GET /api/content/status?batch_id=xxx - 실시간 생성 진행 상태
 *
 * Features:
 * - Server-Sent Events (SSE) 스트리밍
 * - 배치 진행 상태 실시간 업데이트
 * - 개별 작업 완료/실패 알림
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBatchProgress,
  getBatch,
  getBatchJobs,
  getQueueStats,
} from '@/lib/content/generation-queue';
import {
  processNextJob,
  createWorkerSupabaseClient,
  type ProgressEvent,
} from '@/lib/content/generation-worker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/content/status
 * SSE 스트리밍으로 생성 진행 상태 제공
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batch_id');
  const startWorker = searchParams.get('start_worker') === 'true';

  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check admin role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // SSE 스트림 생성
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 헬퍼 함수: SSE 이벤트 전송
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // 헬퍼 함수: 진행 상태 전송
      const sendProgress = async () => {
        if (batchId) {
          const progress = await getBatchProgress(batchId);
          if (progress) {
            sendEvent('progress', progress);
            return progress.is_complete;
          }
        } else {
          const stats = await getQueueStats();
          sendEvent('stats', stats);
        }
        return false;
      };

      try {
        // 초기 상태 전송
        sendEvent('connected', {
          message: 'SSE connection established',
          batch_id: batchId,
          timestamp: new Date().toISOString(),
        });

        await sendProgress();

        // 워커 시작 요청이 있으면 워커 실행
        if (startWorker && batchId) {
          const workerSupabase = createWorkerSupabaseClient();

          // 배치 확인
          const batch = await getBatch(batchId);
          if (!batch) {
            sendEvent('error', { message: 'Batch not found' });
            controller.close();
            return;
          }

          sendEvent('worker_started', {
            batch_id: batchId,
            total: batch.total,
            timestamp: new Date().toISOString(),
          });

          // 작업 처리
          let isComplete = false;
          while (!isComplete) {
            // 진행 상태 전송
            const progress = await getBatchProgress(batchId);
            if (progress) {
              sendEvent('progress', progress);
              isComplete = progress.is_complete;
            }

            if (isComplete) break;

            // 다음 작업 처리
            const result = await processNextJob({
              supabase: workerSupabase,
              onProgress: (event: ProgressEvent) => {
                sendEvent(event.type, event);
              },
            });

            if (!result) {
              // 처리할 작업 없으면 잠시 대기 후 재확인
              await new Promise(resolve => setTimeout(resolve, 2000));

              // 배치 완료 여부 재확인
              const updatedBatch = await getBatch(batchId);
              if (
                updatedBatch &&
                (updatedBatch.status === 'completed' ||
                  updatedBatch.status === 'partial' ||
                  updatedBatch.status === 'failed')
              ) {
                isComplete = true;
              }
            }
          }

          // 최종 결과 전송
          const finalBatch = await getBatch(batchId);
          const finalJobs = await getBatchJobs(batchId);

          sendEvent('batch_completed', {
            batch_id: batchId,
            status: finalBatch?.status,
            total: finalBatch?.total,
            completed: finalBatch?.completed,
            failed: finalBatch?.failed,
            jobs: finalJobs.map(j => ({
              id: j.id,
              keyword_id: j.keyword_id,
              keyword: j.keyword,
              status: j.status,
              quality_score: j.quality_score,
              blog_post_id: j.blog_post_id,
              error_message: j.error_message,
            })),
            timestamp: new Date().toISOString(),
          });
        } else {
          // 워커 없이 폴링 모드 (진행 상태만 확인)
          let pollCount = 0;
          const maxPolls = 300; // 최대 5분 (1초 간격)

          while (pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const isComplete = await sendProgress();
            if (isComplete) break;

            pollCount++;
          }
        }

        sendEvent('done', {
          message: 'Stream completed',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
