/**
 * Image Prompt Generator
 *
 * 콘텐츠 기반 이미지 프롬프트 자동 생성
 * - 카테고리별 스타일 가이드
 * - 로케일별 문화적 고려
 * - SEO 최적화된 이미지 설명
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
    basePrompt: 'Modern luxury medical clinic interior, professional Korean plastic surgery center',
    elements: [
      'clean white walls',
      'soft ambient lighting',
      'comfortable consultation room',
      'professional medical equipment',
      'elegant minimalist design',
      'fresh flowers in vase',
    ],
    atmosphere: 'calm, professional, luxurious, trustworthy',
    colorPalette: 'white, soft blue, rose gold accents',
    avoidElements: [
      'surgery in progress',
      'blood',
      'medical instruments close-up',
      'patient faces',
      'before-after photos',
    ],
  },
  'dermatology': {
    basePrompt: 'K-beauty inspired dermatology clinic, modern Korean skin care center',
    elements: [
      'bright natural lighting',
      'skincare products display',
      'treatment room with advanced equipment',
      'clean glass surfaces',
      'green plants',
      'minimalist Korean aesthetic',
    ],
    atmosphere: 'fresh, bright, clean, rejuvenating',
    colorPalette: 'white, soft pink, mint green, natural wood',
    avoidElements: [
      'skin conditions',
      'close-up of skin problems',
      'injection needles',
      'patient faces',
    ],
  },
  'dental': {
    basePrompt: 'Modern dental clinic in Korea, advanced dental care center',
    elements: [
      'state-of-the-art dental equipment',
      'bright smile imagery',
      'comfortable dental chair',
      'digital screens',
      'clean sterile environment',
      'friendly atmosphere',
    ],
    atmosphere: 'professional, friendly, high-tech, comfortable',
    colorPalette: 'white, light blue, silver, teal accents',
    avoidElements: [
      'dental procedures in progress',
      'open mouths',
      'dental problems',
      'blood',
      'drill close-ups',
    ],
  },
  'health-checkup': {
    basePrompt: 'Premium health screening center in Korea, modern medical facility',
    elements: [
      'advanced diagnostic equipment',
      'MRI or CT scanner',
      'comfortable waiting lounge',
      'professional staff',
      'digital health displays',
      'panoramic city view',
    ],
    atmosphere: 'professional, reassuring, comprehensive, premium',
    colorPalette: 'white, navy blue, silver, warm wood accents',
    avoidElements: [
      'patients in gowns',
      'medical procedures',
      'worried expressions',
      'hospital beds',
    ],
  },
  'general': {
    basePrompt: 'Medical tourism in Korea, Seoul cityscape with modern hospitals',
    elements: [
      'Seoul skyline',
      'modern hospital buildings',
      'Korean traditional and modern mix',
      'international atmosphere',
      'welcoming environment',
    ],
    atmosphere: 'welcoming, international, modern, trustworthy',
    colorPalette: 'blue sky, white buildings, green nature, warm lighting',
    avoidElements: [
      'crowded scenes',
      'negative imagery',
      'confusion',
      'distress',
    ],
  },
};

interface CategoryStyle {
  basePrompt: string;
  elements: string[];
  atmosphere: string;
  colorPalette: string;
  avoidElements: string[];
}

// =====================================================
// LOCALE ADJUSTMENTS
// =====================================================

const LOCALE_PREFERENCES: Record<string, LocalePreference> = {
  en: {
    emphasis: 'international standards, JCI accreditation',
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

  const systemPrompt = `You are an expert at creating image generation prompts for medical tourism content.
Your prompts should create professional, trustworthy, and visually appealing images for blog posts.

IMPORTANT GUIDELINES:
1. Focus on environments, settings, and abstract concepts - NOT people's faces
2. Emphasize cleanliness, professionalism, and modern aesthetics
3. Include Korean cultural elements subtly
4. Never include medical procedures in progress
5. Create prompts that result in images suitable for professional blog headers

Category Style Guide:
- Base: ${categoryStyle.basePrompt}
- Elements to include: ${categoryStyle.elements.join(', ')}
- Atmosphere: ${categoryStyle.atmosphere}
- Color palette: ${categoryStyle.colorPalette}

Locale considerations:
- Target audience emphasis: ${localePrefs.emphasis}
- Cultural elements: ${localePrefs.culturalElements}`;

  const userPrompt = `Create an image generation prompt for this blog post:

Title: ${title}
Excerpt: ${excerpt}
Category: ${category}
Target Locale: ${locale}
${keyword ? `Main Keyword: ${keyword}` : ''}

Respond in JSON format:
{
  "prompt": "detailed image generation prompt (100-150 words)",
  "negativePrompt": "elements to avoid (comma-separated)",
  "style": "photorealistic or digital-art or cinematic",
  "altText": "SEO-friendly alt text for the image (under 125 characters)",
  "suggestedFileName": "kebab-case-filename-without-extension"
}`;

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxOutputTokens: 500,
  });

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const result = JSON.parse(jsonMatch[0]);

    // 기본 네거티브 프롬프트 추가
    const fullNegativePrompt = [
      result.negativePrompt,
      ...categoryStyle.avoidElements,
      'text', 'watermark', 'logo', 'signature',
    ].filter(Boolean).join(', ');

    return {
      prompt: result.prompt,
      negativePrompt: fullNegativePrompt,
      style: result.style || 'photorealistic',
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
    categoryStyle.elements.slice(0, 3).join(', '),
    `atmosphere: ${categoryStyle.atmosphere}`,
    `color palette: ${categoryStyle.colorPalette}`,
    localePrefs.culturalElements,
    'professional photography, high quality, 4K, detailed',
  ].join(', ');

  const negativePrompt = [
    ...categoryStyle.avoidElements,
    'text', 'watermark', 'logo', 'signature', 'blurry', 'low quality',
  ].join(', ');

  // 파일명 생성
  const fileName = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  return {
    prompt,
    negativePrompt,
    style: 'photorealistic',
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
    '4K quality',
    'well-lit',
    'sharp focus',
    'clean composition',
  ];

  return `${basePrompt}, ${qualityEnhancements.join(', ')}`;
}

/**
 * OG 이미지용 프롬프트 조정
 */
export function adjustForOGImage(prompt: string): string {
  return `${prompt}, wide aspect ratio 1.91:1, suitable for social media preview, clean background, centered composition`;
}
