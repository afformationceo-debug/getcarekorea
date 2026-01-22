/**
 * Multi-Language Content Generator
 *
 * Orchestrates content generation across 8 languages:
 * - ko (Korean) - Source language
 * - en (English)
 * - ja (Japanese)
 * - zh-CN (Simplified Chinese)
 * - zh-TW (Traditional Chinese)
 * - th (Thai)
 * - mn (Mongolian)
 * - ru (Russian)
 *
 * Features:
 * - Parallel generation with concurrency limit
 * - HTML structure preservation
 * - ALT tag translation with SEO optimization
 * - hreflang tag generation
 * - Language-specific publishing status
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildTranslationPromptV4 } from './prompts/system-prompt-v4';
import { getAuthorForKeyword } from './persona';
import type { AuthorPersona } from './persona';

// =====================================================
// TYPES
// =====================================================

export type Locale =
  | 'ko'
  | 'en'
  | 'ja'
  | 'zh-CN'
  | 'zh-TW'
  | 'th'
  | 'mn'
  | 'ru';

export const SUPPORTED_LOCALES: Locale[] = [
  'ko',
  'en',
  'ja',
  'zh-CN',
  'zh-TW',
  'th',
  'mn',
  'ru',
];

export interface GeneratedContent {
  locale: Locale;
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
  }>;
  internalLinks?: Array<{
    anchor: string;
    target: string;
    context: string;
  }>;
}

export interface MultiLanguageContent {
  sourceLocale: Locale;
  sourceContent: GeneratedContent;
  translations: Map<Locale, GeneratedContent>;
  hreflangTags: Array<{
    locale: Locale;
    url: string;
  }>;
  generationTimestamp: string;
  totalCost: number;
}

export interface MultiLanguageGenerationOptions {
  sourceContent: GeneratedContent;
  sourceLocale: Locale;
  targetLocales: Locale[];
  keyword: string;
  category?: string;
  localize?: boolean;           // true = localization, false = translation only
  maxConcurrency?: number;      // Max parallel translations (default: 3)
}

export interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  current: Locale | null;
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
 * Generate content in multiple languages
 *
 * Takes source content (usually Korean) and generates localized versions
 * for all target languages while preserving HTML structure and ALT tags.
 */
