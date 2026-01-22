/**
 * Localization Helpers
 *
 * Language-specific utilities for content localization
 * beyond simple translation. Handles:
 * - Currency and number formatting
 * - Date and time formatting
 * - Measurement unit conversion
 * - Cultural adaptations
 * - SEO keyword optimization per language
 */

import type { Locale } from './multi-language-generator';

// =====================================================
// TYPES
// =====================================================

export interface LocalizationContext {
  locale: Locale;
  sourceLocale: Locale;
  keyword: string;
  category?: string;
}

export interface CurrencyFormat {
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandsSeparator: string;
}

export interface DateFormat {
  order: 'YMD' | 'MDY' | 'DMY';
  separator: string;
}

// =====================================================
// CURRENCY FORMATTING
// =====================================================

/**
 * Format currency for specific locale
 *
 * Note: All prices are kept in USD for consistency,
 * but formatting changes per locale
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: 'USD' | 'KRW' = 'USD'
): string {
  const formats: Record<Locale, CurrencyFormat> = {
    ko: {
      symbol: currency === 'KRW' ? '₩' : '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    en: {
      symbol: '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    ja: {
      symbol: currency === 'USD' ? '$' : '¥',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    'zh-CN': {
      symbol: '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    'zh-TW': {
      symbol: '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    th: {
      symbol: '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    mn: {
      symbol: '$',
      position: 'before',
      decimalSeparator: '.',
      thousandsSeparator: ',',
    },
    ru: {
      symbol: '$',
      position: 'before',
      decimalSeparator: ',',
      thousandsSeparator: ' ',
    },
  };

  const format = formats[locale];
  const formatted = amount.toFixed(currency === 'USD' ? 0 : 0);
  const parts = formatted.split('.');
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    format.thousandsSeparator
  );
  const decimalPart = parts[1] ? format.decimalSeparator + parts[1] : '';

  if (format.position === 'before') {
    return `${format.symbol}${integerPart}${decimalPart}`;
  } else {
    return `${integerPart}${decimalPart}${format.symbol}`;
  }
}

/**
 * Format currency range
 * Example: "$3,000-$8,000" or "$3,000~$8,000" depending on locale
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  locale: Locale,
  currency: 'USD' | 'KRW' = 'USD'
): string {
  const separator = ['ko', 'ja', 'zh-CN', 'zh-TW'].includes(locale) ? '~' : '-';
  return `${formatCurrency(min, locale, currency)}${separator}${formatCurrency(max, locale, currency)}`;
}

// =====================================================
// DATE FORMATTING
// =====================================================

/**
 * Format date for specific locale
 */
export function formatDate(date: Date, locale: Locale): string {
  const formats: Record<Locale, DateFormat> = {
    ko: { order: 'YMD', separator: '.' },
    en: { order: 'MDY', separator: '/' },
    ja: { order: 'YMD', separator: '/' },
    'zh-CN': { order: 'YMD', separator: '-' },
    'zh-TW': { order: 'YMD', separator: '-' },
    th: { order: 'DMY', separator: '/' },
    mn: { order: 'YMD', separator: '.' },
    ru: { order: 'DMY', separator: '.' },
  };

  const format = formats[locale];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format.order) {
    case 'YMD':
      return `${year}${format.separator}${month}${format.separator}${day}`;
    case 'MDY':
      return `${month}${format.separator}${day}${format.separator}${year}`;
    case 'DMY':
      return `${day}${format.separator}${month}${format.separator}${year}`;
  }
}

// =====================================================
// MEASUREMENT UNITS
// =====================================================

/**
 * Get preferred measurement units for locale
 */
export function getPreferredUnits(locale: Locale): {
  length: 'metric' | 'imperial';
  weight: 'metric' | 'imperial';
  temperature: 'celsius' | 'fahrenheit';
} {
  // Only US uses imperial
  const useImperial = locale === 'en';

  return {
    length: useImperial ? 'imperial' : 'metric',
    weight: useImperial ? 'imperial' : 'metric',
    temperature: useImperial ? 'fahrenheit' : 'celsius',
  };
}

// =====================================================
// KEYWORD OPTIMIZATION
// =====================================================

/**
 * Get SEO-optimized keywords for locale
 *
 * Different languages have different search patterns
 */
export function getLocalizedKeywords(
  baseKeyword: string,
  locale: Locale,
  category?: string
): string[] {
  const keywords: string[] = [baseKeyword];

  // Add locale-specific variations
  const variations: Partial<Record<Locale, string[]>> = {
    ko: [
      `${baseKeyword} 가격`,
      `${baseKeyword} 비용`,
      `${baseKeyword} 후기`,
      `${baseKeyword} 병원`,
      `${baseKeyword} 추천`,
    ],
    en: [
      `${baseKeyword} cost`,
      `${baseKeyword} price`,
      `${baseKeyword} review`,
      `${baseKeyword} clinic`,
      `${baseKeyword} in Korea`,
    ],
    ja: [
      `${baseKeyword} 費用`,
      `${baseKeyword} 価格`,
      `${baseKeyword} 口コミ`,
      `${baseKeyword} クリニック`,
      `${baseKeyword} 韓国`,
    ],
    'zh-CN': [
      `${baseKeyword} 价格`,
      `${baseKeyword} 费用`,
      `${baseKeyword} 评价`,
      `${baseKeyword} 医院`,
      `${baseKeyword} 韩国`,
    ],
    'zh-TW': [
      `${baseKeyword} 價格`,
      `${baseKeyword} 費用`,
      `${baseKeyword} 評價`,
      `${baseKeyword} 醫院`,
      `${baseKeyword} 韓國`,
    ],
    th: [
      `${baseKeyword} ราคา`,
      `${baseKeyword} ค่าใช้จ่าย`,
      `${baseKeyword} รีวิว`,
      `${baseKeyword} คลินิก`,
      `${baseKeyword} เกาหลี`,
    ],
    ru: [
      `${baseKeyword} цена`,
      `${baseKeyword} стоимость`,
      `${baseKeyword} отзывы`,
      `${baseKeyword} клиника`,
      `${baseKeyword} Корея`,
    ],
    mn: [
      `${baseKeyword} үнэ`,
      `${baseKeyword} зардал`,
      `${baseKeyword} сэтгэгдэл`,
      `${baseKeyword} эмнэлэг`,
      `${baseKeyword} Солонгос`,
    ],
  };

  const localeVariations = variations[locale];
  if (localeVariations) {
    keywords.push(...localeVariations);
  }

  return keywords;
}

