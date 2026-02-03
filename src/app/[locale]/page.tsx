import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import type { Metadata } from 'next';
import { locales, type Locale } from '@/lib/i18n/config';
import { createClient } from '@/lib/supabase/server';

const baseUrl = 'https://getcarekorea.com';

// SEO Metadata for home page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      url: `${baseUrl}/${locale}`,
      siteName: 'GetCareKorea',
      images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630 }],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('homeTitle'),
      description: t('homeDescription'),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `${baseUrl}/${loc}`])
      ),
    },
  };
}

// JSON-LD Schema for Organization and WebSite
function generateHomeSchema(locale: Locale) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'GetCareKorea',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Premium medical tourism platform connecting international patients with top Korean hospitals and certified medical interpreters.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KR',
      addressLocality: 'Seoul',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Korean', 'Japanese', 'Chinese', 'Thai', 'Russian', 'Mongolian'],
    },
    sameAs: [
      'https://www.instagram.com/getcarekorea',
      'https://www.facebook.com/getcarekorea',
    ],
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'GetCareKorea',
    url: baseUrl,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/${locale}/hospitals?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return [organizationSchema, webSiteSchema];
}

// Critical above-the-fold components - load immediately
import { HeroSection } from '@/components/landing/HeroSection';
import { TrustBanner } from '@/components/landing/TrustBanner';

// Below-the-fold components - lazy load for faster initial page load
const CategoriesSection = dynamic(() => import('@/components/landing/CategoriesSection').then(mod => ({ default: mod.CategoriesSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const WhyPlatformSection = dynamic(() => import('@/components/landing/WhyPlatformSection').then(mod => ({ default: mod.WhyPlatformSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
});
const FreeInterpreterBanner = dynamic(() => import('@/components/landing/FreeInterpreterBanner').then(mod => ({ default: mod.FreeInterpreterBanner })), {
  loading: () => <div className="h-48 animate-pulse bg-violet-50" />,
});
const PriceComparisonSection = dynamic(() => import('@/components/landing/PriceComparisonSection').then(mod => ({ default: mod.PriceComparisonSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
import { FeaturedHospitalsSection } from '@/components/landing/FeaturedHospitalsSection';
const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection').then(mod => ({ default: mod.HowItWorksSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
});
const TestimonialsSection = dynamic(() => import('@/components/landing/TestimonialsSection').then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
});
import { FeaturedInterpretersSection } from '@/components/landing/FeaturedInterpretersSection';
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => ({ default: mod.CTASection })), {
  loading: () => <div className="h-64 animate-pulse bg-violet-100" />,
});

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Helper to get localized field value
function getLocalizedValue(field: unknown, locale: string): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, string>;
    return obj[locale] || obj['en'] || Object.values(obj)[0] || '';
  }
  return '';
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const schemaMarkup = generateHomeSchema(locale as Locale);

  // Fetch featured hospitals
  const supabase = await createClient();

  interface HospitalRow {
    id: string;
    slug: string;
    name: unknown;
    description: unknown;
    cover_image_url: string | null;
    avg_rating: number;
    review_count: number;
    specialties: unknown;
    city: string;
    district: string | null;
    languages: unknown;
    certifications: unknown;
    is_featured: boolean;
  }

  interface InterpreterRow {
    id: string;
    name: string;
    profile_image_url: string | null;
    avg_rating: number;
    review_count: number;
    languages: unknown;
    specialties: unknown;
    city: string;
    is_available: boolean;
    is_featured: boolean;
  }

  const { data: hospitalsData } = await supabase
    .from('hospitals')
    .select('id, slug, name, description, cover_image_url, avg_rating, review_count, specialties, city, district, languages, certifications, is_featured')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('avg_rating', { ascending: false })
    .limit(6);

  // Fetch featured interpreters
  const { data: interpretersData } = await supabase
    .from('interpreters')
    .select('id, name, profile_image_url, avg_rating, review_count, languages, specialties, city, is_available, is_featured')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('avg_rating', { ascending: false })
    .limit(6);

  // Process hospitals data with locale
  const hospitals = ((hospitalsData || []) as HospitalRow[]).map(h => ({
    id: h.id,
    slug: h.slug,
    name: getLocalizedValue(h.name, locale),
    description: getLocalizedValue(h.description, locale),
    cover_image_url: h.cover_image_url,
    avg_rating: h.avg_rating,
    review_count: h.review_count,
    specialties: (h.specialties || []) as string[],
    city: h.city,
    district: h.district,
    languages: (h.languages || []) as string[],
    certifications: (h.certifications || []) as string[],
    is_featured: h.is_featured,
  }));

  // Process interpreters data
  const interpreters = ((interpretersData || []) as InterpreterRow[]).map(i => ({
    id: i.id,
    name: i.name,
    profile_image_url: i.profile_image_url,
    avg_rating: i.avg_rating,
    review_count: i.review_count,
    languages: (i.languages || []) as string[],
    specialties: (i.specialties || []) as string[],
    city: i.city,
    is_available: i.is_available,
    is_featured: i.is_featured,
  }));

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* JSON-LD Schema for SEO */}
      <Script
        id="home-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />

      {/* Hero with AI Chat - Critical, loads first */}
      <HeroSection />

      {/* Trust Indicators - Critical, loads first */}
      <TrustBanner />

      {/* Below-the-fold content - Lazy loaded */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <CategoriesSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <WhyPlatformSection />
      </Suspense>

      <Suspense fallback={<div className="h-48 animate-pulse bg-violet-50" />}>
        <FreeInterpreterBanner />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <PriceComparisonSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <FeaturedHospitalsSection hospitals={hospitals} />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <TestimonialsSection />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <FeaturedInterpretersSection interpreters={interpreters} />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-violet-100" />}>
        <CTASection />
      </Suspense>
    </div>
  );
}
