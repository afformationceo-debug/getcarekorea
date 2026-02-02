/**
 * Interpreter Detail API
 *
 * GET /api/interpreters/[id] - Get interpreter by ID or slug from author_personas
 *
 * Author Personas = Interpreters (unified entity)
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
export const revalidate = 60;

type Params = { params: Promise<{ id: string }> };

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

// Get localized value from JSONB field with fallback to English
function getLocalizedValue(field: unknown, locale: string): string {
  const data = field as LocalizedField | null;
  if (!data) return '';
  return data[locale] || data['en'] || '';
}

// Map locale to column suffix (for blog_posts which still uses column-based approach)
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

// Transform author_persona to interpreter format
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  // Get localized name from JSONB
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
    name_en: nameData?.en || name,
    name_local: name,
    photo_url: (persona.photo_url as string) || null,
    languages,
    specialties,
    bio: bioShort || bioFull,
    bio_full: bioFull,
    avg_rating: parseFloat(String(persona.avg_rating || 4.8)),
    review_count: (persona.review_count as number) || 0,
    total_bookings: (persona.total_bookings as number) || 0,
    is_verified: (persona.is_verified as boolean) || false,
    is_available: true, // is_available column removed - all active interpreters are available
    is_featured: (persona.is_featured as boolean) || false,
    video_url: persona.video_url as string | null,
    experience_years: (persona.years_of_experience as number) || 5,
    location: (persona.location as string) || 'Seoul, Gangnam',
    certifications: (persona.certifications as string[]) || [],
    preferred_messenger: persona.preferred_messenger as string | null,
    messenger_cta: ctaText,
    target_locales: ['en'], // target_locales column removed
    writing_tone: persona.writing_tone as string,
    writing_perspective: persona.writing_perspective as string,
    created_at: persona.created_at as string,
    updated_at: persona.updated_at as string,
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    const locale = searchParams.get('locale') || 'en';
    const includeReviews = searchParams.get('includeReviews') === 'true';
    const includePosts = searchParams.get('includePosts') === 'true';
    const includePhotos = searchParams.get('includePhotos') !== 'false'; // Default: true

    const startTime = Date.now();

    // Try to find by ID first, then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase.from('author_personas').select('*') as any;

    if (isUUID) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: personaData, error } = await query.single();

    if (error || !personaData) {
      throw new APIError(ErrorCode.NOT_FOUND, 'Interpreter not found', { id }, locale);
    }

    // Transform to interpreter format
    const interpreter = transformToInterpreter(personaData as Record<string, unknown>, locale);

    // Build response
    const response: Record<string, unknown> = { ...interpreter };

    // Fetch blog posts written by this author if requested
    if (includePosts) {
      const suffix = localeFieldMap[locale] || 'en';
       
      const { data: posts } = await (supabase
        .from('blog_posts')
        .select(`
          id, slug, category, featured_image, published_at, view_count,
          title_${suffix}, excerpt_${suffix}, title_en, excerpt_en
        `) as any)
        .eq('author_persona_id', (personaData as Record<string, unknown>).id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      response.posts = (posts || []).map((post: Record<string, unknown>) => ({
        id: post.id,
        slug: post.slug,
        category: post.category,
        featured_image: post.featured_image,
        published_at: post.published_at,
        view_count: post.view_count,
        title: post[`title_${suffix}`] || post.title_en,
        excerpt: post[`excerpt_${suffix}`] || post.excerpt_en,
      }));
    }

    // Fetch reviews if requested (from reviews table if exists)
    if (includeReviews) {
      // Note: Reviews are linked to old interpreters table
      // In future, could link reviews to author_personas
      response.reviews = [];
      response.reviewCount = 0;
    }

    // Fetch working photos
    if (includePhotos) {
      const personaId = (personaData as Record<string, unknown>).id as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: photos } = await (supabase.from('interpreter_photos') as any)
        .select('id, image_url, caption, display_order')
        .eq('persona_id', personaId)
        .order('display_order', { ascending: true });

      response.working_photos = photos || [];
    }

    const responseTime = Date.now() - startTime;
    secureLog('info', 'Interpreter detail fetched', {
      id,
      slug: interpreter.slug,
      responseTimeMs: responseTime,
      includePosts,
    });

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}