// =====================================================
// CULTURAL ADAPTATIONS
// =====================================================

/**
 * Get culturally appropriate example names for locale
 */
export function getExampleNames(locale: Locale): {
  male: string[];
  female: string[];
} {
  const names: Record<
    Locale,
    { male: string[]; female: string[] }
  > = {
    ko: {
      male: ['김민수', '이준호', '박지훈'],
      female: ['김서연', '이지우', '박하은'],
    },
    en: {
      male: ['John', 'Michael', 'David'],
      female: ['Sarah', 'Emily', 'Jessica'],
    },
    ja: {
      male: ['田中太郎', '佐藤健', '鈴木一郎'],
      female: ['田中花子', '佐藤美咲', '鈴木さくら'],
    },
    'zh-CN': {
      male: ['王伟', '李强', '张明'],
      female: ['王丽', '李娜', '张敏'],
    },
    'zh-TW': {
      male: ['王偉', '李強', '張明'],
      female: ['王麗', '李娜', '張敏'],
    },
    th: {
      male: ['สมชาย', 'สมศักดิ์', 'สมพร'],
      female: ['สมหญิง', 'สมใจ', 'สมศรี'],
    },
    mn: {
      male: ['Бат', 'Болд', 'Дорж'],
      female: ['Сарнай', 'Цэцэг', 'Алтан'],
    },
    ru: {
      male: ['Иван', 'Алексей', 'Дмитрий'],
      female: ['Анна', 'Елена', 'Мария'],
    },
  };

  return names[locale];
}

/**
 * Get appropriate greeting for locale
 */
export function getGreeting(locale: Locale): string {
  const greetings: Record<Locale, string> = {
    ko: '안녕하세요',
    en: 'Hello',
    ja: 'こんにちは',
    'zh-CN': '您好',
    'zh-TW': '您好',
    th: 'สวัสดี',
    mn: 'Сайн байна уу',
    ru: 'Здравствуйте',
  };

  return greetings[locale];
}

/**
 * Get appropriate time range format for locale
 */
export function formatTimeRange(
  min: number,
  max: number,
  unit: 'hours' | 'days' | 'weeks' | 'months',
  locale: Locale
): string {
  const unitLabels: Record<
    Locale,
    Record<typeof unit, string>
  > = {
    ko: {
      hours: '시간',
      days: '일',
      weeks: '주',
      months: '개월',
    },
    en: {
      hours: 'hours',
      days: 'days',
      weeks: 'weeks',
      months: 'months',
    },
    ja: {
      hours: '時間',
      days: '日',
      weeks: '週間',
      months: 'ヶ月',
    },
    'zh-CN': {
      hours: '小时',
      days: '天',
      weeks: '周',
      months: '个月',
    },
    'zh-TW': {
      hours: '小時',
      days: '天',
      weeks: '週',
      months: '個月',
    },
    th: {
      hours: 'ชั่วโมง',
      days: 'วัน',
      weeks: 'สัปดาห์',
      months: 'เดือน',
    },
    mn: {
      hours: 'цаг',
      days: 'өдөр',
      weeks: '7 хоног',
      months: 'сар',
    },
    ru: {
      hours: 'часов',
      days: 'дней',
      weeks: 'недель',
      months: 'месяцев',
    },
  };

  const separator = ['ko', 'ja', 'zh-CN', 'zh-TW'].includes(locale) ? '~' : '-';
  const unitLabel = unitLabels[locale][unit];

  if (locale === 'en') {
    return `${min}${separator}${max} ${unitLabel}`;
  } else {
    return `${min}${separator}${max}${unitLabel}`;
  }
}

// =====================================================
// HTML CONTENT VALIDATION
// =====================================================

/**
 * Validate that HTML content is properly localized
 */
export function validateLocalizedHTML(
  html: string,
  locale: Locale
): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for untranslated source language content
  if (locale !== 'ko') {
    const koreanChars = html.match(/[\uAC00-\uD7A3]/g);
    if (koreanChars && koreanChars.length > 10) {
      warnings.push(
        `Found ${koreanChars.length} Korean characters in ${locale} content. May not be fully translated.`
      );
    }
  }

  // Check for image alt tags
  const imgTags = html.match(/<img[^>]*>/g) || [];
  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      warnings.push('Image tag missing alt attribute');
    }
  }

  // Check for proper HTML structure
  if (!html.includes('<p>') && !html.includes('<div>')) {
    warnings.push('Content may not be properly formatted as HTML');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

// =====================================================
// EXPORTS
// =====================================================

export {
  formatCurrency,
  formatCurrencyRange,
  formatDate,
  getPreferredUnits,
  getLocalizedKeywords,
  getExampleNames,
  getGreeting,
  formatTimeRange,
  validateLocalizedHTML,
};
