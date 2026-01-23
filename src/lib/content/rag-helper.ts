/**
 * RAG Helper - Enhanced Context Building
 *
 * Unified RAG context builder that combines:
 * 1. Google SEO Guide
 * 2. High-performing content
 * 3. User feedback
 * 4. Category best practices
 */

import { Index } from '@upstash/vector';
import OpenAI from 'openai';

// =====================================================
// TYPES
// =====================================================

export interface RAGContext {
  seo_guidelines: SEOGuideline[];
  similar_content: SimilarContent[];
  user_feedback: UserFeedback[];
  best_practices: string[];
  total_sources: number;
}

export interface SEOGuideline {
  text: string;
  section: string;
  priority: number;
  type: 'guideline' | 'example' | 'checklist' | 'definition';
  relevance_score: number;
}

export interface SimilarContent {
  title: string;
  excerpt: string;
  performance_score: number;
  writing_style: string;
  seo_patterns: Record<string, any>;
  relevance_score: number;
}

export interface UserFeedback {
  feedback_text: string;
  feedback_type: 'positive' | 'negative' | 'edit';
  keyword: string;
  relevance_score: number;
}

export interface RAGOptions {
  keyword: string;
  category?: string;
  locale?: string;
  include_seo_guide?: boolean;
  include_similar_content?: boolean;
  include_feedback?: boolean;
  max_results_per_source?: number;
}

// =====================================================
// INITIALIZATION
// =====================================================

// Lazy initialization to prevent build-time errors when env vars are missing
let _openai: OpenAI | null = null;
let _vectorIndex: Index | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

function getVectorIndex(): Index {
  if (!_vectorIndex) {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Upstash Vector credentials are not configured (UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN)');
    }
    _vectorIndex = new Index({ url, token });
  }
  return _vectorIndex;
}

// =====================================================
// MAIN FUNCTION
// =====================================================

/**
 * Build comprehensive RAG context for content generation
 */
export async function buildEnhancedRAGContext(
  options: RAGOptions
): Promise<RAGContext> {
  const {
    keyword,
    category,
    locale = 'ko',
    include_seo_guide = true,
    include_similar_content = true,
    include_feedback = true,
    max_results_per_source = 5,
  } = options;

  // Create query embedding
  const queryEmbedding = await createEmbedding(keyword);

  // Parallel queries to different sources
  const [seoGuidelines, similarContent, userFeedback] = await Promise.all([
    include_seo_guide
      ? querySEOGuide(queryEmbedding, max_results_per_source)
      : Promise.resolve([]),
    include_similar_content
      ? querySimilarContent(queryEmbedding, keyword, category, locale, max_results_per_source)
      : Promise.resolve([]),
    include_feedback
      ? queryUserFeedback(queryEmbedding, keyword, locale, max_results_per_source)
      : Promise.resolve([]),
  ]);

  // Generate best practices based on category
  const best_practices = generateBestPractices(category || 'general', locale);

  return {
    seo_guidelines: seoGuidelines,
    similar_content: similarContent,
    user_feedback: userFeedback,
    best_practices,
    total_sources:
      seoGuidelines.length +
      similarContent.length +
      userFeedback.length +
      best_practices.length,
  };
}

// =====================================================
// QUERY FUNCTIONS
// =====================================================

/**
 * Query SEO guidelines from indexed Google SEO guide
 */
async function querySEOGuide(
  embedding: number[],
  topK: number
): Promise<SEOGuideline[]> {
  try {
    const results = await getVectorIndex().query({
      vector: embedding,
      topK,
      filter: 'source = "google-seo-guide"',
      includeMetadata: true,
    });

    return results.map((result) => ({
      text: (result.metadata?.text as string) || '',
      section: (result.metadata?.section as string) || '',
      priority: (result.metadata?.priority as number) || 5,
      type: (result.metadata?.type as any) || 'guideline',
      relevance_score: result.score || 0,
    }));
  } catch (error) {
    console.error('Error querying SEO guide:', error);
    return [];
  }
}

/**
 * Query similar high-performing content
 */
async function querySimilarContent(
  embedding: number[],
  keyword: string,
  category: string | undefined,
  locale: string,
  topK: number
): Promise<SimilarContent[]> {
  try {
    let filter = 'source = "high-performing-content"';
    if (category) {
      filter += ` AND category = "${category}"`;
    }
    if (locale) {
      filter += ` AND locale = "${locale}"`;
    }

    const results = await getVectorIndex().query({
      vector: embedding,
      topK,
      filter,
      includeMetadata: true,
    });

    return results.map((result) => ({
      title: (result.metadata?.title as string) || '',
      excerpt: (result.metadata?.excerpt as string) || '',
      performance_score: (result.metadata?.performance_score as number) || 0,
      writing_style: (result.metadata?.writing_style as string) || '',
      seo_patterns: (result.metadata?.seo_patterns as Record<string, any>) || {},
      relevance_score: result.score || 0,
    }));
  } catch (error) {
    console.error('Error querying similar content:', error);
    return [];
  }
}

/**
 * Query user feedback
 */
