import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { InterpretersPageClient } from './InterpretersPageClient';
import { createAdminClient } from '@/lib/supabase/server';
import { locales, type Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import Script from 'next/script';

const baseUrl = 'https://getcarekorea.com';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// SEO Metadata for interpreters listing page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('interpretersTitle'),
    description: t('interpretersDescription'),
    openGraph: {
      title: t('interpretersTitle'),
      description: t('interpretersDescription'),
      url: `${baseUrl}/${locale}/interpreters`,
      siteName: 'GetCareKorea',
      images: [{ url: `${baseUrl}/og-interpreters.jpg`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('interpretersTitle'),
      description: t('interpretersDescription'),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/interpreters`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/interpreters`])
      ),
    },
  };
}

// JSON-LD Schema for interpreters listing
function generateInterpretersSchema(locale: Locale, interpreterCount: number) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Interpreters',
        item: `${baseUrl}/${locale}/interpreters`,
      },
    ],
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Medical Interpreters in Korea',
    description: 'Find certified medical interpreters for your healthcare journey in Korea.',
    url: `${baseUrl}/${locale}/interpreters`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: interpreterCount,
    },
  };

  return [breadcrumbSchema, collectionPageSchema];
}

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

// Get localized value from JSONB field with fallback to English only
function getLocalizedValue(field: unknown, locale: string): string {
  const data = field as LocalizedField | null;
  if (!data) return '';

  // 1. Try current locale
  if (data[locale]) return data[locale];

  // 2. Try English as fallback
  if (data['en']) return data['en'];

  // 3. Return empty (don't show content in unknown language)
  return '';
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

// Transform author_persona to interpreter format for frontend
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  // Get localized name from JSONB (persona.name.ko, persona.name.en, etc.)
  const name = getLocalizedValue(persona.name, locale);

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

  return {
    id: persona.id as string,
    slug: persona.slug as string,
    name,
    photo_url: (persona.photo_url as string) || null,
    languages,
    specialties,
    bio: bioShort || bioFull,
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
    // Get language codes from languages array
    language_codes: languages.map(l => l.code),
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

    // Transform all interpreters (no locale filtering - user can filter by language in UI)
    const interpreters = (data || [])
      .map((persona) => transformToInterpreter(persona, locale));

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
  const schemaMarkup = generateInterpretersSchema(locale as Locale, interpreters.length);

  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <Script
        id="interpreters-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />
      <Suspense fallback={<InterpretersPageSkeleton />}>
        <InterpretersPageClient interpreters={interpreters} locale={locale as Locale} />
      </Suspense>
    </>
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
