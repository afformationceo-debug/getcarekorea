/**
 * Prompt Builder v3.0
 *
 * 모든 프롬프트 시스템을 통합하는 빌더
 * - 시스템 프롬프트 + 로케일 + 카테고리 + RAG 조합
 * - 동적 프롬프트 생성
 * - 품질 스코어링 통합
 */

import type { Locale } from '@/lib/i18n/config';
import { generateLocalePrompt, generateLocalePromptWithCTA, LOCALE_PROMPT_CONFIGS, getLocaleCTAFromDB } from './locale-prompts';
import { generateCategoryPrompt, CATEGORY_PROMPT_CONFIGS } from './category-prompts';
import { CONTENT_SYSTEM_PROMPT_V3, RAG_CONTEXT_PROMPT, PROMPT_VERSION } from './system-prompt';
import { buildEnhancedRAGContext } from '../learning-rag';
import { buildRAGContext, formatRAGContextForPrompt } from '@/lib/upstash/vector';

// =====================================================
// TYPES
// =====================================================

export interface PromptBuildOptions {
  keyword: string;
  locale: Locale;
  category: string;
  targetWordCount?: number;
  contentType?: ContentType;
  includeRAG?: boolean;
  includeLearning?: boolean;
}

export type ContentType =
  | 'informational'
  | 'procedural'
  | 'comparison'
  | 'pricing'
  | 'guide'
  | 'faq';

export interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    version: string;
    locale: Locale;
    category: string;
    contentType: ContentType;
    ragIncluded: boolean;
    learningIncluded: boolean;
  };
}

// =====================================================
// CONTENT TYPE ANALYSIS
// =====================================================

/**
 * 키워드 기반 콘텐츠 타입 분석
 */
export function analyzeContentType(keyword: string): ContentType {
  const lowerKeyword = keyword.toLowerCase();

  // 가격/비용 관련
  if (/cost|price|how much|가격|비용|費用|价格|費用|ราคา|стоимость/i.test(lowerKeyword)) {
    return 'pricing';
  }

  // 비교
  if (/vs|versus|comparison|compare|best|top|비교|對比|对比|เปรียบเทียบ|сравнение/i.test(lowerKeyword)) {
    return 'comparison';
  }

  // 절차/방법
  if (/how to|steps|process|guide|방법|過程|过程|วิธี|как/i.test(lowerKeyword)) {
    return 'procedural';
  }

  // 가이드
  if (/guide|complete|ultimate|everything|가이드|指南|คู่มือ|руководство/i.test(lowerKeyword)) {
    return 'guide';
  }

  // FAQ
  if (/faq|questions|q&a/i.test(lowerKeyword)) {
    return 'faq';
  }

  return 'informational';
}

/**
 * 검색 의도 분석
 */
export function analyzeSearchIntent(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();

  if (/cost|price|how much|가격|비용/i.test(lowerKeyword)) {
    return 'Transactional - User wants pricing information to make a decision';
  }
  if (/best|top|recommended|추천/i.test(lowerKeyword)) {
    return 'Commercial Investigation - User comparing options before decision';
  }
  if (/how to|what is|guide|방법/i.test(lowerKeyword)) {
    return 'Informational - User seeking to learn and understand';
  }
  if (/book|appointment|contact|예약/i.test(lowerKeyword)) {
    return 'Transactional - User ready to take action';
  }

  return 'Informational - User researching the topic';
}

// =====================================================
// PROMPT BUILDER
// =====================================================

/**
 * 통합 프롬프트 빌더
 *
 * Long Context Optimization (Claude Best Practice):
 * - 긴 참조 데이터는 프롬프트 최상단에 배치 (성능 최대 30% 향상)
 * - XML 태그로 문서 구조화
 * - 인용 요청으로 응답 근거 제시
 */
