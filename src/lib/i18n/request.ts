import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './config';

// Deep merge objects (for nested translation keys)
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key] as Record<string, unknown>, override[key] as Record<string, unknown>);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming locale is valid
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  // Load English as base/fallback
  const enMessages = (await import(`../../../messages/en.json`)).default;

  // If locale is English, just use English messages
  if (locale === 'en') {
    return {
      locale,
      messages: enMessages,
      timeZone: 'Asia/Seoul',
      now: new Date(),
    };
  }

  // Load locale-specific messages and merge with English fallback
  const localeMessages = (await import(`../../../messages/${locale}.json`)).default;
  const mergedMessages = deepMerge(enMessages, localeMessages);

  return {
    locale,
    messages: mergedMessages,
    timeZone: 'Asia/Seoul',
    now: new Date(),
  };
});
