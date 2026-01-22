/**
 * Prompt Builder v3.0
 *
 * 모든 프롬프트 시스템을 통합하는 빌더
 * - 시스템 프롬프트 + 로케일 + 카테고리 + RAG 조합
 * - 동적 프롬프트 생성
 * - 품질 스코어링 통합
 */

import type { Locale } from '@/lib/i18n/config';
import { generateLocalePrompt, LOCALE_PROMPT_CONFIGS } from './locale-prompts';
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

  // 사용자 프롬프트 구성
  const userPromptParts: string[] = [];

  // 1. 타겟 키워드
  userPromptParts.push(`## 🎯 TARGET KEYWORD: "${keyword}"`);

  // 2. 카테고리 컨텍스트
  userPromptParts.push(generateCategoryPrompt(category));

  // 3. 로케일 & 언어
  userPromptParts.push(generateLocalePrompt(locale));

  // 4. 콘텐츠 스펙
  userPromptParts.push(`
## 📊 CONTENT SPECIFICATIONS

- **Target Word Count**: ${targetWordCount}+ words
- **Content Type**: ${getContentTypeDescription(contentType)}
- **Primary Search Intent**: ${analyzeSearchIntent(keyword)}
- **Prompt Version**: ${PROMPT_VERSION}
`);

  // 5. RAG 컨텍스트 (실제 데이터)
  if (includeRAG) {
    try {
      const ragContext = await buildRAGContext(keyword, locale);
      const contextString = formatRAGContextForPrompt(ragContext);
      if (contextString) {
        userPromptParts.push(`## 📚 RAG CONTEXT (Use this real data)\n\n${contextString}`);
      }
    } catch (error) {
      console.error('Failed to build RAG context:', error);
    }
  }

  // 6. 학습 데이터 컨텍스트
  if (includeLearning) {
    try {
      const learningContext = await buildEnhancedRAGContext(keyword, locale, category);
      if (learningContext.learningContext) {
        userPromptParts.push(learningContext.learningContext);

        if (learningContext.patterns.length > 0) {
          userPromptParts.push(`
### Observed Patterns from High-Performers:
${learningContext.patterns.map(p => `- ${p}`).join('\n')}
`);
        }

        if (learningContext.recommendations.length > 0) {
          userPromptParts.push(`
### Recommendations Based on Performance Data:
${learningContext.recommendations.map(r => `✅ ${r}`).join('\n')}
`);
        }
      }
    } catch (error) {
      console.error('Failed to build learning context:', error);
    }
  }

  // 7. 생성 지침
  userPromptParts.push(getGenerationInstructions(contentType, locale));

  return {
    systemPrompt,
    userPrompt: userPromptParts.join('\n\n'),
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
 * 생성 지침 가져오기
 */
function getGenerationInstructions(contentType: ContentType, locale: Locale): string {
  const ctaPlatform = LOCALE_PROMPT_CONFIGS[locale].ctaPlatform;

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
- Clear CTA with ${ctaPlatform} as the primary contact method

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

  const userPrompt = `
## 🎯 TARGET KEYWORD: "${keyword}"

${generateCategoryPrompt(category)}

${generateLocalePrompt(locale)}

## 📊 CONTENT SPECIFICATIONS
- **Target Word Count**: ${targetWordCount}+ words
- **Content Type**: ${getContentTypeDescription(contentType)}
- **Search Intent**: ${analyzeSearchIntent(keyword)}

## 🎬 INSTRUCTIONS
Create E-E-A-T optimized content with:
1. Quick answer in first 50 words
2. Comparison table (Korea vs others)
3. 5+ FAQ items
4. Price ranges with ${LOCALE_PROMPT_CONFIGS[locale].currencyPrimary}
5. CTA using ${ctaPlatform}

Return JSON only. No code blocks.
`.trim();

  return {
    systemPrompt: CONTENT_SYSTEM_PROMPT_V3,
    userPrompt,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export {
  generateLocalePrompt,
  generateCategoryPrompt,
  LOCALE_PROMPT_CONFIGS,
  CATEGORY_PROMPT_CONFIGS,
  CONTENT_SYSTEM_PROMPT_V3,
  PROMPT_VERSION,
};
