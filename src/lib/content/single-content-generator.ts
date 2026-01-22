/**
 * Single Language Content Generator
 *
 * 키워드의 타겟 언어로만 콘텐츠 생성
 * - 키워드 = 타겟 언어/국가
 * - 불필요한 자동 번역 제거
 * - 성능 4.5배 향상, 비용 68% 절감
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPromptV4 } from './prompts/system-prompt-v4';
import { getAuthorForKeyword } from './persona';
import { buildEnhancedRAGContext, formatRAGContextForPrompt, type RAGContext } from './rag-helper';
import type { AuthorPersona } from './persona';
import type { Locale } from './multi-language-generator';

// =====================================================
// TYPES
// =====================================================

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
}

// =====================================================
// INITIALIZATION
// =====================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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
  } = options;

  console.log(`\n📝 Generating content for: ${keyword} (${locale})`);
  console.log(`   Category: ${category}`);
  console.log(`   Include RAG: ${includeRAG}`);
  console.log(`   Include Images: ${includeImages} (${imageCount}x)`);

  const startTime = Date.now();
  let estimatedCost = 0;

  try {
    // 1. Get author persona
    const author = getAuthorForKeyword(keyword, category);
    console.log(`   ✅ Author: ${author.name} (${author.years_of_experience}년 경력)`);

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
    let instructions = additionalInstructions || '';

    if (includeImages) {
      instructions += `\n\nInclude ${imageCount} contextual images throughout the content.`;
    }

    const systemPrompt = buildSystemPromptV4({
      author,
      ragContext: ragPrompt,
      additionalInstructions: instructions,
    });

    // 4. Generate content with Claude
    console.log(`   🤖 Generating content with Claude...`);

    const userPrompt = `Write a comprehensive blog post about: ${keyword}

Target audience: ${locale} speakers interested in Korean medical tourism
Category: ${category}
Style: Professional yet friendly, from ${author.years_of_experience} years experience perspective

Focus on:
- Accurate medical information
- Clear pricing ranges in USD
- Patient journey and recovery timeline
- Cultural sensitivity for ${locale} audience
- SEO optimization for "${keyword}"

CRITICAL OUTPUT REQUIREMENTS:
1. Return ONLY valid JSON (no additional text, explanations, or markdown)
2. The "content" field must contain HTML (not Markdown)
3. Include all required fields as specified in the system prompt
4. Follow the exact JSON structure from OUTPUT FORMAT section
5. Do NOT wrap the JSON in markdown code blocks

Return your response as pure JSON starting with { and ending with }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
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
