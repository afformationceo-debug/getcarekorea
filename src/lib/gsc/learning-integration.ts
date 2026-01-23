/**
 * GSC Learning Integration
 *
 * GSC 성과 데이터와 학습 파이프라인 연동
 * - 고성과 콘텐츠 자동 감지 후 학습
 * - 성과 등급 변동 시 알림
 * - 학습 데이터 품질 관리
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { isHighPerformer, classifyPerformanceTier, PerformanceTier } from './client';
import { indexLearningData, LearningData } from '@/lib/content/learning-rag';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

// =====================================================
// TYPES
// =====================================================

export interface HighPerformerAnalysis {
  blogPostId: string;
  title: string;
  slug: string;
  locale: string;
  category: string;
  currentTier: PerformanceTier;
  previousTier?: PerformanceTier;
  tierChanged: boolean;
  metrics: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  performanceScore: number;
}

export interface LearningIntegrationResult {
  analyzed: number;
  newHighPerformers: number;
  tierChanges: number;
  learned: number;
  errors: string[];
}

// =====================================================
// HIGH PERFORMER ANALYSIS
// =====================================================

/**
 * 고성과 콘텐츠 분석 및 학습 데이터 생성
 */
export async function analyzeAndLearnFromHighPerformers(
  supabase: AnySupabaseClient
): Promise<LearningIntegrationResult> {
  const result: LearningIntegrationResult = {
    analyzed: 0,
    newHighPerformers: 0,
    tierChanges: 0,
    learned: 0,
    errors: [],
  };

  try {
    // 최근 고성과 콘텐츠 조회
    const { data: highPerformers, error } = await supabase
      .from('content_performance')
      .select(`
        *,
        blog_posts(id, title, slug, locale, category, content, excerpt)
      `)
      .eq('is_high_performer', true)
      .order('gsc_clicks', { ascending: false })
      .limit(50);

    if (error || !highPerformers) {
      result.errors.push('Failed to fetch high performers');
      return result;
    }

    result.analyzed = highPerformers.length;

    for (const performer of highPerformers) {
      const post = performer.blog_posts;
      if (!post) continue;

      // 이미 학습된 콘텐츠인지 확인
      const { data: existingLearning } = await supabase
        .from('llm_learning_data')
        .select('id')
        .eq('blog_post_id', post.id)
        .eq('source_type', 'high_performer')
        .single();

      if (existingLearning) {
        // 이미 학습됨 - 스킵
        continue;
      }

      result.newHighPerformers++;

      // 성과 점수 계산
      const performanceScore = calculatePerformanceScore({
        ctr: performer.gsc_ctr,
        clicks: performer.gsc_clicks,
        position: performer.gsc_position,
        impressions: performer.gsc_impressions,
      });

      // 콘텐츠 분석
      const contentAnalysis = analyzeHighPerformerContent(post.content || '', post.title);

      // 학습 데이터 생성
      const learningData: LearningData = {
        id: `hp_${post.id}_${Date.now()}`,
        source_type: 'high_performer',
        blog_post_id: post.id,
        locale: post.locale,
        category: post.category || 'general',
        content_excerpt: post.excerpt || post.content?.substring(0, 500) || '',
        title_pattern: contentAnalysis.seoPatterns.titlePattern,
        writing_style_notes: contentAnalysis.styleNotes,
        seo_patterns: {
          title_structure: contentAnalysis.seoPatterns.titlePattern,
          heading_patterns: contentAnalysis.seoPatterns.headingStructure,
          keyword_placement: [],
          cta_style: 'standard',
          content_length: post.content?.length || 0,
          faq_count: contentAnalysis.seoPatterns.hasFAQ ? 1 : 0,
          table_count: contentAnalysis.seoPatterns.hasComparisonTable ? 1 : 0,
        },
        performance_score: performanceScore,
        created_at: new Date().toISOString(),
        is_vectorized: false,
      };

      try {
        // Upstash Vector에 인덱싱
        await indexLearningData(learningData);

        // DB에 저장
        await supabase.from('llm_learning_data').insert({
          id: learningData.id,
          source_type: learningData.source_type,
          blog_post_id: learningData.blog_post_id,
          locale: learningData.locale,
          category: learningData.category,
          content_excerpt: learningData.content_excerpt,
          writing_style_notes: learningData.writing_style_notes,
          seo_patterns: learningData.seo_patterns,
          performance_score: learningData.performance_score,
          is_vectorized: true,
          vector_id: learningData.id,
          created_at: new Date().toISOString(),
        });

        result.learned++;
      } catch (learnError) {
        result.errors.push(`Failed to learn from ${post.id}: ${learnError}`);
      }
    }
  } catch (error) {
    result.errors.push(`Analysis error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return result;
}

/**
 * 성과 등급 변동 감지
 */
export async function detectTierChanges(
  supabase: AnySupabaseClient
): Promise<HighPerformerAnalysis[]> {
  const tierChanges: HighPerformerAnalysis[] = [];

  try {
    // 최근 2개 기간의 성과 데이터 비교
    const { data: recentPerformance } = await supabase
      .from('content_performance')
      .select(`
        *,
        blog_posts(id, title, slug, locale, category)
      `)
      .order('date_range_end', { ascending: false });

    if (!recentPerformance || recentPerformance.length === 0) {
      return [];
    }

    // 포스트별로 그룹화
    const postPerformances = new Map<string, typeof recentPerformance>();

    for (const record of recentPerformance) {
      const postId = record.blog_post_id;
      if (!postPerformances.has(postId)) {
        postPerformances.set(postId, []);
      }
      postPerformances.get(postId)!.push(record);
    }

    // 등급 변동 확인
    for (const [_postId, performances] of postPerformances) {
      if (performances.length < 2) continue;

      const [latest, previous] = performances;
      const post = latest.blog_posts;

      if (!post) continue;

      const currentTier = classifyPerformanceTier(latest.gsc_ctr, latest.gsc_position);
      const previousTier = classifyPerformanceTier(previous.gsc_ctr, previous.gsc_position);

      if (currentTier !== previousTier) {
        tierChanges.push({
          blogPostId: post.id,
          title: post.title,
          slug: post.slug,
          locale: post.locale,
          category: post.category || 'general',
          currentTier,
          previousTier,
          tierChanged: true,
          metrics: {
            clicks: latest.gsc_clicks,
            impressions: latest.gsc_impressions,
            ctr: latest.gsc_ctr,
            position: latest.gsc_position,
          },
          performanceScore: calculatePerformanceScore({
            ctr: latest.gsc_ctr,
            clicks: latest.gsc_clicks,
            position: latest.gsc_position,
            impressions: latest.gsc_impressions,
          }),
        });
      }
    }
  } catch (error) {
    console.error('Tier change detection error:', error);
  }

  return tierChanges;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * 성과 점수 계산 (0-100)
 */
function calculatePerformanceScore(metrics: {
  ctr: number;
  clicks: number;
  position: number;
  impressions: number;
}): number {
  const ctrScore = Math.min(metrics.ctr * 1000, 30); // max 30점
  const clickScore = Math.min(metrics.clicks / 10, 25); // max 25점
  const positionScore = Math.max(0, 25 - metrics.position); // max 25점
  const impressionScore = Math.min(metrics.impressions / 500, 20); // max 20점

  return Math.round(ctrScore + clickScore + positionScore + impressionScore);
}

/**
 * 고성과 콘텐츠 분석
 */
function analyzeHighPerformerContent(content: string, title: string): {
  styleNotes: string;
  seoPatterns: {
    titlePattern: string;
    headingStructure: string[];
    hasComparisonTable: boolean;
    hasFAQ: boolean;
    hasNumberedList: boolean;
    hasStatistics: boolean;
    avgParagraphLength: number;
  };
} {
  const styleNotes: string[] = [];
  const headings = content.match(/^##\s.+$/gm) || [];

  // 제목 패턴 분석
  let titlePattern = 'informational';
  if (/cost|price|how much/i.test(title)) titlePattern = 'pricing';
  else if (/vs|compare|difference/i.test(title)) titlePattern = 'comparison';
  else if (/how to|guide|step/i.test(title)) titlePattern = 'procedural';
  else if (/best|top|review/i.test(title)) titlePattern = 'listicle';

  // 스타일 노트 생성
  if (headings.length >= 5) {
    styleNotes.push('Uses comprehensive heading structure');
  }
  if (/\$[\d,]+-\$[\d,]+/i.test(content)) {
    styleNotes.push('Includes price ranges');
  }
  if (/\d+%/.test(content)) {
    styleNotes.push('Uses statistical data');
  }
  if (/GetCareKorea|our team|we help/i.test(content)) {
    styleNotes.push('Strong platform voice');
  }

  // 단락 길이 분석
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
  const avgParagraphLength = paragraphs.length > 0
    ? paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length
    : 0;

  return {
    styleNotes: styleNotes.join('. '),
    seoPatterns: {
      titlePattern,
      headingStructure: headings.map(h => h.replace(/^##\s/, '')),
      hasComparisonTable: /\|.*\|.*\|/m.test(content),
      hasFAQ: /#{1,3}\s*(FAQ|Frequently Asked|자주 묻는)/i.test(content),
      hasNumberedList: /^\d+\.\s/m.test(content),
      hasStatistics: /\d+%|\d+,\d+/.test(content),
      avgParagraphLength: Math.round(avgParagraphLength),
    },
  };
}

// Default export - functions are exported inline
