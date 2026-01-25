import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { HospitalsPageClient } from './HospitalsPageClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HospitalsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();
  const localeSuffix = locale.replace('-', '_').toLowerCase();

  // Fetch hospitals from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospitalsData } = await (supabase.from('hospitals') as any)
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('avg_rating', { ascending: false });

  const hospitals = (hospitalsData || []).map((h: Record<string, unknown>) => {
    // Use first Google photo if available, otherwise fall back to cover_image_url
    const googlePhotos = h.google_photos as string[] | null;
    const coverImage = googlePhotos && googlePhotos.length > 0
      ? googlePhotos[0]
      : (h.cover_image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop');

    return {
      id: h.id as string,
      slug: h.slug as string,
      name: (h[`name_${localeSuffix}`] || h.name_en || h.name_ko) as string,
      description: (h[`description_${localeSuffix}`] || h.description_en || h.description_ko) as string,
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

  // Only use real data from database - no mock data
  return (
    <Suspense fallback={<HospitalsPageSkeleton />}>
      <HospitalsPageClient hospitals={hospitals} locale={locale as Locale} />
    </Suspense>
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

