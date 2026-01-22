/**
 * Auto Publishing System
 *
 * 콘텐츠 자동 발행 시스템
 * - 품질 점수 기반 자동 발행
 * - 필수 필드 검증
 * - 상태 자동 전환
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { scoreContentV3, QualityScoreV3 } from '@/lib/content/generator-v3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// =====================================================
// TYPES
// =====================================================

export interface PublishingCriteria {
  minQualityScore: number;
  requireImage: boolean;
  requireMetaDescription: boolean;
  requireExcerpt: boolean;
}

export interface PublishValidationResult {
  isValid: boolean;
  canPublish: boolean;
  qualityScore?: QualityScoreV3;
  issues: string[];
  warnings: string[];
}

export interface AutoPublishResult {
  success: boolean;
  blogPostId: string;
  previousStatus: string;
  newStatus: string;
  publishedAt?: string;
  issues?: string[];
}

export interface BatchPublishResult {
  total: number;
  published: number;
  skipped: number;
  failed: number;
  results: AutoPublishResult[];
}

// =====================================================
// DEFAULT CRITERIA
// =====================================================

export const DEFAULT_PUBLISHING_CRITERIA: PublishingCriteria = {
  minQualityScore: 75,
  requireImage: false, // 이미지 없어도 발행 가능
  requireMetaDescription: true,
  requireExcerpt: true,
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * 발행 가능 여부 검증
 */
export async function validateForPublishing(
  supabase: AnySupabaseClient,
  blogPostId: string,
  criteria: PublishingCriteria = DEFAULT_PUBLISHING_CRITERIA
): Promise<PublishValidationResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 포스트 조회
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', blogPostId)
    .single();

  if (error || !post) {
    return {
      isValid: false,
      canPublish: false,
      issues: ['Post not found'],
      warnings: [],
    };
  }

  // 필수 필드 검증
  if (!post.title || post.title.trim().length === 0) {
    issues.push('Title is required');
  }

  if (!post.content || post.content.trim().length < 500) {
    issues.push('Content must be at least 500 characters');
  }

  if (criteria.requireMetaDescription && (!post.meta_description || post.meta_description.trim().length === 0)) {
    issues.push('Meta description is required');
  }

  if (criteria.requireExcerpt && (!post.excerpt || post.excerpt.trim().length === 0)) {
    issues.push('Excerpt is required');
  }

  if (criteria.requireImage && !post.cover_image_url) {
    issues.push('Cover image is required');
  } else if (!post.cover_image_url) {
    warnings.push('Cover image is missing (optional)');
  }

  // 품질 점수 계산
  let qualityScore: QualityScoreV3 | undefined;
  if (post.content && post.title) {
    // 키워드 조회
    let keyword = '';
    if (post.keyword_id) {
      const { data: keywordData } = await supabase
        .from('content_keywords')
        .select('keyword_native')
        .eq('id', post.keyword_id)
        .single();
      keyword = keywordData?.keyword_native || post.title;
    } else {
      keyword = post.title;
    }

    qualityScore = scoreContentV3(
      {
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        metaTitle: post.meta_title || post.title,
        metaDescription: post.meta_description || '',
        tags: post.tags || [],
        faqSchema: [],
      },
      keyword
    );

    if (qualityScore.overall < criteria.minQualityScore) {
      issues.push(`Quality score (${qualityScore.overall}) is below minimum (${criteria.minQualityScore})`);
    }
  }

  // 이미 발행된 경우
  if (post.status === 'published') {
    warnings.push('Post is already published');
  }

  return {
    isValid: issues.length === 0,
    canPublish: issues.length === 0 && post.status !== 'published',
    qualityScore,
    issues,
    warnings,
  };
}

/**
 * 필수 필드만 빠르게 검증
 */
export function validateRequiredFields(post: {
  title?: string;
  content?: string;
  meta_description?: string;
  excerpt?: string;
}): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!post.title?.trim()) missing.push('title');
  if (!post.content?.trim()) missing.push('content');
  if (!post.meta_description?.trim()) missing.push('meta_description');
  if (!post.excerpt?.trim()) missing.push('excerpt');

  return {
    valid: missing.length === 0,
    missing,
  };
}

// =====================================================
// AUTO PUBLISH FUNCTIONS
// =====================================================

/**
 * 단일 포스트 자동 발행
 */
