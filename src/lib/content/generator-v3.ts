/**
 * Content Generator v3.0
 *
 * 통합 프롬프트 시스템을 사용하는 콘텐츠 생성기
 * - 프롬프트 빌더 통합
 * - 학습 RAG 통합
 * - 통역사/플랫폼 정체성 적용
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildPrompt, buildSimplePrompt, analyzeContentType } from './prompts/prompt-builder';
import { indexBlogPost } from '@/lib/upstash/vector';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface GenerationResult {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  faqSchema: FAQItem[];
  howToSteps?: HowToStep[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

export interface GenerationMetadata {
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  generationTimeMs: number;
  keyword: string;
  locale: string;
  category: string;
  contentType: string;
  ragIncluded: boolean;
  learningIncluded: boolean;
}

export interface ContentGenerationOptions {
  keyword: string;
  locale: Locale;
  category?: string;
  targetWordCount?: number;
  includeRAG?: boolean;
  includeLearning?: boolean;
}

// =====================================================
// MAIN GENERATION FUNCTION (V3)
// =====================================================

/**
 * 콘텐츠 생성 (v3 - 통합 프롬프트 시스템)
 */
export async function generateBlogContentV3(
  options: ContentGenerationOptions
): Promise<{ result: GenerationResult; metadata: GenerationMetadata }> {
  const {
    keyword,
    locale,
    category = 'general',
    targetWordCount = 1800,
    includeRAG = true,
    includeLearning = true,
  } = options;

  const startTime = Date.now();

  // 프롬프트 빌드
  const builtPrompt = await buildPrompt({
    keyword,
    locale,
    category,
    targetWordCount,
    includeRAG,
    includeLearning,
  });

  // Claude로 콘텐츠 생성
  const { text, usage } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: builtPrompt.systemPrompt,
    prompt: builtPrompt.userPrompt,
    temperature: 0.6,
    maxOutputTokens: 6000,
  });

  // JSON 응답 파싱
  let result: GenerationResult;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    result = JSON.parse(jsonMatch[0]);

    // faqSchema 기본값 보장
    if (!result.faqSchema) {
      result.faqSchema = [];
    }
  } catch (error) {
    console.error('Failed to parse generation result:', error);
    throw new Error('Failed to parse generated content');
  }

  const metadata: GenerationMetadata = {
    model: 'claude-sonnet-4-20250514',
    promptVersion: builtPrompt.metadata.version,
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0,
    generationTimeMs: Date.now() - startTime,
    keyword,
    locale,
    category,
    contentType: builtPrompt.metadata.contentType,
    ragIncluded: builtPrompt.metadata.ragIncluded,
    learningIncluded: builtPrompt.metadata.learningIncluded,
  };

  return { result, metadata };
}

/**
 * 간단 콘텐츠 생성 (RAG 없이, 빠른 생성)
 */
export async function generateBlogContentSimple(
  options: Omit<ContentGenerationOptions, 'includeRAG' | 'includeLearning'>
): Promise<{ result: GenerationResult; metadata: GenerationMetadata }> {
  const {
    keyword,
    locale,
    category = 'general',
    targetWordCount = 1500,
  } = options;

  const startTime = Date.now();

  // 간단 프롬프트 빌드 (동기, RAG 없음)
  const { systemPrompt, userPrompt } = buildSimplePrompt({
    keyword,
    locale,
    category,
    targetWordCount,
  });

  // Claude로 콘텐츠 생성
  const { text, usage } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.6,
    maxOutputTokens: 5000,
  });

  // JSON 응답 파싱
  let result: GenerationResult;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    result = JSON.parse(jsonMatch[0]);

    if (!result.faqSchema) {
      result.faqSchema = [];
    }
  } catch (error) {
    console.error('Failed to parse generation result:', error);
    throw new Error('Failed to parse generated content');
  }

  const metadata: GenerationMetadata = {
    model: 'claude-sonnet-4-20250514',
    promptVersion: '3.0-simple',
    inputTokens: usage?.inputTokens || 0,
    outputTokens: usage?.outputTokens || 0,
    generationTimeMs: Date.now() - startTime,
    keyword,
    locale,
    category,
    contentType: analyzeContentType(keyword),
    ragIncluded: false,
    learningIncluded: false,
  };

  return { result, metadata };
}

// =====================================================
// QUALITY SCORING (V3)
// =====================================================

export interface QualityScoreV3 {
  overall: number;
  seo: number;
  aeo: number;
  eeat: number;
  readability: number;
  identity: number; // 통역사/플랫폼 정체성 준수
  details: QualityDetails;
}

interface QualityDetails {
  // SEO
  hasTitle: boolean;
  titleLength: boolean;
  titleHasKeyword: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: boolean;
  keywordDensity: boolean;

  // AEO
  hasQuickAnswer: boolean;
  hasFAQSection: boolean;
  hasComparisonTable: boolean;
  hasNumberedList: boolean;

  // E-E-A-T
  hasCredentials: boolean;
  hasStatistics: boolean;
  hasDisclaimer: boolean;
  hasPriceRanges: boolean;

  // Identity (통역사/플랫폼)
  noMedicalClaims: boolean;
  hasPlatformVoice: boolean;
  hasProperDisclaimer: boolean;

  // Structure
  hasHeadings: boolean;
  contentLength: boolean;
  hasCTA: boolean;
}

