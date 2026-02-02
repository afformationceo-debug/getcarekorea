import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { InterpreterDetailClient } from './InterpreterDetailClient';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcarekorea.com';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

// Type for localized JSONB fields
type LocalizedField = Record<string, string>;

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const supabase = await createAdminClient();

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('author_personas') as any)
    .select('name, bio_short, photo_url, primary_specialty, slug, languages')
    .eq('is_active', true);

  if (isUUID) {
    query = query.eq('id', id);
  } else {
    query = query.eq('slug', id);
  }

  const { data: interpreter } = await query.single();

  if (!interpreter) {
    return {
      title: 'Interpreter Not Found',
    };
  }

  const nameData = interpreter.name as LocalizedField;
  const name = nameData?.[locale] || nameData?.['en'] || 'Medical Interpreter';
  const bioData = interpreter.bio_short as LocalizedField;
  const bio = bioData?.[locale] || bioData?.['en'] || '';
  const slug = interpreter.slug || id;

  const languages = Array.isArray(interpreter.languages)
    ? interpreter.languages.map((l: { code: string }) => l.code).join(', ')
    : '';

  const specialty = interpreter.primary_specialty
    ? interpreter.primary_specialty.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Medical Tourism';

  const description = bio || `${name} - Professional medical interpreter specializing in ${specialty}. Languages: ${languages}`;

  return {
    title: `${name} | Medical Interpreter | GetCareKorea`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} - Medical Interpreter Korea`,
      description: description.slice(0, 160),
      url: `${baseUrl}/${locale}/interpreters/${slug}`,
      siteName: 'GetCareKorea',
      images: interpreter.photo_url ? [{ url: interpreter.photo_url, width: 400, height: 400 }] : [],
      locale: locale,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${name} | Medical Interpreter`,
      description: description.slice(0, 160),
      images: interpreter.photo_url ? [interpreter.photo_url] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/interpreters/${slug}`,
      languages: {
        'en': `${baseUrl}/en/interpreters/${slug}`,
        'ko': `${baseUrl}/ko/interpreters/${slug}`,
        'ja': `${baseUrl}/ja/interpreters/${slug}`,
        'zh-CN': `${baseUrl}/zh-CN/interpreters/${slug}`,
        'zh-TW': `${baseUrl}/zh-TW/interpreters/${slug}`,
      },
    },
  };
}

// Get localized value from JSONB field with fallback to English
function getLocalizedValue(field: unknown, locale: string): string {
  const data = field as LocalizedField | null;
  if (!data) return '';
  return data[locale] || data['en'] || '';
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

// Transform author_persona to interpreter format for frontend
function transformToInterpreter(persona: Record<string, unknown>, locale: string) {
  const nameData = persona.name as LocalizedField;
  const name = getLocalizedValue(nameData, locale);

  const bioShort = getLocalizedValue(persona.bio_short, locale);
  const bioFull = getLocalizedValue(persona.bio_full, locale);

  const languages = parseLanguages(persona.languages);

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
    bio: bioFull || bioShort,
    avg_rating: parseFloat(String(persona.avg_rating || 4.8)),
    review_count: (persona.review_count as number) || 0,
    total_bookings: (persona.total_bookings as number) || 0,
    is_verified: (persona.is_verified as boolean) || false,
    is_available: true,
    video_url: persona.video_url as string | null,
    experience_years: (persona.years_of_experience as number) || 5,
    location: (persona.location as string) || 'Seoul, Gangnam',
    certifications: (persona.certifications as string[]) || [],
    education: '', // Not in current schema
    services: [
      'Medical Consultation Interpretation',
      'Surgery Accompaniment',
      'Hospital Coordination',
      'Post-operative Care Support',
      'Document Translation',
    ],
  };
}

async function getInterpreter(idOrSlug: string, locale: string) {
  const supabase = await createAdminClient();

  // Try to find by ID first (UUID), then by slug
  let query = supabase
    .from('author_personas')
    .select('*')
    .eq('is_active', true);

  // Check if it's a UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUUID) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return transformToInterpreter(data as Record<string, unknown>, locale);
}

export default async function InterpreterDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const interpreter = await getInterpreter(id, locale);

  if (!interpreter) {
    notFound();
  }

  // TODO: Fetch real reviews from database
  const reviews: Array<{
    id: string;
    author: string;
    rating: number;
    date: string;
    content: string;
    procedure: string;
    hospital: string;
  }> = [];

  return (
    <InterpreterDetailClient
      interpreter={interpreter}
      reviews={reviews}
      locale={locale as Locale}
    />
  );
}
