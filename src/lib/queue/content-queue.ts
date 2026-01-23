/**
 * Content Generation Queue System
 *
 * Distributed queue using Upstash Redis with:
 * - Parallel processing (max 3 concurrent jobs)
 * - Distributed locks
 * - Progress tracking
 * - Error handling and retry logic
 */

import { Redis } from '@upstash/redis';

// =====================================================
// TYPES
// =====================================================

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type JobType =
  | 'generate_content'
  | 'generate_multilang'
  | 'generate_images'
  | 'publish_content';

export interface ContentJob {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: any;
  priority: number; // 1-10, higher = more urgent
  maxRetries: number;
  currentRetry: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
  workerId?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalJobs: number;
}

// =====================================================
// CONFIGURATION
// =====================================================

const MAX_CONCURRENT_JOBS = 3;
const LOCK_TTL_MS = 300000; // 5 minutes
const JOB_TTL_SECONDS = 86400; // 24 hours
const POLL_INTERVAL_MS = 1000; // 1 second

// =====================================================
// REDIS CLIENT
// =====================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// =====================================================
// QUEUE KEYS
// =====================================================

const KEYS = {
  job: (id: string) => `content:job:${id}`,
  queue: (priority: number) => `content:queue:${priority}`,
  processing: () => `content:processing`,
  lock: (id: string) => `content:lock:${id}`,
  stats: () => `content:stats`,
  worker: (id: string) => `content:worker:${id}`,
};

// =====================================================
// QUEUE OPERATIONS
// =====================================================

/**
 * Add a job to the queue
 */
export async function enqueueJob(
  type: JobType,
  payload: any,
  options: {
    priority?: number;
    maxRetries?: number;
  } = {}
): Promise<string> {
  const { priority = 5, maxRetries = 3 } = options;

  const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const job: ContentJob = {
    id: jobId,
    type,
    status: 'pending',
    payload,
    priority,
    maxRetries,
    currentRetry: 0,
    createdAt: new Date().toISOString(),
  };

  // Save job data
  await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

  // Add to priority queue
  await redis.zadd(KEYS.queue(priority), {
    score: Date.now(),
    member: jobId,
  });

  // Update stats
  await redis.hincrby(KEYS.stats(), 'pending', 1);
  await redis.hincrby(KEYS.stats(), 'totalJobs', 1);

  console.log(`📥 Enqueued job: ${jobId} (priority: ${priority})`);

  return jobId;
}

/**
 * Get next job from queue (respects priority and concurrency limit)
 */
export async function dequeueJob(workerId: string): Promise<ContentJob | null> {
  // Check concurrent job limit
  const processingCount = await redis.zcard(KEYS.processing());
  if (processingCount >= MAX_CONCURRENT_JOBS) {
    console.log(
      `⏸️  Max concurrent jobs reached (${processingCount}/${MAX_CONCURRENT_JOBS})`
    );
    return null;
  }

  // Try to get job from each priority queue (highest first)
  for (let priority = 10; priority >= 1; priority--) {
    const jobIds = await redis.zrange(KEYS.queue(priority), 0, 0);

    if (jobIds.length === 0) {
      continue;
    }

    const jobId = jobIds[0] as string;

    // Try to acquire lock
    const lockAcquired = await acquireLock(jobId, workerId);
    if (!lockAcquired) {
      continue;
    }

    // Remove from pending queue
    await redis.zrem(KEYS.queue(priority), jobId);

    // Add to processing set
    await redis.zadd(KEYS.processing(), {
      score: Date.now(),
      member: jobId,
    });

    // Load job data
    const jobData = await redis.get(KEYS.job(jobId));
    if (!jobData) {
      await releaseLock(jobId, workerId);
      continue;
    }

    const job: ContentJob = JSON.parse(jobData as string);

    // Update job status
    job.status = 'processing';
    job.startedAt = new Date().toISOString();
    job.workerId = workerId;

    await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

    // Update stats
    await redis.hincrby(KEYS.stats(), 'pending', -1);
    await redis.hincrby(KEYS.stats(), 'processing', 1);

    console.log(`📤 Dequeued job: ${jobId} (worker: ${workerId})`);

    return job;
  }

  return null;
}

/**
 * Mark job as completed
 */
export async function completeJob(
  jobId: string,
  workerId: string,
  result?: any
): Promise<void> {
  // Load job
  const jobData = await redis.get(KEYS.job(jobId));
  if (!jobData) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const job: ContentJob = JSON.parse(jobData as string);

  // Update job
  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  job.result = result;

  await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

  // Remove from processing
  await redis.zrem(KEYS.processing(), jobId);

  // Release lock
  await releaseLock(jobId, workerId);

  // Update stats
  await redis.hincrby(KEYS.stats(), 'processing', -1);
  await redis.hincrby(KEYS.stats(), 'completed', 1);

  console.log(`✅ Completed job: ${jobId}`);
}

/**
 * Mark job as failed (with retry logic)
 */