/**
 * 콘텐츠 품질 점수 계산 (v3)
 */
export function scoreContentV3(content: GenerationResult, keyword: string): QualityScoreV3 {
  const lowerContent = content.content?.toLowerCase() || '';
  const lowerKeyword = keyword.toLowerCase();

  // 키워드 밀도 계산
  const wordCount = content.content?.split(/\s+/).length || 0;
  const keywordCount = (lowerContent.match(new RegExp(lowerKeyword.split(' ')[0], 'g')) || []).length;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const details: QualityDetails = {
    // SEO
    hasTitle: !!content.title && content.title.length > 0,
    titleLength: content.title?.length >= 30 && content.title?.length <= 60,
    titleHasKeyword: content.title?.toLowerCase().includes(lowerKeyword.split(' ')[0]) || false,
    hasMetaDescription: !!content.metaDescription && content.metaDescription.length > 0,
    metaDescriptionLength: content.metaDescription?.length >= 145 && content.metaDescription?.length <= 160,
    keywordDensity: keywordDensity >= 0.5 && keywordDensity <= 2.5,

    // AEO
    hasQuickAnswer: /^#{1,3}.*\n\n.{40,100}/m.test(content.content || ''),
    hasFAQSection: content.faqSchema?.length >= 5,
    hasComparisonTable: /\|.*\|.*\|/m.test(content.content || ''),
    hasNumberedList: /^\d+\.\s/m.test(content.content || ''),

    // E-E-A-T
    hasCredentials: /board.certified|accredited|certified|licensed/i.test(lowerContent),
    hasStatistics: /\d+%|\d+,\d+|\$[\d,]+/i.test(content.content || ''),
    hasDisclaimer: /consult.*professional|individual results|not medical advice/i.test(lowerContent),
    hasPriceRanges: /\$[\d,]+-\$[\d,]+/i.test(lowerContent),

    // Identity (통역사/플랫폼)
    noMedicalClaims: !/as a doctor|medically speaking|in my medical opinion/i.test(lowerContent),
    hasPlatformVoice: /getcarekorea|our (team|coordinators|platform)|we (help|assist|guide)/i.test(lowerContent),
    hasProperDisclaimer: /information (only|purposes)|not (a substitute|medical advice)/i.test(lowerContent),

    // Structure
    hasHeadings: (content.content?.match(/^##\s/gm) || []).length >= 4,
    contentLength: wordCount >= 1500,
    hasCTA: /whatsapp|line|wechat|contact|consult|book/i.test(lowerContent),
  };

  // 점수 계산
  const seoScore =
    (details.hasTitle ? 15 : 0) +
    (details.titleLength ? 15 : 0) +
    (details.titleHasKeyword ? 20 : 0) +
    (details.hasMetaDescription ? 15 : 0) +
    (details.metaDescriptionLength ? 15 : 0) +
    (details.keywordDensity ? 20 : 0);

  const aeoScore =
    (details.hasQuickAnswer ? 25 : 0) +
    (details.hasFAQSection ? 30 : 0) +
    (details.hasComparisonTable ? 25 : 0) +
    (details.hasNumberedList ? 20 : 0);

  const eeatScore =
    (details.hasCredentials ? 25 : 0) +
    (details.hasStatistics ? 25 : 0) +
    (details.hasDisclaimer ? 25 : 0) +
    (details.hasPriceRanges ? 25 : 0);

  const identityScore =
    (details.noMedicalClaims ? 40 : 0) +
    (details.hasPlatformVoice ? 30 : 0) +
    (details.hasProperDisclaimer ? 30 : 0);

  const readabilityScore =
    (details.hasHeadings ? 30 : 0) +
    (details.contentLength ? 40 : 0) +
    (details.hasCTA ? 30 : 0);

  // 가중 평균 계산
  const overall = Math.round(
    (seoScore * 0.20) +
    (aeoScore * 0.20) +
    (eeatScore * 0.20) +
    (identityScore * 0.25) + // 정체성 중요
    (readabilityScore * 0.15)
  );

  return {
    overall,
    seo: seoScore,
    aeo: aeoScore,
    eeat: eeatScore,
    readability: readabilityScore,
    identity: identityScore,
    details,
  };
}

// =====================================================
// FULL PIPELINE (V3)
// =====================================================

export interface ContentPipelineResultV3 {
  content: GenerationResult;
  metadata: GenerationMetadata;
  qualityScore: QualityScoreV3;
  indexed: boolean;
}

/**
 * 콘텐츠 생성 파이프라인 (v3)
 */
export async function runContentPipelineV3(
  options: ContentGenerationOptions,
  autoIndex: boolean = false
): Promise<ContentPipelineResultV3> {
  // 콘텐츠 생성
  const { result, metadata } = await generateBlogContentV3(options);

  // 품질 점수 계산
  const qualityScore = scoreContentV3(result, options.keyword);

  // 벡터 인덱싱 (품질 점수 75점 이상)
  let indexed = false;
  if (autoIndex && qualityScore.overall >= 75) {
    try {
      const postId = `generated-${Date.now()}`;
      await indexBlogPost(postId, result.title, result.content, options.locale);
      indexed = true;
    } catch (error) {
      console.error('Failed to index content:', error);
    }
  }

  return {
    content: result,
    metadata,
    qualityScore,
    indexed,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export {
  type FAQItem,
  type HowToStep,
};
