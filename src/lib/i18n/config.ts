// GetCareKorea i18n Configuration
// Supports 7 languages with locale-specific CTA platforms

export const locales = ['en', 'ko', 'zh-TW', 'zh-CN', 'ja', 'th', 'mn', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale display names in native language
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
  th: 'ภาษาไทย',
  mn: 'Монгол',
  ru: 'Русский',
};

// Locale display names in English (for admin)
export const localeNamesEnglish: Record<Locale, string> = {
  en: 'English',
  ko: 'Korean',
  'zh-TW': 'Traditional Chinese',
  'zh-CN': 'Simplified Chinese',
  ja: 'Japanese',
  th: 'Thai',
  mn: 'Mongolian',
  ru: 'Russian',
};

// CTA Platform configuration by locale
export type MessengerPlatform = 'whatsapp' | 'line' | 'wechat' | 'telegram' | 'kakao';

export interface CTAConfig {
  platform: MessengerPlatform;
  displayName: string;
  icon: string;
  urlPrefix: string;
  alternativePlatform?: MessengerPlatform;
}

export const localeCTAConfig: Record<Locale, CTAConfig> = {
  en: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
  },
  ko: {
    platform: 'kakao',
    displayName: 'KakaoTalk',
    icon: 'kakao',
    urlPrefix: 'https://open.kakao.com/',
  },
  'zh-TW': {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
  },
  'zh-CN': {
    platform: 'wechat',
    displayName: 'WeChat',
    icon: 'wechat',
    urlPrefix: 'weixin://dl/chat?',
  },
  ja: {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
  },
  th: {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
  },
  mn: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
  },
  ru: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
    alternativePlatform: 'telegram',
  },
};

// Language flags for visual display (using emoji flags)
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  ko: '🇰🇷',
  'zh-TW': '🇹🇼',
  'zh-CN': '🇨🇳',
  ja: '🇯🇵',
  th: '🇹🇭',
  mn: '🇲🇳',
  ru: '🇷🇺',
};

// RTL languages (none in our current set)
export const rtlLocales: Locale[] = [];

export const isRTL = (locale: Locale): boolean => rtlLocales.includes(locale);

// Date format configuration
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: { year: 'numeric', month: 'long', day: 'numeric' },
  ko: { year: 'numeric', month: 'long', day: 'numeric' },
  'zh-TW': { year: 'numeric', month: 'long', day: 'numeric' },
  'zh-CN': { year: 'numeric', month: 'long', day: 'numeric' },
  ja: { year: 'numeric', month: 'long', day: 'numeric' },
  th: { year: 'numeric', month: 'long', day: 'numeric' },
  mn: { year: 'numeric', month: 'long', day: 'numeric' },
  ru: { year: 'numeric', month: 'long', day: 'numeric' },
};

// Currency display by locale
export const localeCurrency: Record<Locale, string> = {
  en: 'USD',
  ko: 'KRW',
  'zh-TW': 'TWD',
  'zh-CN': 'CNY',
  ja: 'JPY',
  th: 'THB',
  mn: 'MNT',
  ru: 'RUB',
};

// Medical procedure categories
export const procedureCategories = [
  'plastic-surgery',
  'dermatology',
  'dental',
  'ophthalmology',
  'hair-transplant',
  'health-checkup',
  'orthopedics',
  'fertility',
  'weight-loss',
  'cardiology',
  'oncology',
  'traditional-medicine',
  'wellness',
] as const;

export type ProcedureCategory = (typeof procedureCategories)[number];

// Helper function to get localized field name
export const getLocalizedField = (fieldPrefix: string, locale: Locale): string => {
  const localeKey = locale.replace('-', '_').toLowerCase();
  return `${fieldPrefix}_${localeKey}`;
};

// Database field suffix mapping
export const localeToDbSuffix: Record<Locale, string> = {
  en: 'en',
  ko: 'ko',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  ja: 'ja',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
};

// Get content from localized object with fallback
export function getLocalizedContent<T extends Record<string, unknown>>(
  obj: T,
  fieldPrefix: string,
  locale: Locale,
  fallbackLocale: Locale = 'en'
): string {
  const suffix = localeToDbSuffix[locale];
  const fallbackSuffix = localeToDbSuffix[fallbackLocale];

  const key = `${fieldPrefix}_${suffix}` as keyof T;
  const fallbackKey = `${fieldPrefix}_${fallbackSuffix}` as keyof T;

  return (obj[key] as string) || (obj[fallbackKey] as string) || '';
}
