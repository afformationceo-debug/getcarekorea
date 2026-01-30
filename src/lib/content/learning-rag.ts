/**
 * Learning RAG System
 *
 * 고성과 콘텐츠 기반 학습 RAG 시스템
 * - 고성과 콘텐츠 자동 감지
 * - 패턴 추출 및 벡터화
 * - 생성 시 학습 데이터 참조
 */

import {
  generateEmbedding,
  upsertVector,
  queryVectors,
  VECTOR_NAMESPACES,
  type VectorNamespace,
} from '@/lib/upstash/vector';
import { getRedis } from '@/lib/upstash/redis';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface LearningData {
  id: string;
  source_type: 'high_performer' | 'user_feedback' | 'manual_edit';
  blog_post_id: string;
  keyword_id?: string;
  locale: Locale;
  category: string;
  performance_score: number;

  // 학습 데이터
  content_excerpt: string;
  title_pattern: string;
  writing_style_notes: string;
  seo_patterns: SEOPatterns;

  // 메타
  created_at: string;
  is_vectorized: boolean;
  vector_id?: string;
}

export interface SEOPatterns {
  title_structure: string;
  heading_patterns: string[];
  keyword_placement: string[];
  cta_style: string;
  content_length: number;
  faq_count: number;
  table_count: number;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  page_views: number;
  conversions: number;
}

export interface ContentAnalysis {
  titlePattern: string;
  writingStyle: string;
  seoPatterns: SEOPatterns;
  keyInsights: string[];
}

// =====================================================
// CONSTANTS
// =====================================================

// 새로운 네임스페이스 추가
export const LEARNING_NAMESPACE = 'llm-learning' as VectorNamespace;

const LEARNING_CACHE_KEY = 'learning:high_performers';
const LEARNING_CACHE_TTL = 3600; // 1 hour

// 성과 기준
const PERFORMANCE_THRESHOLDS = {
  high: {
    ctr: 0.05, // 5% CTR
    position: 10, // Top 10
    clicks: 100,
  },
  medium: {
    ctr: 0.02, // 2% CTR
    position: 30,
    clicks: 30,
  },
};

// =====================================================
// LEARNING DATA MANAGEMENT
// =====================================================

/**
 * 콘텐츠 성과 등급 결정
 */
export function determinePerformanceTier(
  metrics: PerformanceMetrics
): 'top' | 'mid' | 'low' {
  const { ctr, position, clicks } = metrics;

  if (
    ctr >= PERFORMANCE_THRESHOLDS.high.ctr &&
    position <= PERFORMANCE_THRESHOLDS.high.position &&
    clicks >= PERFORMANCE_THRESHOLDS.high.clicks
  ) {
    return 'top';
  }

  if (
    ctr >= PERFORMANCE_THRESHOLDS.medium.ctr ||
    position <= PERFORMANCE_THRESHOLDS.medium.position ||
    clicks >= PERFORMANCE_THRESHOLDS.medium.clicks
  ) {
    return 'mid';
  }

  return 'low';
}

/**
 * 콘텐츠 분석 및 패턴 추출
 */
export function analyzeContent(
  title: string,
  content: string,
  metadata: {
    locale: Locale;
    category: string;
    keyword: string;
  }
): ContentAnalysis {
  // 제목 패턴 분석
  const titlePattern = analyzeTitlePattern(title, metadata.keyword);

  // 작성 스타일 분석
  const writingStyle = analyzeWritingStyle(content, metadata.locale);

  // SEO 패턴 분석
  const seoPatterns = analyzeSEOPatterns(content, metadata.keyword);

  // 주요 인사이트 추출
  const keyInsights = extractKeyInsights(content);

  return {
    titlePattern,
    writingStyle,
    seoPatterns,
    keyInsights,
  };
}

/**
 * 제목 패턴 분석
 */
function analyzeTitlePattern(title: string, keyword: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  const patterns: string[] = [];

  // 키워드 위치 분석
  if (lowerTitle.startsWith(lowerKeyword.split(' ')[0])) {
    patterns.push('keyword-first');
  }

  // 연도 포함 여부
  if (/20\d{2}/.test(title)) {
    patterns.push('includes-year');
  }

  // 숫자 포함 여부
  if (/\d+/.test(title)) {
    patterns.push('includes-number');
  }

  // 가격 언급
  if (/\$|cost|price|가격|비용|費用|价格/i.test(title)) {
    patterns.push('price-focused');
  }

  // 가이드/완전 가이드
  if (/guide|complete|ultimate|가이드|완벽|指南/i.test(title)) {
    patterns.push('comprehensive-guide');
  }

  return patterns.join(', ') || 'standard';
}

/**
 * 작성 스타일 분석
 */