export async function autoPublishPost(
  supabase: AnySupabaseClient,
  blogPostId: string,
  criteria: PublishingCriteria = DEFAULT_PUBLISHING_CRITERIA
): Promise<AutoPublishResult> {
  // 검증
  const validation = await validateForPublishing(supabase, blogPostId, criteria);

  if (!validation.canPublish) {
    return {
      success: false,
      blogPostId,
      previousStatus: 'unknown',
      newStatus: 'unknown',
      issues: validation.issues,
    };
  }

  // 현재 상태 조회
  const { data: post } = await supabase
    .from('blog_posts')
    .select('status')
    .eq('id', blogPostId)
    .single();

  const previousStatus = post?.status || 'draft';
  const publishedAt = new Date().toISOString();

  // 상태 업데이트
  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: publishedAt,
      updated_at: publishedAt,
    })
    .eq('id', blogPostId);

  if (error) {
    return {
      success: false,
      blogPostId,
      previousStatus,
      newStatus: previousStatus,
      issues: [`Failed to update status: ${error.message}`],
    };
  }

  return {
    success: true,
    blogPostId,
    previousStatus,
    newStatus: 'published',
    publishedAt,
  };
}

/**
 * 배치 자동 발행
 */
export async function autoPublishBatch(
  supabase: AnySupabaseClient,
  blogPostIds: string[],
  criteria: PublishingCriteria = DEFAULT_PUBLISHING_CRITERIA
): Promise<BatchPublishResult> {
  const result: BatchPublishResult = {
    total: blogPostIds.length,
    published: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const id of blogPostIds) {
    const publishResult = await autoPublishPost(supabase, id, criteria);
    result.results.push(publishResult);

    if (publishResult.success) {
      result.published++;
    } else if (publishResult.issues?.some(i => i.includes('already published'))) {
      result.skipped++;
    } else {
      result.failed++;
    }
  }

  return result;
}

/**
 * 발행 대기 중인 포스트 자동 발행 (조건 충족 시)
 */
export async function autoPublishPendingPosts(
  supabase: AnySupabaseClient,
  options: {
    criteria?: PublishingCriteria;
    limit?: number;
    dryRun?: boolean;
  } = {}
): Promise<BatchPublishResult> {
  const { criteria = DEFAULT_PUBLISHING_CRITERIA, limit = 50, dryRun = false } = options;

  // 발행 대기 중인 포스트 조회 (draft 또는 pending 상태)
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, content, meta_description, excerpt, cover_image_url, status')
    .in('status', ['draft', 'pending'])
    .limit(limit);

  if (!posts || posts.length === 0) {
    return {
      total: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      results: [],
    };
  }

  // 조건 충족 포스트 필터링
  const eligiblePostIds: string[] = [];

  for (const post of posts) {
    const validation = await validateForPublishing(supabase, post.id, criteria);
    if (validation.canPublish) {
      eligiblePostIds.push(post.id);
    }
  }

  if (dryRun) {
    return {
      total: posts.length,
      published: 0,
      skipped: posts.length - eligiblePostIds.length,
      failed: 0,
      results: eligiblePostIds.map(id => ({
        success: true,
        blogPostId: id,
        previousStatus: 'draft',
        newStatus: 'published (dry run)',
      })),
    };
  }

  return autoPublishBatch(supabase, eligiblePostIds, criteria);
}

// =====================================================
// SCHEDULED PUBLISHING
// =====================================================

export interface ScheduledPost {
  blogPostId: string;
  scheduledAt: string;
}

/**
 * 예약 발행 설정
 */
export async function schedulePublication(
  supabase: AnySupabaseClient,
  blogPostId: string,
  scheduledAt: Date
): Promise<{ success: boolean; error?: string }> {
  // 검증
  const validation = await validateForPublishing(supabase, blogPostId);

  if (!validation.isValid) {
    return {
      success: false,
      error: `Cannot schedule: ${validation.issues.join(', ')}`,
    };
  }

  // 상태 업데이트
  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', blogPostId);

  if (error) {
    return {
      success: false,
      error: `Failed to schedule: ${error.message}`,
    };
  }

  return { success: true };
}

/**
 * 예약된 포스트 발행 처리 (Cron Job용)
 */
export async function processScheduledPosts(
  supabase: AnySupabaseClient
): Promise<BatchPublishResult> {
  const now = new Date().toISOString();

  // 예약 시간이 지난 포스트 조회
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now);

  if (!posts || posts.length === 0) {
    return {
      total: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      results: [],
    };
  }

  const postIds = posts.map(p => p.id);
  return autoPublishBatch(supabase, postIds);
}

/**
 * 예약 발행 취소
 */
export async function cancelScheduledPublication(
  supabase: AnySupabaseClient,
  blogPostId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'draft',
      scheduled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blogPostId)
    .eq('status', 'scheduled');

  if (error) {
    return {
      success: false,
      error: `Failed to cancel: ${error.message}`,
    };
  }

  return { success: true };
}
