import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { InterpretersPageClient } from './InterpretersPageClient';
import { createAdminClient } from '@/lib/supabase/server';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
}

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
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

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

  return {
    id: persona.id as string,
    slug: persona.slug as string,
    name,
    photo_url: (persona.photo_url as string) || getDefaultPhoto(name),
    languages,
    specialties,
    bio: bioShort || bioFull,
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
    target_locales: (persona.target_locales as string[]) || ['en'],
  };
}

async function fetchInterpreters(locale: string) {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('author_personas')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('avg_rating', { ascending: false });

    if (error) {
      console.error('Error fetching interpreters:', error);
      return [];
    }

    // Transform and filter by locale
    const interpreters = (data || [])
      .map((persona) => transformToInterpreter(persona, locale))
      .filter((interpreter) => {
        // Show interpreters that serve this locale or English (global)
        if (locale === 'en') return true;
        return (
          interpreter.target_locales.includes(locale) ||
          interpreter.target_locales.includes('en')
        );
      });

    return interpreters;
  } catch (error) {
    console.error('Error in fetchInterpreters:', error);
    return [];
  }
}

export default async function InterpretersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch real data from author_personas table
  const interpreters = await fetchInterpreters(locale);

  return (
    <Suspense fallback={<InterpretersPageSkeleton />}>
      <InterpretersPageClient interpreters={interpreters} locale={locale as Locale} />
    </Suspense>
  );
}

function InterpretersPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mb-8 h-12 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
