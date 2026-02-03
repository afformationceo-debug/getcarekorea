/**
 * CTA Settings - Server-side utilities
 *
 * Only import this in Server Components, API routes, or server actions.
 * For client components, use cta.ts
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { CTAConfig, CTASettings } from './cta';

// Server-side cache
let serverCache: CTASettings | null = null;
let serverCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch CTA settings directly from database (server-side)
 */
export async function getCTASettingsServer(): Promise<CTASettings> {
  // Check cache
  if (serverCache && Date.now() - serverCacheTime < CACHE_DURATION) {
    return serverCache;
  }

  try {
    const supabase = await createAdminClient();

    // Only fetch cta_links key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('value')
      .eq('key', 'cta_links')
      .single();

    if (error || !data?.value) {
      return {};
    }

    serverCache = data.value as CTASettings;
    serverCacheTime = Date.now();
    return serverCache;
  } catch {
    return {};
  }
}

/**
 * Get CTA for specific locale (server-side)
 */
export async function getCTAForLocaleServer(locale: string): Promise<CTAConfig | null> {
  const settings = await getCTASettingsServer();
  return settings[locale] || null;
}

/**
 * Clear server cache
 */
export function clearCTAServerCache() {
  serverCache = null;
  serverCacheTime = 0;
}

// Re-export types
export type { CTAConfig, CTASettings };
