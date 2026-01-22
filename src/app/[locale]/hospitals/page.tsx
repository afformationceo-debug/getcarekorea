import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { HospitalsPageClient } from './HospitalsPageClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HospitalsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Mock data - in production, fetch from Supabase
  const hospitals = [
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
