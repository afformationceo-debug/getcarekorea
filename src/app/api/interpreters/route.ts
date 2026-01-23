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

// Map locale to name field suffix
const localeFieldMap: Record<string, string> = {
  en: 'en',
  ko: 'ko',
  'zh-TW': 'zh_tw',
  'zh-CN': 'zh_cn',
  ja: 'ja',
  th: 'th',
  mn: 'mn',
  ru: 'ru',
};

// Transform author_persona to interpreter format for frontend
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  const suffix = localeFieldMap[locale] || 'en';

  // Get localized name
  const nameKey = `name_${suffix}`;
  const name = (persona[nameKey] as string) || (persona.name_en as string);

  // Get localized bio
  const bioShortKey = `bio_short_${suffix}`;
  const bioFullKey = `bio_full_${suffix}`;
  const bioShort = (persona[bioShortKey] as string) || (persona.bio_short_en as string) || '';
  const bioFull = (persona[bioFullKey] as string) || (persona.bio_full_en as string) || '';

  // Parse languages from JSONB
  const languages = parseLanguages(persona.languages);

  // Build specialties array
  const specialties = [
    formatSpecialty(persona.primary_specialty as string),
    ...((persona.secondary_specialties as string[]) || []).map(formatSpecialty),
  ].filter(Boolean);

  // Get messenger CTA text
  const messengerCtaText = persona.messenger_cta_text as Record<string, string> | null;
  const ctaText = messengerCtaText?.[locale] || messengerCtaText?.en || 'Contact Us';

  return {
    id: persona.id as string,
    slug: persona.slug as string,
    name,
    photo_url: (persona.photo_url as string) || getDefaultPhoto(name),
    languages,
    specialties,
    bio: bioShort || bioFull,
    bio_full: bioFull,
    hourly_rate: (persona.hourly_rate as number) || 50,
    daily_rate: (persona.daily_rate as number) || 350,
    avg_rating: parseFloat(String(persona.avg_rating || 4.8)),
    review_count: (persona.review_count as number) || 0,
    total_bookings: (persona.total_bookings as number) || 0,
    total_posts: (persona.total_posts as number) || 0,
    is_verified: (persona.is_verified as boolean) || false,
    is_available: (persona.is_available as boolean) ?? true,
    is_featured: (persona.is_featured as boolean) || false,
    video_url: persona.video_url as string | null,
    experience_years: (persona.years_of_experience as number) || 5,
    location: (persona.location as string) || 'Seoul, Gangnam',
    certifications: (persona.certifications as string[]) || [],
    preferred_messenger: persona.preferred_messenger as string | null,
    messenger_cta: ctaText,
    target_locales: (persona.target_locales as string[]) || ['en'],
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

// Generate default photo URL based on name
function getDefaultPhoto(name: string): string {
  // Using DiceBear avatars as fallback
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
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
    const availableOnly = searchParams.get('available') === 'true';
    const featuredOnly = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');

    // Build query from author_personas (unified table)
    let query = supabase
      .from('author_personas')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Filter by specialty
    if (specialty) {
      const specialtySlug = specialty.toLowerCase().replace(/\s+/g, '-');
      query = query.or(
        `primary_specialty.eq.${specialtySlug},secondary_specialties.cs.{"${specialtySlug}"}`
      );
    }

    // Filter by availability
    if (availableOnly) {
      query = query.eq('is_available', true);
    }

    // Filter by featured
    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    // Text search
    if (search) {
      const searchPattern = `%${search}%`;
      query = query.or(
        `name_en.ilike.${searchPattern},name_ko.ilike.${searchPattern},bio_short_en.ilike.${searchPattern}`
      );
    }

    // Apply sorting - featured first, then by rating
    query = query
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('avg_rating', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const startTime = Date.now();
    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    secureLog('info', 'Interpreters query executed', {
      responseTimeMs: responseTime,
      recordCount: data?.length || 0,
      totalCount: count || 0,
      locale,
    });

    if (error) {
      secureLog('error', 'Database error fetching interpreters', { error: error.message });
      throw new APIError(ErrorCode.DATABASE_ERROR, undefined, undefined, locale);
    }

    // Transform data for frontend
    const interpreters = (data || []).map((persona) => transformToInterpreter(persona, locale));

    // Additional language filter (post-query since languages is JSONB)
    let filteredInterpreters = interpreters;
    if (language) {
      const langLower = language.toLowerCase();
      filteredInterpreters = interpreters.filter((interpreter) =>
        interpreter.languages.some((l) => l.name.toLowerCase().includes(langLower))
      );
    }

    // Filter by locale (show interpreters that serve this locale or all locales)
    // English interpreters are available to all locales
    if (locale !== 'en') {
      filteredInterpreters = filteredInterpreters.filter(
        (interpreter) =>
          interpreter.target_locales.includes(locale) ||
          interpreter.target_locales.includes('en')
      );
    }

    return createSuccessResponse(filteredInterpreters, {
      page,
      limit,
      total: count || 0,
      hasMore: offset + limit < (count || 0),
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
