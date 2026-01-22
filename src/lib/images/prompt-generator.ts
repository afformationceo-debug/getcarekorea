/**
 * Image Prompt Generator
 *
 * 콘텐츠 기반 이미지 프롬프트 자동 생성
 * - 카테고리별 스타일 가이드
 * - 로케일별 문화적 고려
 * - SEO 최적화된 이미지 설명
 * - DALL-E 3 최적화
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import type { Locale } from '@/lib/i18n/config';

// =====================================================
// TYPES
// =====================================================

export interface PromptGenerationOptions {
  title: string;
  excerpt: string;
  category: string;
  locale: Locale;
  keyword?: string;
}

export interface GeneratedPrompt {
  prompt: string;
  negativePrompt: string;
  style: string;
  altText: string;
  suggestedFileName: string;
}

// =====================================================
// CATEGORY STYLE GUIDES
// =====================================================

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'plastic-surgery': {
    basePrompt: 'Modern luxury medical clinic interior, professional Korean aesthetic center, consultation room with elegant design',
    elements: [
      'clean white walls',
      'soft ambient lighting',
      'comfortable seating',
      'elegant minimalist design',
      'fresh flowers',
      'floor to ceiling windows',
    ],
    atmosphere: 'calm, professional, luxurious, trustworthy',
    colorPalette: 'white, soft blue, rose gold accents',
  },
  'dermatology': {
    basePrompt: 'K-beauty inspired dermatology clinic, modern Korean skincare center, bright treatment room',
    elements: [
      'bright natural lighting',
      'skincare products display',
      'clean glass surfaces',
      'green plants',
      'minimalist Korean aesthetic',
      'modern equipment',
    ],
    atmosphere: 'fresh, bright, clean, rejuvenating',
    colorPalette: 'white, soft pink, mint green, natural wood',
  },
  'dental': {
    basePrompt: 'Modern dental clinic in Seoul Korea, advanced dental care center, welcoming reception',
    elements: [
      'state-of-the-art equipment',
      'comfortable waiting area',
      'digital displays',
      'clean sterile environment',
      'friendly atmosphere',
      'modern interior',
    ],
    atmosphere: 'professional, friendly, high-tech, comfortable',
    colorPalette: 'white, light blue, silver, teal accents',
  },
  'health-checkup': {
    basePrompt: 'Premium health screening center in Korea, modern medical facility lobby, executive health center',
    elements: [
      'advanced diagnostic area',
      'comfortable lounge',
      'professional reception',
      'digital health displays',
      'panoramic city view',
      'natural light',
    ],
    atmosphere: 'professional, reassuring, comprehensive, premium',
    colorPalette: 'white, navy blue, silver, warm wood accents',
  },
  'general': {
    basePrompt: 'Medical tourism in Korea, Seoul modern hospital district, international healthcare facility',
    elements: [
      'Seoul cityscape',
      'modern hospital buildings',
      'Korean architecture blend',
      'international atmosphere',
      'welcoming entrance',
      'green landscaping',
    ],
    atmosphere: 'welcoming, international, modern, trustworthy',
    colorPalette: 'blue sky, white buildings, green nature, warm lighting',
  },
};

interface CategoryStyle {
  basePrompt: string;
  elements: string[];
  atmosphere: string;
  colorPalette: string;
}

// =====================================================
// LOCALE ADJUSTMENTS
// =====================================================

const LOCALE_PREFERENCES: Record<string, LocalePreference> = {
  en: {
    emphasis: 'international standards, world-class quality',
    culturalElements: 'modern fusion of Korean and Western aesthetics',
  },
  'zh-TW': {
    emphasis: 'safety, reputation, luxury experience',
    culturalElements: 'elegant, sophisticated, premium service',
  },
  'zh-CN': {
    emphasis: 'value, technology, efficiency',
    culturalElements: 'modern, high-tech, professional',
  },
  ja: {
    emphasis: 'precision, attention to detail, cleanliness',
    culturalElements: 'minimalist, orderly, meticulous',
  },
  th: {
    emphasis: 'K-beauty trends, Korean wave influence',
    culturalElements: 'trendy, fashionable, celebrity-style',
  },
  mn: {
    emphasis: 'expertise, advanced technology',
    culturalElements: 'professional, trustworthy, modern',
  },
  ru: {
    emphasis: 'quality, expertise, comprehensive care',
    culturalElements: 'professional, detailed, thorough',
  },
};

interface LocalePreference {
  emphasis: string;
  culturalElements: string;
}

// =====================================================
// PROMPT GENERATION
// =====================================================

/**
 * 콘텐츠 기반 이미지 프롬프트 생성 (LLM 사용)
 */
