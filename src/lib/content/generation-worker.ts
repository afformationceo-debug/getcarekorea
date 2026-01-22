/**
 * Content Generation Worker
 *
 * 백그라운드에서 콘텐츠 생성 작업 처리
 * - 큐에서 작업 가져오기
 * - 콘텐츠 생성
 * - 결과 저장
 * - 에러 처리 및 재시도
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getNextJob,
  completeJob,
  failJob,
  getBatch,
  type GenerationJob,
} from './generation-queue';
import { runContentPipeline } from './generator';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

interface WorkerResult {
  job_id: string;
  keyword_id: string;
  success: boolean;
  blog_post_id?: string;
  quality_score?: number;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

interface ProcessingContext {
  supabase: AnySupabaseClient;
  onProgress?: (update: ProgressEvent) => void;
}

export interface ProgressEvent {
  type: 'job_started' | 'job_completed' | 'job_failed' | 'batch_completed';
  job_id?: string;
  keyword?: string;
  batch_id?: string;
  completed?: number;
  total?: number;
  quality_score?: number;
  error?: string;
  timestamp: string;
}

// =====================================================
// WORKER FUNCTIONS
// =====================================================

/**
 * 단일 작업 처리
 */
export async function processJob(
  job: GenerationJob,
  ctx: ProcessingContext
): Promise<WorkerResult> {
  const { supabase, onProgress } = ctx;

  try {
    // 진행 상태 알림
    onProgress?.({
      type: 'job_started',
      job_id: job.id,
      keyword: job.keyword,
      batch_id: job.batch_id,
      timestamp: new Date().toISOString(),
    });

    // 콘텐츠 생성
    const pipelineResult = await runContentPipeline({
      keyword: job.keyword,
      locale: job.locale as Locale,
      category: job.category,
      targetWordCount: 1500,
    });

    const { content, metadata, qualityScore } = pipelineResult;

    // 블로그 포스트 저장
    const blogPostData: Record<string, unknown> = {
      slug: generateSlug(content.title),
      status: 'draft',
      category: job.category || 'medical-tourism',
      tags: content.tags,
      generation_metadata: {
        ...metadata,
        qualityScore: qualityScore.overall,
        job_id: job.id,
        keyword_id: job.keyword_id,
        generatedAt: new Date().toISOString(),
      },
    };

    // 로케일별 콘텐츠 필드 설정
    const localeKey = job.locale.replace('-', '_');
    blogPostData[`title_${localeKey}`] = content.title;
    blogPostData[`excerpt_${localeKey}`] = content.excerpt;
    blogPostData[`content_${localeKey}`] = content.content;
    blogPostData[`meta_title_${localeKey}`] = content.metaTitle;
    blogPostData[`meta_description_${localeKey}`] = content.metaDescription;

    // DB에 저장
    const { data: insertedPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert(blogPostData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save blog post: ${insertError.message}`);
    }

    // 키워드 상태 업데이트
    await supabase
      .from('content_keywords')
      .update({
        status: 'generated',
        blog_post_id: insertedPost.id,
        quality_score: qualityScore.overall,
        generated_at: new Date().toISOString(),
        generation_error: null,
      })
      .eq('id', job.keyword_id);

    // 작업 완료 처리
    await completeJob(job.id, {
      blog_post_id: insertedPost.id,
      quality_score: qualityScore.overall,
    });

    // 진행 상태 알림
    onProgress?.({
      type: 'job_completed',
      job_id: job.id,
      keyword: job.keyword,
      batch_id: job.batch_id,
      quality_score: qualityScore.overall,
      timestamp: new Date().toISOString(),
    });

    return {
      job_id: job.id,
      keyword_id: job.keyword_id,
      success: true,
      blog_post_id: insertedPost.id,
      quality_score: qualityScore.overall,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 작업 실패 처리
    await failJob(job.id, errorMessage);

    // 키워드 에러 상태 업데이트
    await supabase
      .from('content_keywords')
      .update({
        generation_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.keyword_id);

    // 진행 상태 알림
    onProgress?.({
      type: 'job_failed',
      job_id: job.id,
      keyword: job.keyword,
      batch_id: job.batch_id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return {
      job_id: job.id,
      keyword_id: job.keyword_id,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 큐에서 다음 작업 가져와서 처리
 */
export async function processNextJob(
  ctx: ProcessingContext
): Promise<WorkerResult | null> {
  const job = await getNextJob();

  if (!job) {
    return null; // 처리할 작업 없음
  }

  return processJob(job, ctx);
}

/**
 * 배치 내 모든 작업 순차 처리
 */
export async function processBatch(
  batchId: string,
  ctx: ProcessingContext
): Promise<{
  results: WorkerResult[];
  completed: number;
  failed: number;
}> {
  const results: WorkerResult[] = [];
  let completed = 0;
  let failed = 0;

  // 배치 정보 조회
  const batch = await getBatch(batchId);
  if (!batch) {
    throw new Error(`Batch not found: ${batchId}`);
  }

  // 배치의 모든 작업이 완료될 때까지 처리
  while (true) {
    const result = await processNextJob(ctx);

    if (!result) {
      // 더 이상 처리할 작업 없음
      break;
    }

    results.push(result);

    if (result.success) {
      completed++;
    } else {
      failed++;
    }

    // 배치 진행 상태 확인
    const updatedBatch = await getBatch(batchId);
    if (
      updatedBatch &&
      (updatedBatch.status === 'completed' ||
        updatedBatch.status === 'partial' ||
        updatedBatch.status === 'failed')
    ) {
      // 배치 완료
      ctx.onProgress?.({
        type: 'batch_completed',
        batch_id: batchId,
        completed: updatedBatch.completed,
        total: updatedBatch.total,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    // Rate limiting: 작업 간 딜레이 (Claude API rate limit 고려)
    await delay(2000); // 2초 딜레이
  }

  return { results, completed, failed };
}

/**
 * 워커 실행 (지속적으로 큐 처리)
 */
export async function runWorker(
  ctx: ProcessingContext,
  options: {
    maxJobs?: number;       // 최대 처리 작업 수 (0 = 무제한)
    pollInterval?: number;  // 폴링 간격 (ms)
    stopOnEmpty?: boolean;  // 큐 비면 중지
  } = {}
): Promise<{
  processed: number;
  completed: number;
  failed: number;
}> {
  const {
    maxJobs = 0,
    pollInterval = 5000,
    stopOnEmpty = true,
  } = options;

  let processed = 0;
  let completed = 0;
  let failed = 0;

  while (maxJobs === 0 || processed < maxJobs) {
    const result = await processNextJob(ctx);

    if (!result) {
      if (stopOnEmpty) {
        break;
      }
      // 큐 비어있으면 대기 후 재시도
      await delay(pollInterval);
      continue;
    }

    processed++;

    if (result.success) {
      completed++;
    } else {
      failed++;
    }

    // Rate limiting
    await delay(2000);
  }

  return { processed, completed, failed };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/^-+|-+$/g, '');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// SUPABASE CLIENT FOR WORKER
// =====================================================

export function createWorkerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials for worker');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
