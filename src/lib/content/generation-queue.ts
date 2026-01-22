/**
 * Content Generation Queue System
 *
 * Redis 기반 콘텐츠 생성 대기열 관리
 * - 작업 추가/조회/업데이트
 * - 상태 관리 (pending, processing, completed, failed)
 * - 재시도 로직
 * - 진행 상태 추적
 */

import { getRedis } from '@/lib/upstash/redis';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  keyword_id: string;
  keyword: string;
  keyword_ko?: string;
  locale: Locale;
  category: string;
  status: JobStatus;
  retry_count: number;
  max_retries: number;
  priority: number;
  // Results
  blog_post_id?: string;
  quality_score?: number;
  error_message?: string;
  // Timestamps
  created_at: string;
  started_at?: string;
  completed_at?: string;
  // Metadata
  requested_by: string;
  batch_id?: string;
}

export interface BatchJob {
  id: string;
  keyword_ids: string[];
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  notify_email?: string;
  auto_publish: boolean;
  requested_by: string;
  created_at: string;
  completed_at?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const QUEUE_KEYS = {
  jobs: 'content:generation:jobs',           // Hash: job_id -> job data
  pending: 'content:generation:pending',     // Sorted Set: priority -> job_id
  processing: 'content:generation:processing', // Set: currently processing job_ids
  completed: 'content:generation:completed', // List: completed job_ids (recent)
  failed: 'content:generation:failed',       // List: failed job_ids
  batches: 'content:generation:batches',     // Hash: batch_id -> batch data
  progress: 'content:generation:progress',   // Hash: batch_id -> progress data
} as const;

const JOB_TTL = 24 * 60 * 60;    // 24 hours
const BATCH_TTL = 7 * 24 * 60 * 60; // 7 days
const MAX_RETRIES = 3;
const MAX_COMPLETED_HISTORY = 100;
const MAX_FAILED_HISTORY = 50;

// =====================================================
// JOB MANAGEMENT
// =====================================================

/**
 * 새 생성 작업 추가
 */
export async function addJob(params: {
  keyword_id: string;
  keyword: string;
  keyword_ko?: string;
  locale: Locale;
  category: string;
  priority?: number;
  requested_by: string;
  batch_id?: string;
}): Promise<GenerationJob> {
  const redis = getRedis();

  const job: GenerationJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    keyword_id: params.keyword_id,
    keyword: params.keyword,
    keyword_ko: params.keyword_ko,
    locale: params.locale,
    category: params.category,
    status: 'pending',
    retry_count: 0,
    max_retries: MAX_RETRIES,
    priority: params.priority ?? 1,
    requested_by: params.requested_by,
    batch_id: params.batch_id,
    created_at: new Date().toISOString(),
  };

  const pipeline = redis.pipeline();

  // 작업 데이터 저장
  pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });

  // 대기 큐에 추가 (priority 기반 정렬)
  pipeline.zadd(QUEUE_KEYS.pending, { score: job.priority, member: job.id });

  // TTL 설정
  pipeline.expire(QUEUE_KEYS.jobs, JOB_TTL);

  await pipeline.exec();

  return job;
}

/**
 * 여러 작업 일괄 추가 (배치)
 */
export async function addBatch(params: {
  keywords: Array<{
    keyword_id: string;
    keyword: string;
    keyword_ko?: string;
    locale: Locale;
    category: string;
    priority?: number;
  }>;
  notify_email?: string;
  auto_publish?: boolean;
  requested_by: string;
}): Promise<{ batch: BatchJob; jobs: GenerationJob[] }> {
  const redis = getRedis();

  const batch_id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const batch: BatchJob = {
    id: batch_id,
    keyword_ids: params.keywords.map(k => k.keyword_id),
    total: params.keywords.length,
    completed: 0,
    failed: 0,
    status: 'pending',
    notify_email: params.notify_email,
    auto_publish: params.auto_publish ?? false,
    requested_by: params.requested_by,
    created_at: new Date().toISOString(),
  };

  // 배치 저장
  await redis.hset(QUEUE_KEYS.batches, { [batch_id]: JSON.stringify(batch) });
  await redis.expire(QUEUE_KEYS.batches, BATCH_TTL);

  // 개별 작업 추가
  const jobs: GenerationJob[] = [];
  for (const kw of params.keywords) {
    const job = await addJob({
      ...kw,
      requested_by: params.requested_by,
      batch_id,
    });
    jobs.push(job);
  }

  return { batch, jobs };
}

/**
 * 작업 조회
 */
export async function getJob(jobId: string): Promise<GenerationJob | null> {
  const redis = getRedis();
  const data = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!data) return null;
  return JSON.parse(data as string);
}

/**
 * 배치 조회
 */
export async function getBatch(batchId: string): Promise<BatchJob | null> {
  const redis = getRedis();
  const data = await redis.hget(QUEUE_KEYS.batches, batchId);
  if (!data) return null;
  return JSON.parse(data as string);
}

/**
 * 다음 처리할 작업 가져오기
 */
