/**
 * Admin Progress API
 *
 * GET /api/admin/progress - Get real-time generation progress
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  secureLog,
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const adminSupabase = await createAdminClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get content generation jobs from content_keywords
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingKeywords } = await (adminSupabase.from('content_keywords') as any)
      .select('id, keyword, locale, status, created_at, updated_at')
      .in('status', ['pending', 'generating', 'review'])
      .order('updated_at', { ascending: false })
      .limit(50);

    // Transform to content jobs format
    const contentJobs = (pendingKeywords || []).map((kw: {
      id: string;
      keyword: string;
      locale: string;
      status: string;
      created_at: string;
      updated_at: string;
    }) => ({
      id: kw.id,
      keyword: kw.keyword,
      locale: kw.locale,
      status: kw.status === 'generating' ? 'generating' : kw.status === 'review' ? 'completed' : 'queued',
      progress: kw.status === 'generating' ? 50 : kw.status === 'review' ? 100 : 0,
      currentStep: kw.status === 'generating' ? 'AI Content Generation...' : kw.status === 'review' ? 'Ready for review' : 'Waiting in queue',
      startedAt: kw.status !== 'pending' ? kw.updated_at : null,
      completedAt: kw.status === 'review' ? kw.updated_at : null,
      error: null,
      blogPostId: null,
    }));

    // Get image generation jobs (from a hypothetical table or Redis)
    // For now, we'll check blog_posts without cover images
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: postsNeedingImages } = await (adminSupabase.from('blog_posts') as any)
      .select('id, slug, created_at')
      .is('cover_image_url', null)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(20);

    const imageJobs = (postsNeedingImages || []).map((post: {
      id: string;
      slug: string;
      created_at: string;
    }) => ({
      id: post.id,
      blogPostId: post.id,
      prompt: `Generate image for: ${post.slug}`,
      status: 'pending',
      imageUrl: null,
      error: null,
      createdAt: post.created_at,
    }));

    // Get cron job history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cronLogs } = await (adminSupabase.from('cron_logs') as any)
      .select('id, job_name, status, execution_time_ms, details, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    const cronJobs = (cronLogs || []).map((log: {
      id: string;
      job_name: string;
      status: string;
      execution_time_ms: number;
      details: Record<string, unknown>;
      created_at: string;
    }) => ({
      id: log.id,
      jobName: log.job_name,
      status: log.status,
      executionTimeMs: log.execution_time_ms || 0,
      details: typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || ''),
      createdAt: log.created_at,
    }));

    // Calculate stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: queuedCount } = await (adminSupabase.from('content_keywords') as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: processingCount } = await (adminSupabase.from('content_keywords') as any)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'generating');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: completedTodayCount } = await (adminSupabase.from('blog_posts') as any)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: failedLogs } = await (adminSupabase.from('cron_logs') as any)
      .select('id')
      .eq('status', 'failed')
      .gte('created_at', todayStart.toISOString());

    // Calculate average processing time from successful cron jobs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: successfulJobs } = await (adminSupabase.from('cron_logs') as any)
      .select('execution_time_ms')
      .eq('status', 'success')
      .gte('created_at', todayStart.toISOString());

    const avgProcessingTime = successfulJobs && successfulJobs.length > 0
      ? successfulJobs.reduce((sum: number, job: { execution_time_ms: number }) =>
          sum + (job.execution_time_ms || 0), 0) / successfulJobs.length
      : 0;

    const stats = {
      totalQueued: queuedCount || 0,
      currentlyProcessing: processingCount || 0,
      completedToday: completedTodayCount || 0,
      failedToday: failedLogs?.length || 0,
      avgProcessingTime: Math.round(avgProcessingTime),
    };

    secureLog('info', 'Progress data fetched', { stats });

    return createSuccessResponse({
      contentJobs,
      imageJobs,
      cronJobs,
      stats,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
