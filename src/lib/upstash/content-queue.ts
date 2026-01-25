/**
 * Content Generation Queue Management
 *
 * Redis-based queue for content generation with TTL, retry policies,
 * dead letter queue, and priority handling.
 */

import { getRedis } from './redis';

// =====================================================
// TYPES
// =====================================================

export interface QueueJob<T = unknown> {
  id: string;
  type: 'content_generation' | 'image_generation' | 'translation' | 'seo_optimization';
  payload: T;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dead';
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  updatedAt: number;
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ContentGenerationPayload {
  keywordId: string;
  keyword: string;
  locale: string;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface ImageGenerationPayload {
  blogPostId: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
}

export interface TranslationPayload {
  blogPostId: string;
  sourceLocale: string;
  targetLocales: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

const QUEUE_KEYS = {
  // Main queues (sorted sets by priority/timestamp)
  content: 'queue:content',
  image: 'queue:image',
  translation: 'queue:translation',

  // Processing sets (currently being processed)
  processing: 'queue:processing',

  // Dead letter queue (failed after max retries)
  deadLetter: 'queue:dead',

  // Job data (hash storage)
  jobs: 'queue:jobs',

  // Stats
  stats: 'queue:stats',
} as const;

// TTL configurations
const TTL = {
  pendingJob: 7 * 24 * 60 * 60,      // 7 days for pending jobs
  processingJob: 30 * 60,            // 30 minutes processing timeout
  completedJob: 24 * 60 * 60,        // 24 hours for completed jobs
  deadLetterJob: 30 * 24 * 60 * 60,  // 30 days for dead letter jobs
  stats: 90 * 24 * 60 * 60,          // 90 days for stats
} as const;

// Retry configurations
const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 300000,   // 5 minutes
} as const;

// Priority scores (higher = processed first)
const PRIORITY_SCORES = {
  high: 100,
  normal: 50,
  low: 10,
} as const;

// =====================================================
// QUEUE OPERATIONS
// =====================================================

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Add a job to the content generation queue
 */
export async function enqueueContentGeneration(
  payload: ContentGenerationPayload,
  options?: { priority?: 'high' | 'normal' | 'low'; scheduledAt?: number }
): Promise<string> {
  const redis = getRedis();
  const jobId = generateJobId();
  const now = Date.now();
  const priority = options?.priority || payload.priority || 'normal';

  const job: QueueJob<ContentGenerationPayload> = {
    id: jobId,
    type: 'content_generation',
    payload,
    priority,
    status: 'pending',
    attempts: 0,
    maxAttempts: RETRY_CONFIG.maxAttempts,
    createdAt: now,
    updatedAt: now,
    scheduledAt: options?.scheduledAt,
    metadata: {
      keyword: payload.keyword,
      locale: payload.locale,
      category: payload.category,
    },
  };

  // Store job data
  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });

  // Set TTL on job data
  await redis.expire(`${QUEUE_KEYS.jobs}:${jobId}`, TTL.pendingJob);

  // Add to queue with priority score
  // Score = priority * 1000000000 + (MAX_TIMESTAMP - timestamp) for FIFO within priority
  const scheduledTime = options?.scheduledAt || now;
  const score = PRIORITY_SCORES[priority] * 1000000000 + (9999999999999 - scheduledTime);
  await redis.zadd(QUEUE_KEYS.content, { score, member: jobId });

  // Update stats
  await incrementQueueStat('content', 'enqueued');

  return jobId;
}

/**
 * Add a job to the image generation queue
 */
export async function enqueueImageGeneration(
  payload: ImageGenerationPayload,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<string> {
  const redis = getRedis();
  const jobId = generateJobId();
  const now = Date.now();

  const job: QueueJob<ImageGenerationPayload> = {
    id: jobId,
    type: 'image_generation',
    payload,
    priority,
    status: 'pending',
    attempts: 0,
    maxAttempts: RETRY_CONFIG.maxAttempts,
    createdAt: now,
    updatedAt: now,
  };

  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });
  const score = PRIORITY_SCORES[priority] * 1000000000 + (9999999999999 - now);
  await redis.zadd(QUEUE_KEYS.image, { score, member: jobId });
  await incrementQueueStat('image', 'enqueued');

  return jobId;
}

/**
 * Add a job to the translation queue
 */
export async function enqueueTranslation(
  payload: TranslationPayload,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<string> {
  const redis = getRedis();
  const jobId = generateJobId();
  const now = Date.now();

  const job: QueueJob<TranslationPayload> = {
    id: jobId,
    type: 'translation',
    payload,
    priority,
    status: 'pending',
    attempts: 0,
    maxAttempts: RETRY_CONFIG.maxAttempts,
    createdAt: now,
    updatedAt: now,
  };

  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });
  const score = PRIORITY_SCORES[priority] * 1000000000 + (9999999999999 - now);
  await redis.zadd(QUEUE_KEYS.translation, { score, member: jobId });
  await incrementQueueStat('translation', 'enqueued');

  return jobId;
}