export async function generateImagePrompt(
  options: PromptGenerationOptions
): Promise<GeneratedPrompt> {
  const { title, excerpt, category, locale, keyword } = options;

  const categoryStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
  const localePrefs = LOCALE_PREFERENCES[locale] || LOCALE_PREFERENCES.en;

  const systemPrompt = `You are an expert at creating DALL-E 3 image generation prompts for medical tourism content.
Your prompts should create professional, trustworthy, and visually appealing images for blog posts.

CRITICAL GUIDELINES FOR DALL-E 3:
1. Focus on environments, buildings, interiors - NOT people
2. Describe WHAT to show, not what to avoid
3. Use descriptive, positive language
4. Emphasize cleanliness, professionalism, and modern aesthetics
5. Include subtle Korean cultural elements
6. Create prompts that result in professional blog header images
7. Specify "no text, no logos, no watermarks" at the end

Category Style Guide:
- Base: ${categoryStyle.basePrompt}
- Elements to include: ${categoryStyle.elements.join(', ')}
- Atmosphere: ${categoryStyle.atmosphere}
- Color palette: ${categoryStyle.colorPalette}

Locale considerations:
- Target audience emphasis: ${localePrefs.emphasis}
- Cultural elements: ${localePrefs.culturalElements}`;

  const userPrompt = `Create a DALL-E 3 image generation prompt for this blog post:

Title: ${title}
Excerpt: ${excerpt}
Category: ${category}
Target Locale: ${locale}
${keyword ? `Main Keyword: ${keyword}` : ''}

Respond ONLY in JSON format (no markdown):
{
  "prompt": "detailed image generation prompt (80-120 words, focus on scene/environment)",
  "negativePrompt": "elements to avoid",
  "style": "natural",
  "altText": "SEO-friendly alt text (under 125 characters)",
  "suggestedFileName": "kebab-case-filename"
}`;

  try {
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const result = JSON.parse(jsonMatch[0]);

    return {
      prompt: result.prompt,
      negativePrompt: result.negativePrompt || '',
      style: result.style || 'natural',
      altText: result.altText,
      suggestedFileName: result.suggestedFileName,
    };
  } catch (error) {
    console.error('Failed to parse prompt generation result:', error);
    // 폴백 프롬프트 생성
    return generateFallbackPrompt(options, categoryStyle);
  }
}

/**
 * 간단 프롬프트 생성 (LLM 없이)
 */
export function generateSimplePrompt(
  options: PromptGenerationOptions
): GeneratedPrompt {
  const categoryStyle = CATEGORY_STYLES[options.category] || CATEGORY_STYLES.general;
  return generateFallbackPrompt(options, categoryStyle);
}

/**
 * 폴백 프롬프트 생성
 */
function generateFallbackPrompt(
  options: PromptGenerationOptions,
  categoryStyle: CategoryStyle
): GeneratedPrompt {
  const { title, category, locale } = options;
  const localePrefs = LOCALE_PREFERENCES[locale] || LOCALE_PREFERENCES.en;

  const prompt = [
    categoryStyle.basePrompt,
    categoryStyle.elements.slice(0, 4).join(', '),
    `${categoryStyle.atmosphere} atmosphere`,
    `color palette: ${categoryStyle.colorPalette}`,
    localePrefs.culturalElements,
    'professional architectural photography, high quality, well-lit, clean composition',
    'no text, no logos, no watermarks',
  ].join('. ');

  // 파일명 생성
  const fileName = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  return {
    prompt,
    negativePrompt: '',
    style: 'natural',
    altText: `${title} - Medical tourism in Korea`,
    suggestedFileName: `${category}-${fileName}`,
  };
}

// =====================================================
// PROMPT ENHANCEMENT
// =====================================================

/**
 * 프롬프트 품질 향상
 */
export function enhancePrompt(basePrompt: string): string {
  const qualityEnhancements = [
    'professional photography',
    'high resolution',
    'well-lit',
    'sharp focus',
    'clean composition',
  ];

  return `${basePrompt}. ${qualityEnhancements.join(', ')}. No text, no logos, no watermarks.`;
}

/**
 * OG 이미지용 프롬프트 조정
 */
export function adjustForOGImage(prompt: string): string {
  return `${prompt}. Wide landscape format 1.91:1 aspect ratio, suitable for social media preview, clean background, centered composition.`;
}