export async function buildPrompt(options: PromptBuildOptions): Promise<BuiltPrompt> {
  const {
    keyword,
    locale,
    category,
    targetWordCount = 1800,
    contentType: specifiedContentType,
    includeRAG = true,
    includeLearning = true,
  } = options;

  // 콘텐츠 타입 결정
  const contentType = specifiedContentType || analyzeContentType(keyword);

  // 시스템 프롬프트 구성
  let systemPrompt = CONTENT_SYSTEM_PROMPT_V3;

  // RAG 컨텍스트 지침 추가
  if (includeRAG || includeLearning) {
    systemPrompt += '\n\n' + RAG_CONTEXT_PROMPT;
  }

  // =====================================================
  // 사용자 프롬프트 구성 (Long Context Optimized)
  // 순서: 참조 데이터 → 메타데이터 → 지시사항
  // =====================================================
  const userPromptParts: string[] = [];

  // =====================================================
  // SECTION 1: 참조 데이터 (최상단 배치 - Claude 권장사항)
  // =====================================================
  userPromptParts.push(`<reference_documents>`);

  // 1-1. RAG 컨텍스트 (실제 데이터)
  if (includeRAG) {
    try {
      const ragContext = await buildRAGContext(keyword, locale);
      const contextString = formatRAGContextForPrompt(ragContext);
      if (contextString) {
        userPromptParts.push(`
<document index="1">
  <source>rag_context</source>
  <description>Real hospital and procedure data from our database</description>
  <content>
${contextString}
  </content>
</document>`);
      }
    } catch (error) {
      console.error('Failed to build RAG context:', error);
    }
  }

  // 1-2. 학습 데이터 컨텍스트 (고성과 콘텐츠)
  if (includeLearning) {
    try {
      const learningContext = await buildEnhancedRAGContext(keyword, locale, category);
      if (learningContext.learningContext) {
        userPromptParts.push(`
<document index="2">
  <source>high_performing_content</source>
  <description>Content patterns from our top-performing articles</description>
  <content>
${learningContext.learningContext}
  </content>
</document>`);

        if (learningContext.patterns.length > 0) {
          userPromptParts.push(`
<document index="3">
  <source>observed_patterns</source>
  <description>Writing patterns extracted from successful content</description>
  <content>
${learningContext.patterns.map(p => `- ${p}`).join('\n')}
  </content>
</document>`);
        }

        if (learningContext.recommendations.length > 0) {
          userPromptParts.push(`
<document index="4">
  <source>performance_recommendations</source>
  <description>Data-driven recommendations for this content</description>
  <content>
${learningContext.recommendations.map(r => `- ${r}`).join('\n')}
  </content>
</document>`);
        }
      }
    } catch (error) {
      console.error('Failed to build learning context:', error);
    }
  }

  // 1-3. 카테고리 지식
  userPromptParts.push(`
<document index="5">
  <source>category_knowledge</source>
  <description>Domain expertise for ${category} procedures</description>
  <content>
${generateCategoryPrompt(category)}
  </content>
</document>`);

  // 1-4. 로케일 가이드라인 (with DB CTA)
  const localePromptWithCTA = await generateLocalePromptWithCTA(locale);
  const localeCTA = await getLocaleCTAFromDB(locale);
  const ctaInfo = localeCTA ? {
    platform: localeCTA.type.toUpperCase(),
    url: localeCTA.url,
    text: localeCTA.text,
  } : null;

  userPromptParts.push(`
<document index="6">
  <source>locale_guidelines</source>
  <description>Language and cultural guidelines for ${locale}</description>
  <content>
${localePromptWithCTA}
  </content>
</document>`);

  userPromptParts.push(`</reference_documents>`);

  // =====================================================
  // SECTION 2: 작업 명세 (메타데이터)
  // =====================================================
  userPromptParts.push(`
<task_specification>
  <keyword>${keyword}</keyword>
  <target_locale>${locale}</target_locale>
  <category>${category}</category>
  <content_type>${getContentTypeDescription(contentType)}</content_type>
  <search_intent>${analyzeSearchIntent(keyword)}</search_intent>
  <target_word_count>${targetWordCount}</target_word_count>
  <prompt_version>${PROMPT_VERSION}</prompt_version>
</task_specification>`);

  // =====================================================
  // SECTION 3: 생성 지침 (최하단 배치)
  // =====================================================
  userPromptParts.push(`
<generation_instructions>
## 📋 STEP 1: Reference Analysis (Required)

Before writing, analyze the reference documents above and cite relevant information:

<citations>
1. From rag_context: [Quote specific hospital/procedure data you will use]
2. From high_performing_content: [Quote writing patterns you will adopt]
3. From category_knowledge: [Quote key facts for this procedure type]
</citations>

## 📋 STEP 2: Content Generation

Based on your citations above, generate the content following these requirements:

${getGenerationInstructions(contentType, locale, ctaInfo)}
</generation_instructions>`);

  return {
    systemPrompt,
    userPrompt: userPromptParts.join('\n'),
    metadata: {
      version: PROMPT_VERSION,
      locale,
      category,
      contentType,
      ragIncluded: includeRAG,
      learningIncluded: includeLearning,
    },
  };
}

/**
 * 콘텐츠 타입 설명 가져오기
 */
function getContentTypeDescription(contentType: ContentType): string {
  const descriptions: Record<ContentType, string> = {
    informational: 'Informational - Standard E-E-A-T structure',
    procedural: 'Procedural - HowTo Schema recommended, step-by-step format',
    comparison: 'Comparison - Table format recommended, vs structure',
    pricing: 'Pricing - Specific ranges required, cost comparison tables',
    guide: 'Comprehensive Guide - Long-form, detailed coverage',
    faq: 'FAQ-focused - Q&A format, Schema.org FAQ markup',
  };

  return descriptions[contentType];
}

/**
 * 생성 지침 가져오기 (with optional CTA from DB)
 */
