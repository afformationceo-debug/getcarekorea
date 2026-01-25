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

  // If no data in DB, use fallback data
  const finalHospitals = hospitals.length > 0 ? hospitals : getFallbackHospitals();

  return (
    <Suspense fallback={<HospitalsPageSkeleton />}>
      <HospitalsPageClient hospitals={finalHospitals} locale={locale as Locale} />
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

function getFallbackHospitals() {
  return [
    {
      id: '1',
      slug: 'grand-plastic-surgery',
      name: 'Grand Plastic Surgery',
      description: 'Premier plastic surgery clinic in Gangnam, Seoul. Specializing in facial contouring, rhinoplasty, and body contouring procedures with 20+ years of experience.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
      city: 'Gangnam, Seoul',
      specialties: ['Plastic Surgery', 'Dermatology'],
      languages: ['EN', 'ZH', 'JA'],
      rating: 4.9,
      reviews: 1250,
      certifications: ['JCI'],
      badges: ['Featured', 'Top Rated'],
      priceRange: '$2,000 - $15,000',
      hasCCTV: true,
      hasFemaleDoctor: true,
    },
    {
      id: '2',
      slug: 'seoul-wellness-clinic',
      name: 'Seoul Wellness Clinic',
      description: 'Comprehensive health checkup center offering premium screening packages with the latest medical technology and experienced physicians.',
      image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=600&fit=crop',
      city: 'Myeongdong, Seoul',
      specialties: ['Health Checkup', 'Internal Medicine'],
      languages: ['EN', 'ZH', 'JA', 'RU'],
      rating: 4.8,
      reviews: 890,
      certifications: ['JCI', 'KHA'],
      badges: ['Popular'],
      priceRange: '$500 - $3,000',
      hasCCTV: true,
      hasFemaleDoctor: true,
    },
    {
      id: '3',
      slug: 'smile-dental-korea',
      name: 'Smile Dental Korea',
      description: 'Award-winning dental clinic specializing in implants, veneers, and orthodontics. State-of-the-art equipment and bilingual staff.',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
      city: 'Gangnam, Seoul',
      specialties: ['Dental', 'Orthodontics'],
      languages: ['EN', 'ZH', 'JA', 'TH'],
      rating: 4.9,
      reviews: 2100,
      certifications: ['JCI'],
      badges: ['Top Rated'],
      priceRange: '$800 - $5,000',
      hasCCTV: true,
      hasFemaleDoctor: false,
    },
    {
      id: '4',
      slug: 'gangnam-eye-center',
      name: 'Gangnam Eye Center',
      description: 'Leading LASIK and vision correction center with over 50,000 successful procedures. Advanced laser technology.',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
      city: 'Gangnam, Seoul',
      specialties: ['Ophthalmology', 'LASIK'],
      languages: ['EN', 'ZH', 'JA'],
      rating: 4.8,
      reviews: 1500,
      certifications: ['JCI'],
      badges: ['Featured'],
      priceRange: '$1,500 - $4,000',
      hasCCTV: true,
      hasFemaleDoctor: true,
    },
    {
      id: '5',
      slug: 'hair-revival-clinic',
      name: 'Hair Revival Clinic',
      description: 'Specialized hair transplant center using FUE and DHI techniques. Natural-looking results with minimal downtime.',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop',
      city: 'Sinsa, Seoul',
      specialties: ['Hair Transplant', 'Dermatology'],
      languages: ['EN', 'ZH', 'AR'],
      rating: 4.7,
      reviews: 680,
      certifications: ['KHA'],
      badges: [],
      priceRange: '$3,000 - $8,000',
      hasCCTV: true,
      hasFemaleDoctor: false,
    },
    {
      id: '6',
      slug: 'seoul-fertility-center',
      name: 'Seoul Fertility Center',
      description: 'Premier fertility clinic offering IVF, egg freezing, and comprehensive reproductive health services with high success rates.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      city: 'Jamsil, Seoul',
      specialties: ['Fertility', 'Gynecology'],
      languages: ['EN', 'ZH', 'JA', 'VI'],
      rating: 4.9,
      reviews: 450,
      certifications: ['JCI'],
      badges: ['Top Rated'],
      priceRange: '$5,000 - $15,000',
      hasCCTV: true,
      hasFemaleDoctor: true,
    },
  ];
}