function analyzeWritingStyle(content: string, locale: Locale): string {
  const styles: string[] = [];

  // 문장 길이 분석
  const sentences = content.split(/[.!?。！？]/);
  const avgLength = sentences.reduce((acc, s) => acc + s.length, 0) / sentences.length;

  if (avgLength < 50) {
    styles.push('concise-sentences');
  } else if (avgLength > 100) {
    styles.push('detailed-sentences');
  }

  // 목록 사용
  if (/^\s*[-•*]\s/m.test(content) || /^\s*\d+\.\s/m.test(content)) {
    styles.push('uses-lists');
  }

  // 질문 형식 사용
  if (/\?\s*\n/.test(content)) {
    styles.push('uses-questions');
  }

  // 강조 사용
  if (/\*\*[^*]+\*\*/.test(content)) {
    styles.push('uses-bold-emphasis');
  }

  // 로케일별 특성
  if (locale === 'ja' && /です|ます/.test(content)) {
    styles.push('polite-form');
  }

  return styles.join(', ') || 'standard';
}

/**
 * SEO 패턴 분석
 */
function analyzeSEOPatterns(content: string, keyword: string): SEOPatterns {
  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // 헤딩 패턴
  const h2Matches = content.match(/^##\s+.+$/gm) || [];
  const h3Matches = content.match(/^###\s+.+$/gm) || [];
  const headingPatterns = h2Matches.slice(0, 5).map(h => h.replace(/^##\s+/, ''));

  // 키워드 배치
  const keywordPlacements: string[] = [];
  if (lowerContent.substring(0, 500).includes(lowerKeyword.split(' ')[0])) {
    keywordPlacements.push('intro');
  }
  if (h2Matches.some(h => h.toLowerCase().includes(lowerKeyword.split(' ')[0]))) {
    keywordPlacements.push('headings');
  }
  if (lowerContent.substring(-500).includes(lowerKeyword.split(' ')[0])) {
    keywordPlacements.push('conclusion');
  }

  // CTA 스타일
  let ctaStyle = 'standard';
  if (/whatsapp|line|wechat/i.test(content)) {
    ctaStyle = 'messenger-focused';
  }
  if (/free consultation|무료 상담|免費諮詢/i.test(content)) {
    ctaStyle = 'consultation-focused';
  }

  // 테이블 수
  const tableCount = (content.match(/\|.*\|.*\|/g) || []).length / 3; // 대략적 테이블 수

  // FAQ 수
  const faqCount = (content.match(/^###?\s*(?:Q:|FAQ|질문|問題)/gim) || []).length;

  return {
    title_structure: headingPatterns[0] || 'standard',
    heading_patterns: headingPatterns,
    keyword_placement: keywordPlacements,
    cta_style: ctaStyle,
    content_length: content.length,
    faq_count: faqCount,
    table_count: Math.floor(tableCount),
  };
}

/**
 * 주요 인사이트 추출
 */
function extractKeyInsights(content: string): string[] {
  const insights: string[] = [];

  // 중요 통계/숫자 추출
  const stats = content.match(/\d+%|\$[\d,]+|\d+\+?\s*(years?|patients?|clinics?)/gi);
  if (stats) {
    insights.push(...stats.slice(0, 3));
  }

  // 핵심 문구 추출
  const keyPhrases = [
    /world.*(class|leading|renowned)/i,
    /top.*(rated|ranked)/i,
    /board.certified/i,
    /JCI.*(accredited|certified)/i,
  ];

  for (const pattern of keyPhrases) {
    if (pattern.test(content)) {
      insights.push(pattern.source);
    }
  }

  return insights.slice(0, 5);
}

// =====================================================
// VECTOR OPERATIONS FOR LEARNING
// =====================================================

/**
 * 학습 데이터 벡터화 및 저장
 */
export async function indexLearningData(data: LearningData): Promise<string> {
  const textForEmbedding = [
    `Title Pattern: ${data.title_pattern}`,
    `Writing Style: ${data.writing_style_notes}`,
    `Category: ${data.category}`,
    `Locale: ${data.locale}`,
    `Performance Score: ${data.performance_score}`,
    `Content Excerpt: ${data.content_excerpt}`,
    `SEO Patterns: ${JSON.stringify(data.seo_patterns)}`,
  ].join(' | ');

  const vectorId = `learning:${data.id}:${data.locale}`;

  await upsertVector({
    namespace: LEARNING_NAMESPACE,
    id: vectorId,
    text: textForEmbedding,
    metadata: {
      id: data.id,
      type: 'learning-data',
      locale: data.locale,
      category: data.category,
      source_type: data.source_type,
      performance_score: data.performance_score,
      blog_post_id: data.blog_post_id,
    },
  });

  return vectorId;
}

/**
 * 관련 학습 데이터 검색
 */
export async function queryLearningData(
  keyword: string,
  options: {
    locale?: Locale;
    category?: string;
    minPerformanceScore?: number;
    topK?: number;
  } = {}
): Promise<LearningData[]> {
  const { locale, category, topK = 5 } = options;

  // 필터 구성
  const filterParts: string[] = ["type = 'learning-data'"];
  if (locale) filterParts.push(`locale = '${locale}'`);
  if (category) filterParts.push(`category = '${category}'`);

  const filter = filterParts.join(' AND ');

  const results = await queryVectors({
    namespace: LEARNING_NAMESPACE,
    query: keyword,
    topK,
    filter,
    includeMetadata: true,
  });

  // 결과 변환
  return results.map(r => ({
    id: r.metadata?.id as string,
    source_type: r.metadata?.source_type as 'high_performer' | 'user_feedback' | 'manual_edit',
    blog_post_id: r.metadata?.blog_post_id as string,
    locale: r.metadata?.locale as Locale,
    category: r.metadata?.category as string,
    performance_score: r.metadata?.performance_score as number,
    content_excerpt: r.metadata?.text as string || '',
    title_pattern: '',
    writing_style_notes: '',
    seo_patterns: {} as SEOPatterns,
    created_at: '',
    is_vectorized: true,
    vector_id: r.id,
  }));
}

// =====================================================
// ENHANCED RAG CONTEXT
// =====================================================

/**
 * 학습 데이터를 포함한 향상된 RAG 컨텍스트 생성
 */
export async function buildEnhancedRAGContext(
  keyword: string,
  locale: Locale,
  category: string
): Promise<{
  learningContext: string;
  patterns: string[];
  recommendations: string[];
}> {
  // 관련 학습 데이터 검색
  const learningData = await queryLearningData(keyword, {
    locale,
    category,
    topK: 3,
  });

  if (learningData.length === 0) {
    return {
      learningContext: '',
      patterns: [],
      recommendations: [],
    };
  }

  // 학습 컨텍스트 포맷팅
  const learningContext = formatLearningContext(learningData);

  // 패턴 추출
  const patterns = extractCommonPatterns(learningData);

  // 권장 사항 생성
  const recommendations = generateRecommendations(learningData, locale);

  return {
    learningContext,
    patterns,
    recommendations,
  };
}

/**
 * 학습 컨텍스트 포맷팅 (XML 구조화 - Long Context Optimized)
 */
function formatLearningContext(data: LearningData[]): string {
  if (data.length === 0) return '';

  const sections = data.map((d, i) => `
<high_performer index="${i + 1}">
  <performance_score>${d.performance_score}</performance_score>
  <category>${d.category}</category>
  <locale>${d.locale}</locale>
  <source_type>${d.source_type}</source_type>
  <content_excerpt>
${d.content_excerpt.substring(0, 500)}...
  </content_excerpt>
  <title_pattern>${d.title_pattern || 'standard'}</title_pattern>
  <writing_style>${d.writing_style_notes || 'standard'}</writing_style>
</high_performer>`);

  return `
<learning_data>
  <description>High-performing content patterns to study and adapt</description>
  <instruction>Cite specific elements from these examples that you will incorporate into your content</instruction>
  ${sections.join('\n  ')}
</learning_data>
`.trim();
}

/**
 * 공통 패턴 추출
 */
function extractCommonPatterns(data: LearningData[]): string[] {
  const patterns: string[] = [];

  // 제목 패턴 분석
  const titlePatterns = data.map(d => d.title_pattern).filter(Boolean);
  if (titlePatterns.length > 0) {
    patterns.push(`Title Pattern: ${[...new Set(titlePatterns)].join(', ')}`);
  }

  // 작성 스타일 분석
  const styles = data.map(d => d.writing_style_notes).filter(Boolean);
  if (styles.length > 0) {
    patterns.push(`Writing Style: ${[...new Set(styles)].join(', ')}`);
  }

  return patterns;
}

/**
 * 권장 사항 생성
 */
function generateRecommendations(data: LearningData[], locale: Locale): string[] {
  const recommendations: string[] = [];

  // 평균 콘텐츠 길이
  const avgLength = data.reduce((acc, d) => acc + (d.seo_patterns?.content_length || 0), 0) / data.length;
  if (avgLength > 0) {
    recommendations.push(`Target content length: ~${Math.round(avgLength)} characters`);
  }

  // FAQ 수
  const avgFAQ = data.reduce((acc, d) => acc + (d.seo_patterns?.faq_count || 0), 0) / data.length;
  if (avgFAQ > 0) {
    recommendations.push(`Include ${Math.round(avgFAQ)} FAQ items`);
  }

  // 로케일별 권장 사항
  switch (locale) {
    case 'ja':
      recommendations.push('Use 敬語 (polite form) throughout');
      break;
    case 'zh-TW':
      recommendations.push('Emphasize safety and reputation signals');
      break;
    case 'zh-CN':
      recommendations.push('Highlight value-for-money comparisons');
      break;
    case 'th':
      recommendations.push('Reference K-beauty and Korean drama trends');
      break;
    case 'ru':
      recommendations.push('Provide detailed technical explanations');
      break;
  }

  return recommendations;
}

// =====================================================
// CACHE MANAGEMENT
// =====================================================

/**
 * 고성과 콘텐츠 캐시 업데이트
 */
export async function updateHighPerformerCache(
  postIds: string[]
): Promise<void> {
  const redis = getRedis();
  await redis.set(LEARNING_CACHE_KEY, JSON.stringify(postIds), {
    ex: LEARNING_CACHE_TTL,
  });
}

/**
 * 캐시된 고성과 콘텐츠 ID 가져오기
 */
export async function getCachedHighPerformers(): Promise<string[]> {
  const redis = getRedis();
  const cached = await redis.get(LEARNING_CACHE_KEY);

  if (cached) {
    return JSON.parse(cached as string);
  }

  return [];
}
