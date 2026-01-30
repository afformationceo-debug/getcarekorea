/**
 * Single Language Content Generator
 *
 * ⚠️ CRITICAL: 통역사 페르소나 기반 후기형 콘텐츠 생성
 * ========================================================
 *
 * 핵심 원칙 (절대 변경 금지):
 * 1. 통역사 관점의 후기/에세이 스타일
 * 2. 해당 국가 현지인 감성 100% 반영
 * 3. 설득 플로우: 공감 → 문제인식 → 해결책 → 증거 → CTA
 * 4. 진짜 문의가 오게끔 하는 게 목표
 *
 * ⚠️ DO NOT change to generic informational blog style.
 * ⚠️ DO NOT use v6 prompt (정보성 블로그 스타일)
 * ⚠️ ALWAYS use v7 prompt (통역사 페르소나)
 */

import Anthropic from '@anthropic-ai/sdk';
// ⚠️ CRITICAL: v7 프롬프트 사용 (통역사 페르소나)
// 절대 v6로 변경하지 말 것 - v6는 정보성 블로그 스타일임
import { buildInterpreterSystemPrompt, LOCALE_CULTURAL_CONTEXT } from './prompts/system-prompt-v7-interpreter';
import { getAuthorForKeyword } from './persona';
import { buildEnhancedRAGContext, formatRAGContextForPrompt, type RAGContext } from './rag-helper';
import type { AuthorPersona } from './persona';
import type { Locale } from './multi-language-generator';

// =====================================================
// TYPES
// =====================================================

export interface AISummary {
  keyTakeaways: string[];
  quickAnswer: string;
  targetAudience?: string;
  estimatedCost?: string;
  recommendedStay?: string;
  recoveryTime?: string;
}

export interface GeneratedContent {
  locale: Locale;
  keyword: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;              // HTML content
  contentFormat: 'html';
  metaTitle: string;
  metaDescription: string;
  aiSummary?: AISummary;        // AI-generated summary for AEO
  author: AuthorPersona;
  tags: string[];
  faqSchema: Array<{
    question: string;
    answer: string;
  }>;
  howToSchema: Array<{
    name: string;
    text: string;
  }>;
  images: Array<{
    position: string;
    placeholder: string;
    prompt: string;
    alt: string;
    caption?: string;
    contextBefore?: string;
    contextAfter?: string;
  }>;
  internalLinks?: Array<{
    anchor: string;
    target: string;
    context: string;
  }>;
  generationTimestamp: string;
  estimatedCost: number;
}

export interface ContentGenerationOptions {
  keyword: string;
  locale: Locale;
  category?: string;
  includeRAG?: boolean;         // default: true
  includeImages?: boolean;      // default: true
  imageCount?: number;          // default: 3
  additionalInstructions?: string;
  // DB에서 조회한 실제 통역사 정보 (author_personas 테이블)
  dbAuthorPersona?: {
    id: string;
    slug: string;
    name_en: string;
    name_ko: string;
    years_of_experience: number;
    primary_specialty: string;
    languages: Array<{ code: string; proficiency: string }>;
    bio_short_en?: string | null;
    bio_short_ko?: string | null;
  };
}

// =====================================================
// INITIALIZATION
// =====================================================

// Validate API key at module load time for better error messages
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey && typeof window === 'undefined') {
  console.warn('⚠️ ANTHROPIC_API_KEY is not set. Content generation will fail.');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey || 'missing-key',
});

// =====================================================
// MAIN GENERATOR
// =====================================================

/**
 * Generate content in target language only
 *
 * 키워드의 타겟 언어로만 콘텐츠 생성
 * 자동 번역 없음 → 빠르고 저렴함
 */