function getGenerationInstructions(contentType: ContentType, locale: Locale, ctaInfo?: { platform: string; url: string; text: string } | null): string {
  const ctaPlatform = ctaInfo?.platform || LOCALE_PROMPT_CONFIGS[locale].ctaPlatform;
  const ctaUrl = ctaInfo?.url || '';
  const ctaText = ctaInfo?.text || '';

  const baseInstructions = `
## 🎬 GENERATION INSTRUCTIONS

Generate a comprehensive, E-E-A-T optimized article that:

1. **IMMEDIATELY** answers what the user is searching for (Featured Snippet optimization)
2. Demonstrates REAL experience with Korean medical tourism
3. Includes SPECIFIC data, prices, and timelines (not vague generalities)
4. Follows the exact content structure in the system prompt
5. Optimizes for both traditional SEO AND Answer Engine Optimization (AEO)

### Content Must Include:
- Quick Answer Box (40-60 words) right after introduction
- At least ONE comparison table (Korea vs. other countries)
- 5-7 FAQ items with Schema-ready Q&A format
- Specific price ranges with currency and year
- Real patient journey elements (consultation → procedure → recovery)
- Clear CTA with ${ctaPlatform} as the primary contact method${ctaUrl ? `
  - CTA URL: ${ctaUrl}
  - CTA Text: "${ctaText}"` : ''}

### AEO Checklist:
- [ ] Definition paragraph for the primary topic
- [ ] Numbered list for any process/steps
- [ ] Direct answers to "how much", "how long", "is it safe" questions
- [ ] Table for any comparisons
- [ ] FAQ section with exact question phrasing users search
`;

  // 콘텐츠 타입별 추가 지침
  const typeSpecificInstructions: Record<ContentType, string> = {
    informational: '',
    procedural: `
### Procedural Content Requirements:
- Include HowTo Schema-ready steps
- Each step should have a clear name and description
- Number all steps sequentially
- Include time estimates where relevant
- Add "Pro Tips" between steps
`,
    comparison: `
### Comparison Content Requirements:
- Create at least 2 comparison tables
- Compare Korea vs USA/UK/Japan/Home Country
- Use clear categories: Price, Quality, Recovery Time, etc.
- Include "Winner" or recommendation in each category
- Acknowledge pros AND cons of each option
`,
    pricing: `
### Pricing Content Requirements:
- Provide SPECIFIC price ranges (not "affordable")
- Show prices in multiple currencies (primary locale + USD)
- Include "What's included" breakdown
- Compare with home country prices
- Mention factors that affect price
- Include "hidden costs" section
`,
    guide: `
### Comprehensive Guide Requirements:
- Minimum 2500 words
- Include table of contents
- Cover the topic exhaustively
- Use progressive detail (overview → specifics)
- Include multiple expert tips
- Provide downloadable checklist concept
`,
    faq: `
### FAQ Content Requirements:
- Minimum 10 FAQ items
- Use exact search query format for questions
- Answers should be 50-80 words each
- Include follow-up questions within answers
- Organize by category if >7 questions
- Mark Schema.org FAQPage ready
`,
  };

  return baseInstructions + (typeSpecificInstructions[contentType] || '') + `

Return ONLY the JSON object. No markdown code blocks around it.`;
}

// =====================================================
// SIMPLE PROMPT GENERATION (NO ASYNC)
// =====================================================

/**
 * 동기식 간단 프롬프트 생성 (RAG 없이)
 * Long Context Optimized: 참조 데이터 → 작업 명세 → 지시사항 순서
 */
export function buildSimplePrompt(options: {
  keyword: string;
  locale: Locale;
  category: string;
  targetWordCount?: number;
}): { systemPrompt: string; userPrompt: string } {
  const { keyword, locale, category, targetWordCount = 1500 } = options;

  const contentType = analyzeContentType(keyword);
  const ctaPlatform = LOCALE_PROMPT_CONFIGS[locale].ctaPlatform;

  // Long Context Optimized: 참조 데이터를 최상단에 배치
  const userPrompt = `
<reference_documents>
<document index="1">
  <source>category_knowledge</source>
  <content>
${generateCategoryPrompt(category)}
  </content>
</document>
<document index="2">
  <source>locale_guidelines</source>
  <content>
${generateLocalePrompt(locale)}
  </content>
</document>
</reference_documents>

<task_specification>
  <keyword>${keyword}</keyword>
  <target_locale>${locale}</target_locale>
  <category>${category}</category>
  <content_type>${getContentTypeDescription(contentType)}</content_type>
  <search_intent>${analyzeSearchIntent(keyword)}</search_intent>
  <target_word_count>${targetWordCount}</target_word_count>
</task_specification>

<generation_instructions>
First, cite relevant information from the reference documents above.

Then create E-E-A-T optimized content with:
1. Quick answer in first 50 words
2. Comparison table (Korea vs others)
3. 5+ FAQ items
4. Price ranges with ${LOCALE_PROMPT_CONFIGS[locale].currencyPrimary}
5. CTA using ${ctaPlatform}

Return JSON only. No code blocks.
</generation_instructions>
`.trim();

  return {
    systemPrompt: CONTENT_SYSTEM_PROMPT_V3,
    userPrompt,
  };
}

// Default export - functions are exported inline