async function queryUserFeedback(
  embedding: number[],
  keyword: string,
  locale: string,
  topK: number
): Promise<UserFeedback[]> {
  try {
    const filter = `source = "user-feedback" AND locale = "${locale}"`;

    const results = await getVectorIndex().query({
      vector: embedding,
      topK,
      filter,
      includeMetadata: true,
    });

    return results.map((result) => ({
      feedback_text: (result.metadata?.feedback_text as string) || '',
      feedback_type: (result.metadata?.feedback_type as any) || 'positive',
      keyword: (result.metadata?.keyword as string) || keyword,
      relevance_score: result.score || 0,
    }));
  } catch (error) {
    console.error('Error querying user feedback:', error);
    return [];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create embedding using OpenAI
 */
async function createEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate category-specific best practices
 */
function generateBestPractices(category: string, locale: string): string[] {
  const practices: Record<string, Record<string, string[]>> = {
    'plastic-surgery': {
      ko: [
        '수술 전후 사진을 포함하되, 의료법 준수',
        '회복 기간과 과정을 상세히 설명',
        '의료진 경력과 자격증 강조',
        '안전성과 부작용에 대한 투명한 정보 제공',
        '실제 환자 후기 포함 (검증된 경우에만)',
      ],
      en: [
        'Include before/after photos (if legally compliant)',
        'Explain recovery period and process in detail',
        'Emphasize surgeon credentials and experience',
        'Provide transparent info about safety and side effects',
        'Include real patient reviews (verified only)',
      ],
    },
    'dermatology': {
      ko: [
        '피부 타입별 맞춤 정보 제공',
        '계절별 피부 관리 팁 포함',
        '제품 성분 설명 추가',
        '시술 후 관리 방법 상세 기술',
        '가격 투명성 확보',
      ],
      en: [
        'Provide info tailored to different skin types',
        'Include seasonal skincare tips',
        'Explain product ingredients',
        'Detail post-treatment care methods',
        'Ensure price transparency',
      ],
    },
    general: {
      ko: [
        '정확하고 최신 의료 정보 제공',
        'E-E-A-T 원칙 준수 (경험, 전문성, 권위성, 신뢰성)',
        'YMYL 콘텐츠로서 높은 품질 기준 유지',
        '면책조항 및 의료 상담 권장사항 포함',
        '다국어 지원 및 문화적 감수성 고려',
      ],
      en: [
        'Provide accurate and up-to-date medical information',
        'Follow E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness)',
        'Maintain high quality standards as YMYL content',
        'Include disclaimers and medical consultation recommendations',
        'Consider multilingual support and cultural sensitivity',
      ],
    },
  };

  const categoryPractices = practices[category] || practices['general'];
  const localePractices = categoryPractices[locale] || categoryPractices['en'];

  return localePractices;
}

// =====================================================
// FORMAT FOR PROMPT
// =====================================================

/**
 * Format RAG context into prompt-friendly text
 */
export function formatRAGContextForPrompt(context: RAGContext): string {
  let formatted = '';

  // SEO Guidelines
  if (context.seo_guidelines.length > 0) {
    formatted += '## Google SEO 가이드라인\n\n';
    formatted += '다음은 Google 공식 SEO 가이드에서 추출한 관련 내용입니다:\n\n';

    context.seo_guidelines.forEach((guideline, idx) => {
      formatted += `${idx + 1}. **${guideline.section}** (우선순위: ${guideline.priority}/10)\n`;
      formatted += `   ${guideline.text}\n\n`;
    });
  }

  // Similar Content
  if (context.similar_content.length > 0) {
    formatted += '## 고성과 콘텐츠 참고\n\n';
    formatted += '다음은 높은 성과를 거둔 유사 콘텐츠의 패턴입니다:\n\n';

    context.similar_content.forEach((content, idx) => {
      formatted += `${idx + 1}. **${content.title}**\n`;
      formatted += `   - 성과 점수: ${content.performance_score}/10\n`;
      formatted += `   - 작성 스타일: ${content.writing_style}\n`;
      formatted += `   - 발췌: ${content.excerpt.substring(0, 200)}...\n\n`;
    });
  }

  // User Feedback
  if (context.user_feedback.length > 0) {
    formatted += '## 사용자 피드백\n\n';
    formatted += '다음은 이전 콘텐츠에 대한 사용자 피드백입니다:\n\n';

    const positiveFeedback = context.user_feedback.filter((f) => f.feedback_type === 'positive');
    const negativeFeedback = context.user_feedback.filter((f) => f.feedback_type === 'negative');

    if (positiveFeedback.length > 0) {
      formatted += '**긍정적 피드백 (유지할 요소):**\n';
      positiveFeedback.forEach((f) => {
        formatted += `- ${f.feedback_text}\n`;
      });
      formatted += '\n';
    }

    if (negativeFeedback.length > 0) {
      formatted += '**개선 요청 사항 (피해야 할 요소):**\n';
      negativeFeedback.forEach((f) => {
        formatted += `- ${f.feedback_text}\n`;
      });
      formatted += '\n';
    }
  }

  // Best Practices
  if (context.best_practices.length > 0) {
    formatted += '## 카테고리 베스트 프랙티스\n\n';
    context.best_practices.forEach((practice) => {
      formatted += `- ${practice}\n`;
    });
    formatted += '\n';
  }

  formatted += `\n---\n총 ${context.total_sources}개의 소스를 참고하여 작성하세요.\n`;

  return formatted;
}
