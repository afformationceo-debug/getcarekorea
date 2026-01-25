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

export interface CTAConfigExtended extends CTAConfig {
  contactId: string; // Phone number for WhatsApp, ID for LINE/WeChat/Kakao, etc.
  defaultMessage: string; // Localized default message
}

export const localeCTAConfig: Record<Locale, CTAConfigExtended> = {
  en: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
    contactId: '821012345678', // TODO: Update with actual number
    defaultMessage: 'Hi, I\'m interested in medical tourism services in Korea.',
  },
  ko: {
    platform: 'kakao',
    displayName: 'KakaoTalk',
    icon: 'kakao',
    urlPrefix: 'https://open.kakao.com/o/',
    contactId: 'getcarekorea', // TODO: Update with actual open chat ID
    defaultMessage: '안녕하세요, 한국 의료관광 서비스에 관심이 있습니다.',
  },
  'zh-TW': {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
    contactId: '@getcarekorea', // TODO: Update with actual LINE ID
    defaultMessage: '您好，我對韓國醫療旅遊服務感興趣。',
  },
  'zh-CN': {
    platform: 'wechat',
    displayName: 'WeChat',
    icon: 'wechat',
    urlPrefix: 'weixin://dl/chat?',
    contactId: 'getcarekorea', // TODO: Update with actual WeChat ID
    defaultMessage: '您好，我对韩国医疗旅游服务感兴趣。',
  },
  ja: {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
    contactId: '@getcarekorea', // TODO: Update with actual LINE ID
    defaultMessage: 'こんにちは、韓国の医療観光サービスに興味があります。',
  },
  th: {
    platform: 'line',
    displayName: 'LINE',
    icon: 'line',
    urlPrefix: 'https://line.me/R/ti/p/',
    contactId: '@getcarekorea', // TODO: Update with actual LINE ID
    defaultMessage: 'สวัสดีครับ/ค่ะ ฉันสนใจบริการท่องเที่ยวเชิงการแพทย์ในเกาหลี',
  },
  mn: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
    contactId: '821012345678', // TODO: Update with actual number
    defaultMessage: 'Сайн байна уу, би Солонгосын эмнэлгийн аялал жуулчлалын үйлчилгээг сонирхож байна.',
  },
  ru: {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    icon: 'whatsapp',
    urlPrefix: 'https://wa.me/',
    contactId: '821012345678', // TODO: Update with actual number
    defaultMessage: 'Здравствуйте, я интересуюсь услугами медицинского туризма в Корее.',
    alternativePlatform: 'telegram',
  },
};

// Get full messenger URL for a locale
export function getMessengerUrl(locale: Locale): string {
  const config = localeCTAConfig[locale];
  const message = encodeURIComponent(config.defaultMessage);

  switch (config.platform) {
    case 'whatsapp':
      return `${config.urlPrefix}${config.contactId}?text=${message}`;
    case 'line':
      return `${config.urlPrefix}${config.contactId}`;
    case 'kakao':
      return `${config.urlPrefix}${config.contactId}`;
    case 'wechat':
      return `${config.urlPrefix}${config.contactId}`;
    case 'telegram':
      return `https://t.me/${config.contactId}`;
    default:
      return config.urlPrefix + config.contactId;
  }
}

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
