import { createClient } from '@/lib/supabase/client';

export interface CTAConfig {
  type: 'whatsapp' | 'line' | 'kakao' | 'telegram';
  url: string;
  text: string;
  color: string;
}

export interface CTASettings {
  [locale: string]: CTAConfig;
}

// Default fallback settings
const DEFAULT_CTA: CTAConfig = {
  type: 'whatsapp',
  url: 'https://wa.me/821086081915',
  text: 'Chat on WhatsApp',
  color: 'from-green-500 to-green-600',
};

// Cache for CTA settings
let cachedSettings: CTASettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch CTA settings from the database
 */
export async function getCTASettings(): Promise<CTASettings> {
  // Return cached settings if still valid
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'cta_links')
      .single();

    if (error || !data?.value) {
      console.warn('Failed to fetch CTA settings, using defaults');
      return {};
    }

    cachedSettings = data.value as CTASettings;
    cacheTimestamp = Date.now();

    return cachedSettings;
  } catch (error) {
    console.error('Error fetching CTA settings:', error);
    return {};
  }
}

/**
 * Get CTA config for a specific locale
 */
export async function getCTAForLocale(locale: string): Promise<CTAConfig> {
  const settings = await getCTASettings();
  return settings[locale] || DEFAULT_CTA;
}

/**
 * Clear the CTA settings cache (call after updating settings)
 */
export function clearCTACache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}