/**
 * Dequeue and start processing a job
 */
export async function dequeueJob(
  queueType: 'content' | 'image' | 'translation'
): Promise<QueueJob | null> {
  const redis = getRedis();
  const queueKey = QUEUE_KEYS[queueType];

  // Get highest priority job (highest score)
  const jobIds = await redis.zrange(queueKey, -1, -1);
  if (!jobIds || jobIds.length === 0) return null;

  const jobId = jobIds[0] as string;

  // Remove from queue
  await redis.zrem(queueKey, jobId);

  // Get job data
  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return null;

  const job: QueueJob = JSON.parse(jobData as string);
  const now = Date.now();

  // Update job status
  job.status = 'processing';
  job.startedAt = now;
  job.updatedAt = now;
  job.attempts += 1;

  // Store updated job
  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });

  // Add to processing set with timeout
  await redis.zadd(QUEUE_KEYS.processing, { score: now + TTL.processingJob * 1000, member: jobId });

  // Update stats
  await incrementQueueStat(queueType, 'processing');

  return job;
}

/**
 * Mark a job as completed
 */
export async function completeJob(
  jobId: string,
  result?: unknown
): Promise<void> {
  const redis = getRedis();
  const now = Date.now();

  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return;

  const job: QueueJob = JSON.parse(jobData as string);
  job.status = 'completed';
  job.completedAt = now;
  job.updatedAt = now;
  job.result = result;

  // Update job data
  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });

  // Remove from processing set
  await redis.zrem(QUEUE_KEYS.processing, jobId);

  // Set TTL for completed job cleanup
  // Note: Individual hash field TTL not supported, so we track completed jobs separately

  // Update stats
  await incrementQueueStat(job.type.replace('_generation', '').replace('_optimization', ''), 'completed');
}

/**
 * Mark a job as failed and handle retry logic
 */
export async function failJob(
  jobId: string,
  error: string
): Promise<{ retrying: boolean; movedToDLQ: boolean }> {
  const redis = getRedis();
  const now = Date.now();

  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return { retrying: false, movedToDLQ: false };

  const job: QueueJob = JSON.parse(jobData as string);
  job.error = error;
  job.updatedAt = now;

  // Remove from processing set
  await redis.zrem(QUEUE_KEYS.processing, jobId);

  // Check if we should retry
  if (job.attempts < job.maxAttempts) {
    // Schedule retry with backoff
    const retryDelay = calculateRetryDelay(job.attempts);
    const retryTime = now + retryDelay;

    job.status = 'pending';
    job.scheduledAt = retryTime;

    await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });

    // Re-queue with scheduled time
    const queueKey = getQueueKeyForType(job.type);
    const score = PRIORITY_SCORES[job.priority] * 1000000000 + (9999999999999 - retryTime);
    await redis.zadd(queueKey, { score, member: jobId });

    await incrementQueueStat(job.type.split('_')[0], 'retried');

    return { retrying: true, movedToDLQ: false };
  }

  // Move to dead letter queue
  job.status = 'dead';
  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });
  await redis.zadd(QUEUE_KEYS.deadLetter, { score: now, member: jobId });

  await incrementQueueStat(job.type.split('_')[0], 'dead');

  return { retrying: false, movedToDLQ: true };
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<QueueJob | null> {
  const redis = getRedis();
  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return null;
  return JSON.parse(jobData as string);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  content: { pending: number; processing: number; completed: number; failed: number };
  image: { pending: number; processing: number; completed: number; failed: number };
  translation: { pending: number; processing: number; completed: number; failed: number };
  deadLetter: number;
}> {
  const redis = getRedis();

  const [contentPending, imagePending, translationPending, processingCount, deadCount] = await Promise.all([
    redis.zcard(QUEUE_KEYS.content),
    redis.zcard(QUEUE_KEYS.image),
    redis.zcard(QUEUE_KEYS.translation),
    redis.zcard(QUEUE_KEYS.processing),
    redis.zcard(QUEUE_KEYS.deadLetter),
  ]);

  // Get daily stats
  const today = new Date().toISOString().split('T')[0];
  const statsKey = `${QUEUE_KEYS.stats}:${today}`;
  const stats = await redis.hgetall(statsKey) || {};

  return {
    content: {
      pending: contentPending || 0,
      processing: Number(stats['content:processing'] || 0),
      completed: Number(stats['content:completed'] || 0),
      failed: Number(stats['content:dead'] || 0),
    },
    image: {
      pending: imagePending || 0,
      processing: Number(stats['image:processing'] || 0),
      completed: Number(stats['image:completed'] || 0),
      failed: Number(stats['image:dead'] || 0),
    },
    translation: {
      pending: translationPending || 0,
      processing: Number(stats['translation:processing'] || 0),
      completed: Number(stats['translation:completed'] || 0),
      failed: Number(stats['translation:dead'] || 0),
    },
    deadLetter: deadCount || 0,
  };
}