export async function failJob(
  jobId: string,
  workerId: string,
  error: string
): Promise<void> {
  // Load job
  const jobData = await redis.get(KEYS.job(jobId));
  if (!jobData) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const job: ContentJob = JSON.parse(jobData as string);

  // Check if we should retry
  if (job.currentRetry < job.maxRetries) {
    job.currentRetry++;
    job.status = 'pending';
    job.error = error;

    await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

    // Re-enqueue with lower priority
    const newPriority = Math.max(1, job.priority - 2);
    await redis.zadd(KEYS.queue(newPriority), {
      score: Date.now() + 60000, // Delay 1 minute
      member: jobId,
    });

    // Remove from processing
    await redis.zrem(KEYS.processing(), jobId);

    // Release lock
    await releaseLock(jobId, workerId);

    // Update stats
    await redis.hincrby(KEYS.stats(), 'processing', -1);
    await redis.hincrby(KEYS.stats(), 'pending', 1);

    console.log(
      `🔄 Retry job: ${jobId} (attempt ${job.currentRetry}/${job.maxRetries})`
    );
  } else {
    // Max retries reached, mark as failed
    job.status = 'failed';
    job.completedAt = new Date().toISOString();
    job.error = error;

    await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

    // Remove from processing
    await redis.zrem(KEYS.processing(), jobId);

    // Release lock
    await releaseLock(jobId, workerId);

    // Update stats
    await redis.hincrby(KEYS.stats(), 'processing', -1);
    await redis.hincrby(KEYS.stats(), 'failed', 1);

    console.log(`❌ Failed job: ${jobId} (max retries reached)`);
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<ContentJob | null> {
  const jobData = await redis.get(KEYS.job(jobId));
  if (!jobData) {
    return null;
  }

  return JSON.parse(jobData as string);
}

/**
 * Get queue stats
 */
export async function getQueueStats(): Promise<QueueStats> {
  const stats = await redis.hgetall(KEYS.stats());

  return {
    pending: parseInt(stats?.pending as string) || 0,
    processing: parseInt(stats?.processing as string) || 0,
    completed: parseInt(stats?.completed as string) || 0,
    failed: parseInt(stats?.failed as string) || 0,
    totalJobs: parseInt(stats?.totalJobs as string) || 0,
  };
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const jobData = await redis.get(KEYS.job(jobId));
  if (!jobData) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const job: ContentJob = JSON.parse(jobData as string);

  if (job.status === 'processing') {
    throw new Error('Cannot cancel job that is currently processing');
  }

  if (job.status === 'completed' || job.status === 'failed') {
    throw new Error('Cannot cancel completed or failed job');
  }

  // Update job
  job.status = 'cancelled';
  job.completedAt = new Date().toISOString();

  await redis.setex(KEYS.job(jobId), JOB_TTL_SECONDS, JSON.stringify(job));

  // Remove from pending queue
  for (let priority = 1; priority <= 10; priority++) {
    await redis.zrem(KEYS.queue(priority), jobId);
  }

  // Update stats
  await redis.hincrby(KEYS.stats(), 'pending', -1);

  console.log(`🚫 Cancelled job: ${jobId}`);
}

// =====================================================
// DISTRIBUTED LOCKS
// =====================================================

/**
 * Acquire distributed lock
 */
async function acquireLock(
  jobId: string,
  workerId: string
): Promise<boolean> {
  const lockKey = KEYS.lock(jobId);

  // Try to set lock (NX = only if not exists)
  const result = await redis.set(lockKey, workerId, {
    ex: LOCK_TTL_MS / 1000,
    nx: true,
  });

  return result === 'OK';
}

/**
 * Release distributed lock
 */
async function releaseLock(jobId: string, workerId: string): Promise<void> {
  const lockKey = KEYS.lock(jobId);

  // Only release if we own the lock
  const currentOwner = await redis.get(lockKey);
  if (currentOwner === workerId) {
    await redis.del(lockKey);
  }
}

/**
 * Refresh lock (extend TTL)
 */
async function refreshLock(jobId: string, workerId: string): Promise<boolean> {
  const lockKey = KEYS.lock(jobId);

  // Only refresh if we own the lock
  const currentOwner = await redis.get(lockKey);
  if (currentOwner === workerId) {
    await redis.expire(lockKey, LOCK_TTL_MS / 1000);
    return true;
  }

  return false;
}

// =====================================================
// WORKER
// =====================================================

export interface WorkerOptions {
  id?: string;
  pollInterval?: number;
  onJob?: (job: ContentJob) => Promise<any>;
}

/**
 * Start queue worker
 */
export async function startWorker(options: WorkerOptions = {}): Promise<void> {
  const workerId = options.id || `worker-${Date.now()}`;
  const pollInterval = options.pollInterval || POLL_INTERVAL_MS;
  const onJob = options.onJob;

  console.log(`👷 Starting worker: ${workerId}`);

  // Register worker
  await redis.setex(KEYS.worker(workerId), 3600, JSON.stringify({
    id: workerId,
    startedAt: new Date().toISOString(),
    status: 'active',
  }));

  let running = true;

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(`\n🛑 Stopping worker: ${workerId}`);
    running = false;
    await redis.del(KEYS.worker(workerId));
    process.exit(0);
  });

  // Main loop
  while (running) {
    try {
      // Get next job
      const job = await dequeueJob(workerId);

      if (!job) {
        // No job available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      // Process job
      try {
        let result;

        if (onJob) {
          result = await onJob(job);
        } else {
          console.log(`Processing job: ${job.id}`);
          result = await processJob(job);
        }

        await completeJob(job.id, workerId, result);
      } catch (error: any) {
        console.error(`Job error: ${job.id}`, error);
        await failJob(job.id, workerId, error.message);
      }
    } catch (error: any) {
      console.error('Worker error:', error);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }
}

/**
 * Default job processor
 */
async function processJob(job: ContentJob): Promise<any> {
  // This should be implemented based on job type
  console.log(`Processing ${job.type} job:`, job.payload);

  // Simulate work
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true };
}

// Default export - functions are exported inline
