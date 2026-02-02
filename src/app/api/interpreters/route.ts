/**
 * Interpreters API
 *
 * GET /api/interpreters - List interpreters from author_personas with locale filtering
 *
 * Author Personas = Interpreters (unified entity)
 * This API fetches from author_personas table which contains both
 * content authors and medical interpreters.
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  APIError,
  ErrorCode,
  secureLog,
} from '@/lib/api/error-handler';

export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 60 seconds

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

// Get localized value from JSONB field with fallback to English
function getLocalizedValue(field: unknown, locale: string): string {
  const data = field as LocalizedField | null;
  if (!data) return '';
  return data[locale] || data['en'] || '';
}

// Transform author_persona to interpreter format for frontend
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  // Get localized name from JSONB (persona.name.ko, persona.name.en, etc.)
  const nameData = persona.name as LocalizedField;
  const name = getLocalizedValue(nameData, locale);

  // Get localized bio from JSONB
  const bioShort = getLocalizedValue(persona.bio_short, locale);
  const bioFull = getLocalizedValue(persona.bio_full, locale);

  // Parse languages from JSONB
  const languages = parseLanguages(persona.languages);

  // Build specialties array
  const specialties = [
    formatSpecialty(persona.primary_specialty as string),
    ...((persona.secondary_specialties as string[]) || []).map(formatSpecialty),
  ].filter(Boolean);

  // Get messenger CTA text
  const messengerCtaText = persona.messenger_cta_text as LocalizedField | null;
  const ctaText = messengerCtaText?.[locale] || messengerCtaText?.en || 'Contact Us';

  return {
    id: persona.id as string,
    slug: persona.slug as string,
    name,
    photo_url: (persona.photo_url as string) || null,
    languages,
    specialties,
    bio: bioShort || bioFull,
    bio_full: bioFull,
    avg_rating: parseFloat(String(persona.avg_rating || 4.8)),
    review_count: (persona.review_count as number) || 0,
    total_bookings: (persona.total_bookings as number) || 0,
    total_posts: (persona.total_posts as number) || 0,
    is_verified: (persona.is_verified as boolean) || false,
    is_available: true, // is_available column removed - all active interpreters are available
    is_featured: (persona.is_featured as boolean) || false,
    video_url: persona.video_url as string | null,
    experience_years: (persona.years_of_experience as number) || 5,
    location: (persona.location as string) || 'Seoul, Gangnam',
    certifications: (persona.certifications as string[]) || [],
    preferred_messenger: persona.preferred_messenger as string | null,
    messenger_cta: ctaText,
  };
}

// Format specialty slug to display name
function formatSpecialty(slug: string | null): string {
  if (!slug) return '';
  const names: Record<string, string> = {
    'plastic-surgery': 'Plastic Surgery',
    'dermatology': 'Dermatology',
    'dental': 'Dental',
    'health-checkup': 'Health Checkup',
    'fertility': 'Fertility',
    'hair-transplant': 'Hair Transplant',
    'ophthalmology': 'Ophthalmology',
    'orthopedics': 'Orthopedics',
    'general-medical': 'General Medical',
  };
  return names[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Parse languages from JSONB format
function parseLanguages(languagesData: unknown): { code: string; name: string; level: string }[] {
  if (!languagesData) return [];

  try {
    const languages = Array.isArray(languagesData)
      ? languagesData
      : JSON.parse(String(languagesData));

    return languages.map((lang: { code?: string; proficiency?: string }) => {
      const code = lang.code || 'en';
      return {
        code,
        name: getLanguageName(code),
        level: lang.proficiency || 'fluent',
      };
    });
  } catch {
    return [];
  }
}

// Get language display name from code
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: 'English',
    ko: 'Korean',
    'zh': 'Chinese',
    'zh-TW': 'Chinese (Traditional)',
    'zh-CN': 'Chinese (Simplified)',
    ja: 'Japanese',
    th: 'Thai',
    mn: 'Mongolian',
    ru: 'Russian',
    vi: 'Vietnamese',
    ar: 'Arabic',
  };
  return names[code] || code.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const locale = searchParams.get('locale') || 'en';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Filter parameters
    const specialty = searchParams.get('specialty');
    const language = searchParams.get('language');
    const featuredOnly = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');

    // Check if we need post-query filtering (language or search)
    const needsPostQueryFilter = (language && language !== 'all') || search;

    // Build query from author_personas (unified table)
    // Use count: 'exact' to get total count with pagination
    let query = supabase
      .from('author_personas')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Filter by specialty
    if (specialty && specialty !== 'all') {
      const specialtySlug = specialty.toLowerCase().replace(/\s+/g, '-');
      query = query.or(
        `primary_specialty.eq.${specialtySlug},secondary_specialties.cs.{"${specialtySlug}"}`
      );
    }

    // Filter by featured
    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    // Apply sorting - featured first, then by rating, then by id for stable ordering
    query = query
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('avg_rating', { ascending: false })
      .order('id', { ascending: true }); // Tie-breaker for stable pagination

    // Only apply DB pagination if no post-query filters needed
    if (!needsPostQueryFilter) {
      query = query.range(offset, offset + limit - 1);
    }

    const startTime = Date.now();
    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    secureLog('info', 'Interpreters query executed', {
      responseTimeMs: responseTime,
      recordCount: data?.length || 0,
      locale,
    });

    if (error) {
      secureLog('error', 'Database error fetching interpreters', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    // Transform data for frontend
    let interpreters = (data || []).map((persona) => transformToInterpreter(persona, locale));

    // When using DB-level pagination, return directly with count from query
    if (!needsPostQueryFilter) {
      const total = count || interpreters.length;
      return createSuccessResponse(interpreters, {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      });
    }

    // Post-query filters (only when needsPostQueryFilter is true)
    // Language filter
    if (language && language !== 'all') {
      interpreters = interpreters.filter((interpreter) =>
        interpreter.languages.some((l) => l.code === language)
      );
    }

    // Text search filter
    if (search) {
      const searchLower = search.toLowerCase();
      interpreters = interpreters.filter((interpreter) =>
        interpreter.name.toLowerCase().includes(searchLower) ||
        interpreter.bio.toLowerCase().includes(searchLower)
      );
    }

    // Calculate total after filtering
    const total = interpreters.length;

    // Apply pagination in memory
    const paginatedInterpreters = interpreters.slice(offset, offset + limit);

    return createSuccessResponse(paginatedInterpreters, {
      page,
      limit,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
