/**
 * LLM Learning Pipeline
 *
 * 콘텐츠 성과 기반 자가 학습 파이프라인
 * - 고성과 콘텐츠 자동 감지
 * - 패턴 추출 및 분석
 * - 학습 데이터 DB 저장
 * - Upstash Vector 인덱싱
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  analyzeContent,
  indexLearningData,
  determinePerformanceTier,
  type LearningData,
  type PerformanceMetrics,
  type ContentAnalysis,
} from './learning-rag';
import { getRedis } from '@/lib/upstash/redis';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface BlogPostWithPerformance {
  id: string;
  slug: string;
  title: string;
  content: string;
  locale: Locale;
  category: string;
  keyword_id?: string;
  keyword?: string;
  created_at: string;

  // 성과 메트릭스
  performance?: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    page_views: number;
    conversions: number;
  };
}

export interface LearningPipelineResult {
  processed: number;
  newHighPerformers: number;
  indexed: number;
  errors: string[];
}

export interface ManualFeedback {
  blog_post_id: string;
  feedback_type: 'positive' | 'negative' | 'edit';
  original_content?: string;
  edited_content?: string;
  notes?: string;
  admin_id: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const LEARNING_KEYS = {
  lastRun: 'learning:pipeline:last_run',
  processedPosts: 'learning:processed_posts',
  highPerformers: 'learning:high_performers',
} as const;

// 고성과 콘텐츠 기준
const HIGH_PERFORMER_CRITERIA = {
  minCTR: 0.03,       // 3% CTR
  minClicks: 50,      // 최소 50 클릭
  maxPosition: 20,    // 상위 20위 이내
  minImpressions: 500, // 최소 500 노출
};

// =====================================================
// HIGH PERFORMER DETECTION
// =====================================================

/**
 * 고성과 콘텐츠 감지
 */
