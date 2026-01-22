/**
 * Caching Utilities
 *
 * Simple in-memory and API response caching helpers.
 * For production, consider using Redis (Upstash) for distributed caching.
 */

// Simple in-memory cache for server-side caching
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

/**
 * Get item from memory cache
 */
export function getFromCache<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return item.data as T;
}

/**
 * Set item in memory cache
 */
export function setInCache<T>(key: string, data: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete item from cache
 */
export function deleteFromCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now > value.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get or set cache with fetch function
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetchFn();
  setInCache(key, data, ttlSeconds);
  return data;
}

/**
 * Cache key generators for common entities
 */
export const cacheKeys = {
  hospital: (slug: string) => `hospital:${slug}`,
  hospitalList: (filters: Record<string, string>) =>
    `hospitals:list:${JSON.stringify(filters)}`,
  interpreter: (id: string) => `interpreter:${id}`,
  interpreterList: (filters: Record<string, string>) =>
    `interpreters:list:${JSON.stringify(filters)}`,
  blogPost: (slug: string) => `blog:${slug}`,
  blogList: (page: number, category?: string) =>
    `blog:list:${page}:${category || 'all'}`,
  procedure: (slug: string) => `procedure:${slug}`,
};

/**
 * Cache TTLs (in seconds)
 */
export const cacheTTL = {
  short: 60,         // 1 minute - frequently changing data
  medium: 300,       // 5 minutes - semi-static data
  long: 900,         // 15 minutes - mostly static data
  veryLong: 3600,    // 1 hour - static data
};

/**
 * Response cache headers helper
 */
export function getCacheHeaders(ttlSeconds: number, isPublic = true): HeadersInit {
  return {
    'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`,
  };
}

/**
 * No-cache headers for dynamic content
 */
export function getNoCacheHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
  };
}

export default {
  getFromCache,
  setInCache,
  deleteFromCache,
  clearExpiredCache,
  getOrSet,
  cacheKeys,
  cacheTTL,
  getCacheHeaders,
  getNoCacheHeaders,
};