export async function getNextJob(): Promise<GenerationJob | null> {
  const redis = getRedis();

  // 우선순위가 가장 높은(점수가 높은) 작업 가져오기
  const result = await redis.zpopmax(QUEUE_KEYS.pending, 1);

  if (!result || result.length === 0) return null;

  const jobId = result[0] as string;
  const job = await getJob(jobId);

  if (!job) return null;

  // processing 상태로 변경
  job.status = 'processing';
  job.started_at = new Date().toISOString();

  const pipeline = redis.pipeline();
  pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });
  pipeline.sadd(QUEUE_KEYS.processing, job.id);
  await pipeline.exec();

  return job;
}

/**
 * 작업 완료 처리
 */
export async function completeJob(
  jobId: string,
  result: {
    blog_post_id?: string;
    quality_score?: number;
  }
): Promise<GenerationJob | null> {
  const redis = getRedis();
  const job = await getJob(jobId);

  if (!job) return null;

  job.status = 'completed';
  job.completed_at = new Date().toISOString();
  job.blog_post_id = result.blog_post_id;
  job.quality_score = result.quality_score;

  const pipeline = redis.pipeline();

  // 작업 업데이트
  pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });

  // processing에서 제거
  pipeline.srem(QUEUE_KEYS.processing, job.id);

  // completed 리스트에 추가
  pipeline.lpush(QUEUE_KEYS.completed, job.id);
  pipeline.ltrim(QUEUE_KEYS.completed, 0, MAX_COMPLETED_HISTORY - 1);

  await pipeline.exec();

  // 배치 업데이트
  if (job.batch_id) {
    await updateBatchProgress(job.batch_id, 'completed');
  }

  return job;
}

/**
 * 작업 실패 처리
 */
export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<GenerationJob | null> {
  const redis = getRedis();
  const job = await getJob(jobId);

  if (!job) return null;

  job.retry_count += 1;
  job.error_message = errorMessage;

  const pipeline = redis.pipeline();

  // processing에서 제거
  pipeline.srem(QUEUE_KEYS.processing, job.id);

  if (job.retry_count < job.max_retries) {
    // 재시도 가능: 다시 pending 큐에 추가 (우선순위 낮춤)
    job.status = 'pending';
    pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });
    pipeline.zadd(QUEUE_KEYS.pending, {
      score: Math.max(1, job.priority - 1),
      member: job.id,
    });
  } else {
    // 최대 재시도 초과: 실패 처리
    job.status = 'failed';
    job.completed_at = new Date().toISOString();
    pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });
    pipeline.lpush(QUEUE_KEYS.failed, job.id);
    pipeline.ltrim(QUEUE_KEYS.failed, 0, MAX_FAILED_HISTORY - 1);

    // 배치 업데이트
    if (job.batch_id) {
      await updateBatchProgress(job.batch_id, 'failed');
    }
  }

  await pipeline.exec();

  return job;
}

/**
 * 배치 진행 상황 업데이트
 */
async function updateBatchProgress(
  batchId: string,
  event: 'completed' | 'failed'
): Promise<void> {
  const redis = getRedis();
  const batch = await getBatch(batchId);

  if (!batch) return;

  if (event === 'completed') {
    batch.completed += 1;
  } else {
    batch.failed += 1;
  }

  const processed = batch.completed + batch.failed;

  if (processed >= batch.total) {
    batch.completed_at = new Date().toISOString();
    if (batch.failed === 0) {
      batch.status = 'completed';
    } else if (batch.completed === 0) {
      batch.status = 'failed';
    } else {
      batch.status = 'partial';
    }
  } else {
    batch.status = 'processing';
  }

  await redis.hset(QUEUE_KEYS.batches, { [batchId]: JSON.stringify(batch) });
}

// =====================================================
// QUEUE STATISTICS
// =====================================================

/**
 * 큐 통계 조회
 */
export async function getQueueStats(): Promise<QueueStats> {
  const redis = getRedis();

  const [pendingCount, processingCount, completedList, failedList] = await Promise.all([
    redis.zcard(QUEUE_KEYS.pending),
    redis.scard(QUEUE_KEYS.processing),
    redis.llen(QUEUE_KEYS.completed),
    redis.llen(QUEUE_KEYS.failed),
  ]);

  return {
    pending: pendingCount,
    processing: processingCount,
    completed: completedList,
    failed: failedList,
    total: pendingCount + processingCount + completedList + failedList,
  };
}

/**
 * 대기 중인 작업 목록 조회
 */
export async function getPendingJobs(limit: number = 20): Promise<GenerationJob[]> {
  const redis = getRedis();

  // 우선순위 높은 순으로 조회
  const jobIds = await redis.zrange(QUEUE_KEYS.pending, 0, limit - 1, { rev: true });

  if (!jobIds || jobIds.length === 0) return [];

  const jobs: GenerationJob[] = [];
  for (const jobId of jobIds) {
    const job = await getJob(jobId as string);
    if (job) jobs.push(job);
  }

  return jobs;
}