export async function detectHighPerformers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  options: {
    minDaysOld?: number;
    limit?: number;
  } = {}
): Promise<BlogPostWithPerformance[]> {
  const { minDaysOld = 7, limit = 100 } = options;

  // 최소 기간이 지난 게시물 조회
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - minDaysOld);

  // 블로그 포스트와 성과 데이터 조인 조회
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      slug,
      title_en,
      content_en,
      category,
      created_at,
      content_keywords (
        id,
        keyword
      ),
      content_performance (
        gsc_impressions,
        gsc_clicks,
        gsc_ctr,
        gsc_position,
        page_views,
        inquiry_conversions,
        chat_conversions
      )
    `)
    .eq('status', 'published')
    .lt('created_at', minDate.toISOString())
    .limit(limit);

  if (error) {
    console.error('Error fetching posts for high performer detection:', error);
    return [];
  }

  // 고성과 콘텐츠 필터링
  const highPerformers: BlogPostWithPerformance[] = [];

  for (const post of posts || []) {
    const perf = post.content_performance?.[0];
    if (!perf) continue;

    const metrics: PerformanceMetrics = {
      impressions: perf.gsc_impressions || 0,
      clicks: perf.gsc_clicks || 0,
      ctr: perf.gsc_ctr || 0,
      position: perf.gsc_position || 100,
      page_views: perf.page_views || 0,
      conversions: (perf.inquiry_conversions || 0) + (perf.chat_conversions || 0),
    };

    // 고성과 기준 충족 여부 확인
    if (isHighPerformer(metrics)) {
      highPerformers.push({
        id: post.id,
        slug: post.slug,
        title: post.title_en || '',
        content: post.content_en || '',
        locale: 'en' as Locale, // TODO: 다른 로케일 지원
        category: post.category || 'general',
        keyword_id: post.content_keywords?.[0]?.id,
        keyword: post.content_keywords?.[0]?.keyword,
        created_at: post.created_at,
        performance: metrics,
      });
    }
  }

  return highPerformers;
}

/**
 * 고성과 기준 충족 여부 확인
 */
function isHighPerformer(metrics: PerformanceMetrics): boolean {
  return (
    metrics.ctr >= HIGH_PERFORMER_CRITERIA.minCTR &&
    metrics.clicks >= HIGH_PERFORMER_CRITERIA.minClicks &&
    metrics.position <= HIGH_PERFORMER_CRITERIA.maxPosition &&
    metrics.impressions >= HIGH_PERFORMER_CRITERIA.minImpressions
  );
}

// =====================================================
// LEARNING PIPELINE
// =====================================================

/**
 * 학습 파이프라인 실행
 */
export async function runLearningPipeline(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>
): Promise<LearningPipelineResult> {
  const result: LearningPipelineResult = {
    processed: 0,
    newHighPerformers: 0,
    indexed: 0,
    errors: [],
  };

  const redis = getRedis();

  try {
    // 1. 고성과 콘텐츠 감지
    const highPerformers = await detectHighPerformers(supabase);
    result.processed = highPerformers.length;

    // 2. 이미 처리된 포스트 ID 가져오기
    const processedIds = await redis.smembers(LEARNING_KEYS.processedPosts);
    const processedSet = new Set(processedIds);

    // 3. 새로운 고성과 콘텐츠 처리
    for (const post of highPerformers) {
      if (processedSet.has(post.id)) {
        continue; // 이미 처리됨
      }

      try {
        // 콘텐츠 분석
        const analysis = analyzeContent(post.title, post.content, {
          locale: post.locale,
          category: post.category,
          keyword: post.keyword || '',
        });

        // 학습 데이터 생성
        const learningData = await createLearningDataFromPost(
          supabase,
          post,
          analysis
        );

        // 벡터 인덱싱
        const vectorId = await indexLearningData(learningData);

        // DB에 학습 데이터 저장
        await saveLearningDataToDB(supabase, {
          ...learningData,
          is_vectorized: true,
          vector_id: vectorId,
        });

        // 처리 완료 표시
        await redis.sadd(LEARNING_KEYS.processedPosts, post.id);
        await redis.sadd(LEARNING_KEYS.highPerformers, post.id);

        result.newHighPerformers++;
        result.indexed++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Post ${post.id}: ${errorMsg}`);
      }
    }

    // 4. 마지막 실행 시간 기록
    await redis.set(LEARNING_KEYS.lastRun, new Date().toISOString());

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Pipeline error: ${errorMsg}`);
  }

  return result;
}

/**
 * 포스트에서 학습 데이터 생성
 */
async function createLearningDataFromPost(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  post: BlogPostWithPerformance,
  analysis: ContentAnalysis
): Promise<LearningData> {
  const performanceScore = calculatePerformanceScore(post.performance!);

  return {
    id: `learn_${post.id}_${Date.now()}`,
    source_type: 'high_performer',
    blog_post_id: post.id,
    keyword_id: post.keyword_id,
    locale: post.locale,
    category: post.category,
    performance_score: performanceScore,
    content_excerpt: extractExcerpt(post.content),
    title_pattern: analysis.titlePattern,
    writing_style_notes: analysis.writingStyle,
    seo_patterns: analysis.seoPatterns,
    created_at: new Date().toISOString(),
    is_vectorized: false,
  };
}

/**
 * 성과 점수 계산 (0-100)
 */
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  // 가중치 기반 점수 계산
  const ctrScore = Math.min(metrics.ctr * 1000, 30); // max 30점
  const clickScore = Math.min(metrics.clicks / 10, 25); // max 25점
  const positionScore = Math.max(0, 25 - metrics.position); // max 25점 (1위 = 25점)
  const conversionScore = Math.min(metrics.conversions * 5, 20); // max 20점

  return Math.round(ctrScore + clickScore + positionScore + conversionScore);
}

/**
 * 콘텐츠 발췌 추출
 */
function extractExcerpt(content: string, maxLength: number = 1000): string {
  // Markdown 헤딩 제거
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // 문장 단위로 자르기
  const sentences = cleanContent.substring(0, maxLength + 200).split(/[.!?。！？]/);
  let excerpt = '';

  for (const sentence of sentences) {
    if ((excerpt + sentence).length > maxLength) break;
    excerpt += sentence + '.';
  }

  return excerpt.trim() || cleanContent.substring(0, maxLength);
}

/**
 * 학습 데이터 DB 저장
 */
async function saveLearningDataToDB(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  data: LearningData
): Promise<void> {
  const { error } = await supabase.from('llm_learning_data').insert({
    id: data.id,
    source_type: data.source_type,
    blog_post_id: data.blog_post_id,
    keyword_id: data.keyword_id,
    content_excerpt: data.content_excerpt,
    writing_style_notes: data.writing_style_notes,
    seo_patterns: data.seo_patterns,
    locale: data.locale,
    category: data.category,
    performance_score: data.performance_score,
    is_vectorized: data.is_vectorized,
    vector_id: data.vector_id,
    created_at: data.created_at,
  });

  if (error) {
    throw new Error(`Failed to save learning data: ${error.message}`);
  }
}

// =====================================================
// MANUAL FEEDBACK PROCESSING
// =====================================================

/**
 * 관리자 수동 피드백 처리
 */
export async function processManualFeedback(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  feedback: ManualFeedback
): Promise<{ success: boolean; learningDataId?: string; error?: string }> {
  try {
    // 블로그 포스트 조회
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title_en, content_en, category')
      .eq('id', feedback.blog_post_id)
      .single();

    if (postError || !post) {
      return { success: false, error: 'Blog post not found' };
    }

    // 피드백 유형에 따른 처리
    let learningData: LearningData;

    if (feedback.feedback_type === 'edit' && feedback.edited_content) {
      // 수정된 콘텐츠에서 학습
      const analysis = analyzeContent(
        post.title_en || '',
        feedback.edited_content,
        {
          locale: 'en' as Locale,
          category: post.category || 'general',
          keyword: '',
        }
      );

      learningData = {
        id: `learn_edit_${post.id}_${Date.now()}`,
        source_type: 'manual_edit',
        blog_post_id: post.id,
        locale: 'en' as Locale,
        category: post.category || 'general',
        performance_score: 80, // 수동 수정은 기본 높은 점수
        content_excerpt: extractExcerpt(feedback.edited_content),
        title_pattern: analysis.titlePattern,
        writing_style_notes: analysis.writingStyle + (feedback.notes ? ` | Admin notes: ${feedback.notes}` : ''),
        seo_patterns: analysis.seoPatterns,
        created_at: new Date().toISOString(),
        is_vectorized: false,
      };
    } else if (feedback.feedback_type === 'positive') {
      // 긍정적 피드백 - 기존 콘텐츠 학습
      const analysis = analyzeContent(
        post.title_en || '',
        post.content_en || '',
        {
          locale: 'en' as Locale,
          category: post.category || 'general',
          keyword: '',
        }
      );

      learningData = {
        id: `learn_feedback_${post.id}_${Date.now()}`,
        source_type: 'user_feedback',
        blog_post_id: post.id,
        locale: 'en' as Locale,
        category: post.category || 'general',
        performance_score: 75,
        content_excerpt: extractExcerpt(post.content_en || ''),
        title_pattern: analysis.titlePattern,
        writing_style_notes: analysis.writingStyle + ' | Positive admin feedback',
        seo_patterns: analysis.seoPatterns,
        created_at: new Date().toISOString(),
        is_vectorized: false,
      };
    } else {
      // 부정적 피드백은 학습 데이터로 저장하지 않음
      return { success: true };
    }

    // 벡터 인덱싱
    const vectorId = await indexLearningData(learningData);

    // DB 저장
    await saveLearningDataToDB(supabase, {
      ...learningData,
      is_vectorized: true,
      vector_id: vectorId,
    });

    return { success: true, learningDataId: learningData.id };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

// =====================================================
// PIPELINE STATUS
// =====================================================

/**
 * 학습 파이프라인 상태 조회
 */
export async function getLearningPipelineStatus(): Promise<{
  lastRun: string | null;
  totalProcessed: number;
  totalHighPerformers: number;
}> {
  const redis = getRedis();

  const [lastRun, processedCount, highPerformerCount] = await Promise.all([
    redis.get(LEARNING_KEYS.lastRun),
    redis.scard(LEARNING_KEYS.processedPosts),
    redis.scard(LEARNING_KEYS.highPerformers),
  ]);

  return {
    lastRun: lastRun as string | null,
    totalProcessed: processedCount || 0,
    totalHighPerformers: highPerformerCount || 0,
  };
}