export async function generateMultiLanguageContent(
  options: MultiLanguageGenerationOptions,
  onProgress?: (progress: TranslationProgress) => void
): Promise<MultiLanguageContent> {
  const {
    sourceContent,
    sourceLocale,
    targetLocales,
    keyword,
    category,
    localize = true,
    maxConcurrency = 3,
  } = options;

  console.log(`\n🌍 Starting multi-language content generation...`);
  console.log(`   Source: ${sourceLocale}`);
  console.log(`   Targets: ${targetLocales.join(', ')}`);
  console.log(`   Mode: ${localize ? 'Localization' : 'Translation'}`);
  console.log(`   Max concurrency: ${maxConcurrency}`);

  const translations = new Map<Locale, GeneratedContent>();
  const errors: Array<{ locale: Locale; error: string }> = [];
  let totalCost = 0;

  // Get author persona (same for all languages)
  const author = getAuthorForKeyword(keyword, category || 'general');

  // Progress tracking
  const progress: TranslationProgress = {
    total: targetLocales.length,
    completed: 0,
    failed: 0,
    inProgress: 0,
    current: null,
  };

  // Process translations with concurrency limit
  const chunks = chunkArray(targetLocales, maxConcurrency);

  for (const chunk of chunks) {
    // Process this chunk in parallel
    const promises = chunk.map(async (targetLocale) => {
      progress.inProgress++;
      progress.current = targetLocale;
      onProgress?.(progress);

      try {
        console.log(`\n  🔄 Translating to ${targetLocale}...`);

        const translated = await translateContent({
          sourceContent,
          sourceLocale,
          targetLocale,
          author,
          keyword,
          localize,
        });

        translations.set(targetLocale, translated);

        // Estimate cost
        const inputTokens = estimateTokens(JSON.stringify(sourceContent));
        const outputTokens = estimateTokens(JSON.stringify(translated));
        const cost = (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015;
        totalCost += cost;

        progress.completed++;
        progress.inProgress--;
        onProgress?.(progress);

        console.log(`     ✅ ${targetLocale} complete (est. $${cost.toFixed(4)})`);

        return { success: true, locale: targetLocale };
      } catch (error: any) {
        console.error(`     ❌ ${targetLocale} failed: ${error.message}`);

        errors.push({
          locale: targetLocale,
          error: error.message,
        });

        progress.failed++;
        progress.inProgress--;
        onProgress?.(progress);

        return { success: false, locale: targetLocale, error: error.message };
      }
    });

    // Wait for this chunk to complete before moving to next
    await Promise.all(promises);
  }

  // Generate hreflang tags
  const hreflangTags = generateHreflangTags({
    sourceLocale,
    targetLocales: Array.from(translations.keys()),
    keyword,
  });

  console.log(`\n✅ Multi-language generation complete!`);
  console.log(`   Successful: ${translations.size}/${targetLocales.length}`);
  console.log(`   Failed: ${errors.length}`);
  console.log(`   Total cost: $${totalCost.toFixed(3)}`);

  if (errors.length > 0) {
    console.log(`\n   ⚠️  Errors:`);
    errors.forEach(({ locale, error }) => {
      console.log(`     - ${locale}: ${error}`);
    });
  }

  return {
    sourceLocale,
    sourceContent,
    translations,
    hreflangTags,
    generationTimestamp: new Date().toISOString(),
    totalCost,
  };
}

// =====================================================
// TRANSLATION
// =====================================================

/**
 * Translate/localize content to a target language
 */
async function translateContent(options: {
  sourceContent: GeneratedContent;
  sourceLocale: Locale;
  targetLocale: Locale;
  author: AuthorPersona;
  keyword: string;
  localize: boolean;
}): Promise<GeneratedContent> {
  const {
    sourceContent,
    sourceLocale,
    targetLocale,
    author,
    keyword,
    localize,
  } = options;

  // Build translation prompt
  const prompt = buildTranslationPromptV4({
    sourceContent: JSON.stringify(sourceContent, null, 2),
    sourceLocale,
    targetLocale,
    author,
    localize,
  });

  // Call Claude API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 16000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract JSON from response
  const textContent = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('\n');

  // Parse JSON (handle markdown code blocks)
  const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : textContent;

  const translatedContent = JSON.parse(jsonStr) as GeneratedContent;

  // Ensure locale is set
  translatedContent.locale = targetLocale;

  // Ensure contentFormat is HTML
  translatedContent.contentFormat = 'html';

  return translatedContent;
}

// =====================================================
// HREFLANG GENERATION
// =====================================================

/**
 * Generate hreflang tags for multi-language content
 *
 * Example output:
 * <link rel="alternate" hreflang="ko" href="https://example.com/ko/korean-rhinoplasty" />
 * <link rel="alternate" hreflang="en" href="https://example.com/en/korean-rhinoplasty" />
 * <link rel="alternate" hreflang="x-default" href="https://example.com/en/korean-rhinoplasty" />
 */
export function generateHreflangTags(options: {
  sourceLocale: Locale;
  targetLocales: Locale[];
  keyword: string;
  baseUrl?: string;
}): Array<{ locale: Locale | 'x-default'; url: string }> {
  const { sourceLocale, targetLocales, keyword, baseUrl = 'https://getcarekorea.com' } = options;

  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);

  const tags: Array<{ locale: Locale | 'x-default'; url: string }> = [];

  // Source locale
  tags.push({
    locale: sourceLocale,
    url: `${baseUrl}/${sourceLocale}/blog/${slug}`,
  });

  // Target locales
  for (const locale of targetLocales) {
    tags.push({
      locale,
      url: `${baseUrl}/${locale}/blog/${slug}`,
    });
  }

  // x-default (fallback to English or source)
  const defaultLocale = targetLocales.includes('en') ? 'en' : sourceLocale;
  tags.push({
    locale: 'x-default',
    url: `${baseUrl}/${defaultLocale}/blog/${slug}`,
  });

  return tags;
}

/**
 * Format hreflang tags as HTML
 */
export function formatHreflangTags(
  tags: Array<{ locale: Locale | 'x-default'; url: string }>
): string {
  return tags
    .map(
      ({ locale, url }) =>
        `<link rel="alternate" hreflang="${locale}" href="${url}" />`
    )
    .join('\n');
}

// =====================================================
// UTILITIES
// =====================================================

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get locale display name
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    th: 'ไทย',
    mn: 'Монгол',
    ru: 'Русский',
  };
  return names[locale];
}

/**
 * Get locale flag emoji
 */
export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    ko: '🇰🇷',
    en: '🇺🇸',
    ja: '🇯🇵',
    'zh-CN': '🇨🇳',
    'zh-TW': '🇹🇼',
    th: '🇹🇭',
    mn: '🇲🇳',
    ru: '🇷🇺',
  };
  return flags[locale];
}

// =====================================================
// EXPORTS
// =====================================================

export {
  generateMultiLanguageContent as default,
  generateMultiLanguageContent,
  generateHreflangTags,
  formatHreflangTags,
  getLocaleDisplayName,
  getLocaleFlag,
};
