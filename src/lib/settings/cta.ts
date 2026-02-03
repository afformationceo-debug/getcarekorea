/**
 * CTA Settings - Type definitions and client utilities
 *
 * Can be imported from both client and server components.
 * For server-side data fetching, use cta.server.ts
 */

export interface CTAConfig {
  type: 'whatsapp' | 'line' | 'kakao' | 'telegram';
  url: string;
  text: string;
  color: string;
}

export interface CTASettings {
  [locale: string]: CTAConfig;
}

// Client-side cache per locale
const localeCache: Record<string, { data: CTAConfig | null; time: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get CTA for specific locale (client-side)
 * API requires locale parameter - this is the primary way to fetch CTA
 */
export async function getCTAForLocale(locale: string): Promise<CTAConfig | null> {
  // Check cache for this locale
  const cached = localeCache[locale];
  if (cached && Date.now() - cached.time < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`/api/cta?locale=${locale}`);
    if (!response.ok) return null;

    const result = await response.json();
    const data = result.success && result.data ? (result.data as CTAConfig) : null;

    // Cache the result
    localeCache[locale] = { data, time: Date.now() };
    return data;
  } catch {
    return null;
  }
}

/**
 * @deprecated Use getCTAForLocale instead - API now requires locale parameter
 */
export async function getCTASettings(): Promise<CTASettings> {
  console.warn('getCTASettings is deprecated. Use getCTAForLocale(locale) instead.');
  return {};
}

/**
 * Clear CTA cache (call after admin updates)
 */
export function clearCTACache() {
  Object.keys(localeCache).forEach((key) => delete localeCache[key]);
}