/**
 * Get dead letter queue jobs
 */
export async function getDeadLetterJobs(limit: number = 50): Promise<QueueJob[]> {
  const redis = getRedis();
  const jobIds = await redis.zrange(QUEUE_KEYS.deadLetter, 0, limit - 1, { rev: true });

  const jobs: QueueJob[] = [];
  for (const jobId of jobIds) {
    const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId as string);
    if (jobData) {
      jobs.push(JSON.parse(jobData as string));
    }
  }

  return jobs;
}

/**
 * Retry a dead letter job
 */
export async function retryDeadLetterJob(jobId: string): Promise<boolean> {
  const redis = getRedis();

  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return false;

  const job: QueueJob = JSON.parse(jobData as string);
  if (job.status !== 'dead') return false;

  // Reset job
  job.status = 'pending';
  job.attempts = 0;
  job.error = undefined;
  job.updatedAt = Date.now();

  await redis.hset(QUEUE_KEYS.jobs, { [jobId]: JSON.stringify(job) });
  await redis.zrem(QUEUE_KEYS.deadLetter, jobId);

  // Re-queue
  const queueKey = getQueueKeyForType(job.type);
  const score = PRIORITY_SCORES[job.priority] * 1000000000 + (9999999999999 - Date.now());
  await redis.zadd(queueKey, { score, member: jobId });

  return true;
}

/**
 * Clean up stale processing jobs (processing timeout exceeded)
 */
export async function cleanupStaleJobs(): Promise<number> {
  const redis = getRedis();
  const now = Date.now();

  // Get jobs that have exceeded processing timeout
  // Upstash Redis uses zrange with byscore option
  const staleJobIds = await redis.zrange(QUEUE_KEYS.processing, 0, now, { byScore: true });

  let cleanedCount = 0;
  for (const jobId of staleJobIds) {
    const result = await failJob(jobId as string, 'Processing timeout exceeded');
    if (result.retrying || result.movedToDLQ) {
      cleanedCount++;
    }
  }

  return cleanedCount;
}

/**
 * Purge completed jobs older than TTL
 */
export async function purgeOldCompletedJobs(): Promise<number> {
  const redis = getRedis();
  const cutoff = Date.now() - TTL.completedJob * 1000;

  // Get all jobs and filter completed ones
  const allJobs = await redis.hgetall(QUEUE_KEYS.jobs);
  if (!allJobs) return 0;

  let purgedCount = 0;
  for (const [jobId, jobData] of Object.entries(allJobs)) {
    const job: QueueJob = JSON.parse(jobData as string);
    if (job.status === 'completed' && job.completedAt && job.completedAt < cutoff) {
      await redis.hdel(QUEUE_KEYS.jobs, jobId);
      purgedCount++;
    }
  }

  return purgedCount;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getQueueKeyForType(type: string): string {
  if (type.includes('content')) return QUEUE_KEYS.content;
  if (type.includes('image')) return QUEUE_KEYS.image;
  if (type.includes('translation')) return QUEUE_KEYS.translation;
  return QUEUE_KEYS.content;
}

async function incrementQueueStat(queue: string, stat: string): Promise<void> {
  const redis = getRedis();
  const today = new Date().toISOString().split('T')[0];
  const statsKey = `${QUEUE_KEYS.stats}:${today}`;

  await redis.hincrby(statsKey, `${queue}:${stat}`, 1);
  await redis.expire(statsKey, TTL.stats);
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Enqueue multiple content generation jobs
 */
export async function enqueueBatchContentGeneration(
  payloads: ContentGenerationPayload[],
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<string[]> {
  const jobIds: string[] = [];

  for (const payload of payloads) {
    const jobId = await enqueueContentGeneration(payload, { priority });
    jobIds.push(jobId);
  }

  return jobIds;
}

/**
 * Get pending jobs for a specific queue
 */
export async function getPendingJobs(
  queueType: 'content' | 'image' | 'translation',
  limit: number = 50
): Promise<QueueJob[]> {
  const redis = getRedis();
  const queueKey = QUEUE_KEYS[queueType];

  const jobIds = await redis.zrange(queueKey, 0, limit - 1, { rev: true });

  const jobs: QueueJob[] = [];
  for (const jobId of jobIds) {
    const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId as string);
    if (jobData) {
      jobs.push(JSON.parse(jobData as string));
    }
  }

  return jobs;
}

/**
 * Cancel a pending job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const redis = getRedis();

  const jobData = await redis.hget(QUEUE_KEYS.jobs, jobId);
  if (!jobData) return false;

  const job: QueueJob = JSON.parse(jobData as string);
  if (job.status !== 'pending') return false;

  // Remove from queue
  const queueKey = getQueueKeyForType(job.type);
  await redis.zrem(queueKey, jobId);

  // Remove job data
  await redis.hdel(QUEUE_KEYS.jobs, jobId);

  return true;
}
