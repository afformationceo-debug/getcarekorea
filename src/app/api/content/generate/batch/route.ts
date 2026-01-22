/**
 * Batch Content Generation API
 *
 * POST /api/content/generate/batch - 다중 키워드 콘텐츠 일괄 생성
 *
 * Features:
 * - 다중 키워드 선택 후 일괄 생성 요청
 * - Redis 큐에 작업 추가
 * - 배치 ID 반환 (진행 상태 추적용)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';
import { addBatch, getQueueStats } from '@/lib/content/generation-queue';
import type { Locale } from '@/lib/i18n/config';

const SUPPORTED_LOCALES: Locale[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'];
const MAX_BATCH_SIZE = 50; // 한 번에 최대 50개 키워드

interface BatchGenerateRequest {
  keyword_ids: string[];
  notify_email?: string;
  auto_publish?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Parse request body
    const body: BatchGenerateRequest = await request.json();

    // Validate required fields
    if (!body.keyword_ids || !Array.isArray(body.keyword_ids) || body.keyword_ids.length === 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        'keyword_ids 배열이 필요합니다.',
        { field: 'keyword_ids' },
        locale
      );
    }

    // Check batch size limit
    if (body.keyword_ids.length > MAX_BATCH_SIZE) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        `한 번에 최대 ${MAX_BATCH_SIZE}개까지 생성 가능합니다. 현재: ${body.keyword_ids.length}개`,
        { max: MAX_BATCH_SIZE, current: body.keyword_ids.length },
        locale
      );
    }

    // Fetch keywords from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keywords, error: keywordsError } = await (supabase.from('content_keywords') as any)
      .select('*')
      .in('id', body.keyword_ids);

    if (keywordsError) {
      secureLog('error', 'Error fetching keywords', { error: keywordsError.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    if (!keywords || keywords.length === 0) {
      throw new APIError(
        ErrorCode.NOT_FOUND,
        '키워드를 찾을 수 없습니다.',
        { keyword_ids: body.keyword_ids },
        locale
      );
    }

    // Filter out already generated keywords (optional: allow regeneration)
    const pendingKeywords = keywords.filter(
      (k: { status: string }) => k.status === 'pending' || k.status === 'generated'
    );

    if (pendingKeywords.length === 0) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        '생성 가능한 키워드가 없습니다. (이미 발행됨 또는 생성 중)',
        undefined,
        locale
      );
    }

    // Prepare keywords for queue
    const keywordsForQueue = pendingKeywords.map((k: {
      id: string;
      keyword: string;
      keyword_native?: string;
      keyword_ko?: string;
      locale: string;
      category: string;
      priority: number;
    }) => ({
      keyword_id: k.id,
      keyword: k.keyword_native || k.keyword,
      keyword_ko: k.keyword_ko,
      locale: (SUPPORTED_LOCALES.includes(k.locale as Locale) ? k.locale : 'en') as Locale,
      category: k.category || 'general',
      priority: k.priority || 1,
    }));

    // Add batch to queue
    const { batch, jobs } = await addBatch({
      keywords: keywordsForQueue,
      notify_email: body.notify_email || profile.email,
      auto_publish: body.auto_publish ?? false,
      requested_by: user.id,
    });

    // Update keywords status to 'generating' in database
    const keywordIdsToUpdate = pendingKeywords.map((k: { id: string }) => k.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('content_keywords') as any)
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .in('id', keywordIdsToUpdate);

    // Get current queue stats
    const queueStats = await getQueueStats();

    secureLog('info', 'Batch generation started', {
      batch_id: batch.id,
      total_keywords: batch.total,
      requested_by: user.id,
      notify_email: batch.notify_email,
    });

    return createSuccessResponse({
      success: true,
      data: {
        batch_id: batch.id,
        total: batch.total,
        jobs: jobs.map(j => ({
          id: j.id,
          keyword_id: j.keyword_id,
          keyword: j.keyword,
          locale: j.locale,
          status: j.status,
        })),
        queue_stats: queueStats,
      },
      message: `${batch.total}개 키워드 생성 작업이 큐에 추가되었습니다.`,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * GET /api/content/generate/batch
 * 배치 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new APIError(ErrorCode.UNAUTHORIZED);
    }

    // Check admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new APIError(ErrorCode.FORBIDDEN);
    }

    // Get queue stats
    const stats = await getQueueStats();

    return createSuccessResponse({
      success: true,
      data: {
        queue_stats: stats,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