export async function generateSingleLanguageContent(
  options: ContentGenerationOptions
): Promise<GeneratedContent> {
  const {
    keyword,
    locale,
    category = 'general',
    includeRAG = true,
    includeImages = true,
    imageCount = 3,
    additionalInstructions,
    dbAuthorPersona,
  } = options;

  console.log(`\n📝 Generating content for: ${keyword} (${locale})`);
  console.log(`   Category: ${category}`);
  console.log(`   Include RAG: ${includeRAG}`);
  console.log(`   Include Images: ${includeImages} (${imageCount}x)`);

  const startTime = Date.now();
  let estimatedCost = 0;

  try {
    // 1. Get author persona (DB 통역사 우선, 없으면 fallback)
    let author: AuthorPersona;

    if (dbAuthorPersona) {
      // DB에서 조회한 실제 통역사 정보 사용
      author = {
        name: dbAuthorPersona.name_ko || dbAuthorPersona.name_en,
        name_en: dbAuthorPersona.name_en,
        name_local: {},
        years_of_experience: dbAuthorPersona.years_of_experience,
        specialties: [dbAuthorPersona.primary_specialty],
        languages: dbAuthorPersona.languages.map(l => l.code),
        certifications: [],
        bio: dbAuthorPersona.bio_short_ko || dbAuthorPersona.bio_short_en || '',
        bio_en: dbAuthorPersona.bio_short_en || '',
        bio_local: {},
        writing_style: {
          tone: 'friendly',
          perspective: 'first-person',
          expertise_level: dbAuthorPersona.years_of_experience >= 10 ? 'expert' : 'intermediate',
        },
      };
      console.log(`   ✅ Author (DB): ${author.name} / ${dbAuthorPersona.slug} (${author.years_of_experience}년 경력)`);
    } else {
      // Fallback: 랜덤 페르소나 생성 (레거시 지원)
      author = getAuthorForKeyword(keyword, category);
      console.log(`   ⚠️ Author (Generated): ${author.name} (${author.years_of_experience}년 경력)`);
    }

    // 2. Build RAG context (if enabled)
    let ragContext: RAGContext | null = null;
    let ragPrompt = '';

    if (includeRAG) {
      console.log(`   🔍 Building RAG context...`);
      ragContext = await buildEnhancedRAGContext({
        keyword,
        category,
        locale,
        include_seo_guide: true,
        include_similar_content: true,
        include_feedback: true,
        max_results_per_source: 5,
      });

      ragPrompt = formatRAGContextForPrompt(ragContext);
      console.log(`   ✅ RAG context built`);

      // RAG cost (minimal)
      estimatedCost += 0.0001;
    }

    // 3. Build system prompt
    // ⚠️ CRITICAL: v7 통역사 페르소나 프롬프트 사용
    // 절대 v6 (정보성 블로그) 프롬프트로 변경하지 말 것
    let instructions = additionalInstructions || '';

    if (includeImages) {
      instructions += `\n\nInclude ${imageCount} PHOTOREALISTIC images throughout the content. No illustrations or infographics.`;
    }

    // Get locale cultural context for messaging
    const cultureContext = LOCALE_CULTURAL_CONTEXT[locale] || LOCALE_CULTURAL_CONTEXT['en'];

    // ⚠️ IMPORTANT: 통역사 페르소나 프롬프트 (v7)
    const systemPrompt = buildInterpreterSystemPrompt({
      author,
      locale,
      ragContext: ragPrompt,
      additionalInstructions: instructions,
    });

    // 4. Generate content with Claude
    console.log(`   🤖 Generating content with Claude (통역사 페르소나)...`);

    // ⚠️ CRITICAL: 이 userPrompt는 통역사 후기 스타일을 강조함
    // 일반 정보성 블로그 스타일로 변경하지 말 것
    const userPrompt = `키워드: "${keyword}"

## 당신의 임무

당신은 ${author.years_of_experience}년차 의료 통역사입니다.
이 키워드에 대해 **후기/에세이 스타일**로 글을 써주세요.

## 핵심 요구사항 (반드시 지켜주세요)

### 1. 글쓰기 스타일
- ❌ "~에 대해 알아보겠습니다" 같은 정보성 블로그 어투 금지
- ✅ "내가 통역했던 환자분 이야기를 해줄게" 같은 개인적 톤
- ✅ 실제 케이스 스토리 1-2개 반드시 포함 (익명)
- ✅ ${cultureContext.nativeName} 원어민이 쓴 것 같은 자연스러운 표현

### 2. 독자 타겟: ${cultureContext.name} 사용자
그들의 고민: ${cultureContext.painPoints.slice(0, 2).join(', ')}
그들이 중요하게 여기는 것: ${cultureContext.values.slice(0, 2).join(', ')}
커뮤니케이션 스타일: ${cultureContext.communicationStyle}

### 3. 설득 플로우 (이 순서대로)
1. 훅 - 독자 고민에 공감하는 질문/스토리로 시작
2. 자기소개 - 통역사로서의 경험
3. 실제 케이스 스토리
4. 왜 한국인가 (통역사 관점)
5. 구체적 정보 (가격, 기간, 과정)
6. FAQ (통역사 톤으로)
7. CTA - "${cultureContext.messengerCTA}"

### 4. 이미지
- ${imageCount}개의 스톡포토 스타일 이미지
- 카메라 스펙 명시 (Sony A7R IV, 35mm f/1.4)
- "NO AI artifacts, NO illustration" 필수

### 5. 목표
글을 읽은 사람이 "이 통역사에게 연락해봐야겠다"고 느끼게 만들기

## 출력 형식
- JSON만 출력 (마크다운이나 설명 없이)
- { 로 시작해서 } 로 끝
- system prompt의 JSON 구조 정확히 따르기

이제 ${cultureContext.nativeName}로 통역사 후기 스타일의 글을 작성해주세요.`;


    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000, // Increased for richer content with formatting
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Calculate Claude cost
    const inputTokens = estimateTokens(systemPrompt + ragPrompt + userPrompt);
    const outputTokens = response.usage.output_tokens;
    const claudeCost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
    estimatedCost += claudeCost;

    console.log(`   ✅ Content generated`);
    console.log(`      Input tokens: ${inputTokens.toLocaleString()}`);
    console.log(`      Output tokens: ${outputTokens.toLocaleString()}`);
    console.log(`      Cost: $${claudeCost.toFixed(4)}`);

    // 5. Extract JSON from response
    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    let jsonStr = textContent.trim();

    // Try multiple extraction strategies
    // Strategy 1: Check for ```json code block
    const jsonBlockMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonStr = jsonBlockMatch[1].trim();
    }

    // Strategy 2: Check for ``` code block without language
    if (!jsonStr.startsWith('{')) {
      const codeBlockMatch = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
    }

    // Strategy 3: Find first { and last }
    if (!jsonStr.startsWith('{')) {
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(jsonStr);
    } catch (error) {
      console.error('   ❌ Failed to parse JSON response');
      console.error('   First 500 chars of response:', textContent.substring(0, 500));
      throw new Error('Invalid JSON response from Claude');
    }

    // 6. Validate content
    if (!parsedContent.content || !parsedContent.title) {
      throw new Error('Missing required fields in generated content');
    }

    if (parsedContent.contentFormat !== 'html') {
      console.warn('   ⚠️  Content format is not HTML, setting to html');
      parsedContent.contentFormat = 'html';
    }

    // 7. Build result
    const result: GeneratedContent = {
      locale,
      keyword,
      category,
      title: parsedContent.title,
      excerpt: parsedContent.excerpt,
      content: parsedContent.content,
      contentFormat: 'html',
      metaTitle: parsedContent.metaTitle || parsedContent.title,
      metaDescription: parsedContent.metaDescription || parsedContent.excerpt,
      aiSummary: parsedContent.aiSummary || undefined,
      author,
      tags: parsedContent.tags || [],
      faqSchema: parsedContent.faqSchema || [],
      howToSchema: parsedContent.howToSchema || [],
      images: parsedContent.images || [],
      internalLinks: parsedContent.internalLinks || [],
      generationTimestamp: new Date().toISOString(),
      estimatedCost,
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Content generation complete!`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Total cost: $${estimatedCost.toFixed(4)}`);
    console.log(`   Images to generate: ${result.images.length}`);

    return result;
  } catch (error: any) {
    console.error(`\n❌ Content generation failed:`, error.message);

    // Security: Don't expose sensitive error details
    throw new Error(`Failed to generate content for ${keyword}`);
  }
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
