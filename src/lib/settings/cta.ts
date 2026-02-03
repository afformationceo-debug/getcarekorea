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

// Client-side cache
let clientCache: CTASettings | null = null;
let clientCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch CTA settings from API (client-side)
 */
export async function getCTASettings(): Promise<CTASettings> {
  // Check cache
  if (clientCache && Date.now() - clientCacheTime < CACHE_DURATION) {
    return clientCache;
  }

  try {
    const response = await fetch('/api/cta');
    if (!response.ok) return {};

    const result = await response.json();
    if (result.success && result.data) {
      const settings = result.data as CTASettings;
      clientCache = settings;
      clientCacheTime = Date.now();
      return settings;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Get CTA for specific locale (client-side)
 */
export async function getCTAForLocale(locale: string): Promise<CTAConfig | null> {
  const settings = await getCTASettings();
  return settings[locale] || null;
}

/**
 * Clear CTA cache (call after admin updates)
 */
export function clearCTACache() {
  clientCache = null;
  clientCacheTime = 0;
}