/**
 * 처리 중인 작업 목록 조회
 */
export async function getProcessingJobs(): Promise<GenerationJob[]> {
  const redis = getRedis();

  const jobIds = await redis.smembers(QUEUE_KEYS.processing);

  if (!jobIds || jobIds.length === 0) return [];

  const jobs: GenerationJob[] = [];
  for (const jobId of jobIds) {
    const job = await getJob(jobId as string);
    if (job) jobs.push(job);
  }

  return jobs;
}

/**
 * 최근 완료된 작업 목록 조회
 */
export async function getCompletedJobs(limit: number = 20): Promise<GenerationJob[]> {
  const redis = getRedis();

  const jobIds = await redis.lrange(QUEUE_KEYS.completed, 0, limit - 1);

  if (!jobIds || jobIds.length === 0) return [];

  const jobs: GenerationJob[] = [];
  for (const jobId of jobIds) {
    const job = await getJob(jobId as string);
    if (job) jobs.push(job);
  }

  return jobs;
}

/**
 * 최근 실패한 작업 목록 조회
 */
export async function getFailedJobs(limit: number = 20): Promise<GenerationJob[]> {
  const redis = getRedis();

  const jobIds = await redis.lrange(QUEUE_KEYS.failed, 0, limit - 1);

  if (!jobIds || jobIds.length === 0) return [];

  const jobs: GenerationJob[] = [];
  for (const jobId of jobIds) {
    const job = await getJob(jobId as string);
    if (job) jobs.push(job);
  }

  return jobs;
}

/**
 * 배치의 모든 작업 조회
 */
export async function getBatchJobs(batchId: string): Promise<GenerationJob[]> {
  const redis = getRedis();
  const batch = await getBatch(batchId);

  if (!batch) return [];

  const jobs: GenerationJob[] = [];

  // 모든 작업 데이터 조회
  const allJobs = await redis.hgetall(QUEUE_KEYS.jobs);

  if (allJobs) {
    for (const [, value] of Object.entries(allJobs)) {
      const job = JSON.parse(value as string) as GenerationJob;
      if (job.batch_id === batchId) {
        jobs.push(job);
      }
    }
  }

  return jobs;
}

// =====================================================
// CLEANUP & MAINTENANCE
// =====================================================

/**
 * 오래된 작업 정리
 */
export async function cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
  const redis = getRedis();
  const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

  const allJobs = await redis.hgetall(QUEUE_KEYS.jobs);
  if (!allJobs) return 0;

  let cleaned = 0;

  for (const [jobId, value] of Object.entries(allJobs)) {
    const job = JSON.parse(value as string) as GenerationJob;

    if (
      (job.status === 'completed' || job.status === 'failed') &&
      job.completed_at &&
      job.completed_at < cutoffTime
    ) {
      await redis.hdel(QUEUE_KEYS.jobs, jobId);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * 멈춘 작업 복구 (processing 상태에서 오래된 작업)
 */
export async function recoverStuckJobs(stuckMinutes: number = 30): Promise<number> {
  const redis = getRedis();
  const cutoffTime = new Date(Date.now() - stuckMinutes * 60 * 1000).toISOString();

  const processingIds = await redis.smembers(QUEUE_KEYS.processing);
  if (!processingIds || processingIds.length === 0) return 0;

  let recovered = 0;

  for (const jobId of processingIds) {
    const job = await getJob(jobId as string);

    if (job && job.started_at && job.started_at < cutoffTime) {
      // 다시 pending 큐에 추가
      job.status = 'pending';
      job.retry_count += 1;
      job.error_message = 'Job stuck in processing, recovered';

      const pipeline = redis.pipeline();
      pipeline.hset(QUEUE_KEYS.jobs, { [job.id]: JSON.stringify(job) });
      pipeline.srem(QUEUE_KEYS.processing, job.id);
      pipeline.zadd(QUEUE_KEYS.pending, { score: job.priority, member: job.id });
      await pipeline.exec();

      recovered++;
    }
  }

  return recovered;
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

export interface ProgressUpdate {
  batch_id: string;
  total: number;
  completed: number;
  failed: number;
  current_job?: {
    id: string;
    keyword: string;
    status: JobStatus;
  };
  is_complete: boolean;
  started_at: string;
  updated_at: string;
}

/**
 * 배치 진행 상황 조회
 */
export async function getBatchProgress(batchId: string): Promise<ProgressUpdate | null> {
  const batch = await getBatch(batchId);
  if (!batch) return null;

  const jobs = await getBatchJobs(batchId);
  const processingJob = jobs.find(j => j.status === 'processing');

  return {
    batch_id: batchId,
    total: batch.total,
    completed: batch.completed,
    failed: batch.failed,
    current_job: processingJob
      ? {
          id: processingJob.id,
          keyword: processingJob.keyword,
          status: processingJob.status,
        }
      : undefined,
    is_complete: batch.status === 'completed' || batch.status === 'partial' || batch.status === 'failed',
    started_at: batch.created_at,
    updated_at: new Date().toISOString(),
  };
}
