import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { HospitalsPageClient } from './HospitalsPageClient';
import { locales, type Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';
import Script from 'next/script';

const baseUrl = 'https://getcarekorea.com';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// SEO Metadata for hospitals listing page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('hospitalsTitle'),
    description: t('hospitalsDescription'),
    openGraph: {
      title: t('hospitalsTitle'),
      description: t('hospitalsDescription'),
      url: `${baseUrl}/${locale}/hospitals`,
      siteName: 'GetCareKorea',
      images: [{ url: `${baseUrl}/og-hospitals.jpg`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('hospitalsTitle'),
      description: t('hospitalsDescription'),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/hospitals`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}/hospitals`])
      ),
    },
  };
}

// JSON-LD Schema for hospitals listing
function generateHospitalsSchema(locale: Locale, hospitalCount: number) {
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
        name: 'Hospitals',
        item: `${baseUrl}/${locale}/hospitals`,
      },
    ],
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Medical Hospitals in Korea',
    description: 'Browse JCI-accredited hospitals and clinics in Korea for medical tourism.',
    url: `${baseUrl}/${locale}/hospitals`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: hospitalCount,
      itemListElement: [],
    },
  };

  return [breadcrumbSchema, collectionPageSchema];
}

export default async function HospitalsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();

  // Fetch hospitals from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospitalsData } = await (supabase.from('hospitals') as any)
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false });

  // Helper to get localized value from JSONB field
  const getLocalizedValue = (jsonField: Record<string, string> | null | undefined, fallbackLocale = 'en'): string => {
    if (!jsonField) return '';
    return jsonField[locale] || jsonField[fallbackLocale] || jsonField['en'] || '';
  };

  const hospitals = (hospitalsData || []).map((h: Record<string, unknown>) => {
    // Use first Google photo if available, otherwise fall back to cover_image_url
    const googlePhotos = h.google_photos as string[] | null;
    const coverImage = googlePhotos && googlePhotos.length > 0
      ? googlePhotos[0]
      : (h.cover_image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop');

    // Get localized name and description from JSONB fields (with legacy fallback)
    const nameJson = h.name as Record<string, string> | null;
    const descJson = h.description as Record<string, string> | null;

    return {
      id: h.id as string,
      slug: h.slug as string,
      name: getLocalizedValue(nameJson) || (h.name_en as string) || '',
      description: getLocalizedValue(descJson) || (h.description_en as string) || '',
      image: coverImage as string,
      city: (h.city || 'Seoul') as string,
      district: h.district as string | undefined,
      specialties: (h.specialties || []) as string[],
      languages: (h.languages || ['Korean', 'English']) as string[],
      rating: (h.avg_rating || 4.5) as number,
      reviews: (h.review_count || 0) as number,
      certifications: (h.certifications || []) as string[],
      badges: [
        ...(h.is_featured ? ['Featured'] : []),
        ...((h.avg_rating as number) >= 4.8 ? ['Top Rated'] : []),
      ],
      priceRange: '$1,000 - $10,000',
      hasCCTV: (h.has_cctv || false) as boolean,
      hasFemaleDoctor: (h.has_female_doctor || false) as boolean,
      category: h.category as string | undefined,
      source: h.source as string | undefined,
    };
  });

  const schemaMarkup = generateHospitalsSchema(locale as Locale, hospitals.length);

  // Only use real data from database - no mock data
  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <Script
        id="hospitals-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />
      <Suspense fallback={<HospitalsPageSkeleton />}>
        <HospitalsPageClient hospitals={hospitals} locale={locale as Locale} />
      </Suspense>
    </>
  );
}

function HospitalsPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

