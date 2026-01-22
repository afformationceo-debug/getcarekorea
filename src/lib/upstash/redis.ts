import { Redis } from '@upstash/redis';

// Lazy initialize Redis client to avoid build-time errors
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis credentials not configured');
    }
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Alias for backward compatibility - use getRedis() for new code
export const redis = {
  get instance() {
    return getRedis();
  },
};

// =====================================================
// CACHE UTILITIES
// =====================================================

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

const DEFAULT_TTL = 3600; // 1 hour
const CACHE_PREFIXES = {
  hospital: 'cache:hospital',
  hospitalList: 'cache:hospitals:list',
  interpreter: 'cache:interpreter',
  interpreterList: 'cache:interpreters:list',
  procedure: 'cache:procedure',
  blog: 'cache:blog',
  session: 'session',
} as const;

/**
 * Get cached data or fetch and cache it
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL, prefix = '' } = options;
  const cacheKey = prefix ? `${prefix}:${key}` : key;

  try {
    // Try to get from cache
    const cached = await getRedis().get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the data
    await getRedis().set(cacheKey, data, { ex: ttl });

    return data;
  } catch (error) {
    console.error('Cache error:', error);
    // If cache fails, still return fetched data
    return fetcher();
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string, prefix?: string): Promise<void> {
  const cacheKey = prefix ? `${prefix}:${key}` : key;
  await getRedis().del(cacheKey);
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern);
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
}

// =====================================================
// HOSPITAL CACHE
// =====================================================

export async function getCachedHospital<T>(
  id: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return getCachedData(id, fetcher, {
    prefix: CACHE_PREFIXES.hospital,
    ttl: 3600, // 1 hour
  });
}

export async function getCachedHospitalList<T>(
  hash: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return getCachedData(hash, fetcher, {
    prefix: CACHE_PREFIXES.hospitalList,
    ttl: 900, // 15 minutes
  });
}

export async function invalidateHospitalCache(id: string): Promise<void> {
  await invalidateCache(id, CACHE_PREFIXES.hospital);
  await invalidateCachePattern(`${CACHE_PREFIXES.hospitalList}:*`);
}

// =====================================================
// INTERPRETER CACHE
// =====================================================

export async function getCachedInterpreter<T>(
  id: string,
  fetcher: () => Promise<T>
): Promise<T> {
  return getCachedData(id, fetcher, {
    prefix: CACHE_PREFIXES.interpreter,
    ttl: 1800, // 30 minutes
  });
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

interface SessionData {
  userId?: string;
  locale: string;
  chatHistory?: Array<{ role: string; content: string }>;
  lastActivity: number;
}

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

export async function getSession(sessionId: string): Promise<SessionData | null> {
  return getRedis().get<SessionData>(`${CACHE_PREFIXES.session}:${sessionId}`);
}

export async function setSession(sessionId: string, data: SessionData): Promise<void> {
  await getRedis().set(`${CACHE_PREFIXES.session}:${sessionId}`, data, {
    ex: SESSION_TTL,
  });
}

export async function updateSession(
  sessionId: string,
  updates: Partial<SessionData>
): Promise<void> {
  const session = await getSession(sessionId);
  if (session) {
    await setSession(sessionId, { ...session, ...updates, lastActivity: Date.now() });
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await getRedis().del(`${CACHE_PREFIXES.session}:${sessionId}`);
}

// =====================================================
// RATE LIMITING
// =====================================================

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  anonymous: { maxRequests: 20, windowSeconds: 60 },
  authenticated: { maxRequests: 100, windowSeconds: 60 },
  premium: { maxRequests: 500, windowSeconds: 60 },
  api: { maxRequests: 1000, windowSeconds: 60 },
};

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string,
  tier: keyof typeof RATE_LIMIT_TIERS = 'anonymous'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_TIERS[tier];
  const key = `rl:${tier}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;

  // Use Redis sorted set for sliding window
  const multi = getRedis().pipeline();

  // Remove old entries
  multi.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  multi.zcard(key);

  // Add current request
  multi.zadd(key, { score: now, member: `${now}` });

  // Set expiry
  multi.expire(key, config.windowSeconds);

  const results = await multi.exec();
  const currentCount = (results[1] as number) || 0;

  const success = currentCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount - 1);
  const reset = Math.ceil((windowStart + config.windowSeconds * 1000) / 1000);

  return { success, remaining, reset };
}

// =====================================================
// REAL-TIME INTERPRETER STATUS
// =====================================================

const ONLINE_INTERPRETERS_KEY = 'online:interpreters';
const INTERPRETER_ONLINE_TTL = 300; // 5 minutes

export async function setInterpreterOnline(interpreterId: string): Promise<void> {
  await getRedis().zadd(ONLINE_INTERPRETERS_KEY, {
    score: Date.now(),
    member: interpreterId,
  });
}

export async function setInterpreterOffline(interpreterId: string): Promise<void> {
  await getRedis().zrem(ONLINE_INTERPRETERS_KEY, interpreterId);
}

export async function getOnlineInterpreters(): Promise<string[]> {
  const threshold = Date.now() - INTERPRETER_ONLINE_TTL * 1000;
  // Remove stale entries
  await getRedis().zremrangebyscore(ONLINE_INTERPRETERS_KEY, 0, threshold);
  // Get current online interpreters
  return getRedis().zrange(ONLINE_INTERPRETERS_KEY, 0, -1);
}

export async function isInterpreterOnline(interpreterId: string): Promise<boolean> {
  const score = await getRedis().zscore(ONLINE_INTERPRETERS_KEY, interpreterId);
  if (!score) return false;
  return score > Date.now() - INTERPRETER_ONLINE_TTL * 1000;
}

// =====================================================
// LLM INTERACTION LOGGING
// =====================================================

interface LLMInteraction {
  conversationId: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  timestamp: number;
}

const LLM_LOG_KEY = 'llm:interaction';
const LLM_LOG_TTL = 24 * 60 * 60; // 24 hours

export async function logLLMInteraction(interaction: LLMInteraction): Promise<void> {
  const key = `${LLM_LOG_KEY}:${interaction.conversationId}:${interaction.timestamp}`;
  await getRedis().set(key, interaction, { ex: LLM_LOG_TTL });
}

// =====================================================
// FEEDBACK STORAGE
// =====================================================

interface ChatFeedback {
  conversationId: string;
  messageId: string;
  helpful: boolean;
  correction?: string;
  timestamp: number;
}

const FEEDBACK_KEY = 'llm:feedback';

export async function storeChatFeedback(feedback: ChatFeedback): Promise<void> {
  const key = `${FEEDBACK_KEY}:${feedback.conversationId}:${feedback.messageId}`;
  await getRedis().set(key, feedback);
}

export async function getChatFeedback(
  conversationId: string,
  messageId: string
): Promise<ChatFeedback | null> {
  return getRedis().get<ChatFeedback>(`${FEEDBACK_KEY}:${conversationId}:${messageId}`);
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate a hash for cache key from filter/sort params
 */
export function generateCacheHash(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (obj, key) => {
        obj[key] = params[key];
        return obj;
      },
      {} as Record<string, unknown>
    );
  return Buffer.from(JSON.stringify(sorted)).toString('base64').slice(0, 32);
}
