import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { HospitalDetailClient } from './HospitalDetailClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function HospitalDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();
  const localeSuffix = locale.replace('-', '_').toLowerCase();

  // Fetch hospital from DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospitalData, error } = await (supabase.from('hospitals') as any)
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  // If not found in DB, try fallback
  if (error || !hospitalData) {
    const fallbackHospital = await getFallbackHospital(slug);
    if (!fallbackHospital) {
      notFound();
    }

    const hospital = {
      id: fallbackHospital.id,
      slug: fallbackHospital.slug,
      name: fallbackHospital.name_en,
      description: fallbackHospital.description_en,
      logo_url: fallbackHospital.logo_url,
      cover_image_url: fallbackHospital.cover_image_url,
      gallery: fallbackHospital.gallery,
      address: fallbackHospital.address,
      city: fallbackHospital.city,
      phone: fallbackHospital.phone,
      email: fallbackHospital.email,
      website: fallbackHospital.website,
      specialties: fallbackHospital.specialties,
      languages: fallbackHospital.languages,
      certifications: fallbackHospital.certifications,
      has_cctv: fallbackHospital.has_cctv,
      has_female_doctor: fallbackHospital.has_female_doctor,
      avg_rating: fallbackHospital.avg_rating,
      review_count: fallbackHospital.review_count,
      is_featured: fallbackHospital.is_featured,
      is_verified: fallbackHospital.is_verified,
    };

    return (
      <HospitalDetailClient
        hospital={hospital}
        doctors={getMockDoctors()}
        procedures={getMockProcedures()}
        reviews={getMockReviews()}
        locale={locale as Locale}
      />
    );
  }

  // Get related procedures
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: procedureLinks } = await (supabase.from('hospital_procedures') as any)
    .select(`
      procedure_id,
      price_range,
      is_featured,
      procedures (
        id,
        slug,
        category,
        name_en,
        name_ko,
        short_description_en,
        image_url,
        duration_minutes,
        recovery_days
      )
    `)
    .eq('hospital_id', hospitalData.id);

  const procedures = (procedureLinks || [])
    .filter((link: Record<string, unknown>) => link.procedures)
    .map((link: Record<string, unknown>) => {
      const p = link.procedures as Record<string, unknown>;
      return {
        id: p.id as string,
        name: (p[`name_${localeSuffix}`] || p.name_en) as string,
        price: (link.price_range || 'Contact for price') as string,
        duration: p.duration_minutes
          ? `${Math.round((p.duration_minutes as number) / 60)} hours`
          : 'Varies',
        recovery: (p.recovery_days || 'Varies') as string,
        description: (p[`short_description_${localeSuffix}`] || p.short_description_en || '') as string,
      };
    });

  // Use mock data if no procedures linked
  const finalProcedures = procedures.length > 0 ? procedures : getMockProcedures();

  const hospital = {
    id: hospitalData.id,
    slug: hospitalData.slug,
    name: hospitalData[`name_${localeSuffix}`] || hospitalData.name_en || hospitalData.name_ko,
    description: hospitalData[`description_${localeSuffix}`] || hospitalData.description_en || hospitalData.description_ko,
    logo_url: hospitalData.logo_url,
    cover_image_url: hospitalData.cover_image_url,
    gallery: hospitalData.gallery || [],
    address: hospitalData.address,
    city: hospitalData.city,
    phone: hospitalData.phone,
    email: hospitalData.email,
    website: hospitalData.website,
    specialties: hospitalData.specialties || [],
    languages: hospitalData.languages || [],
    certifications: hospitalData.certifications || [],
    has_cctv: hospitalData.has_cctv,
    has_female_doctor: hospitalData.has_female_doctor,
    avg_rating: hospitalData.avg_rating || 4.5,
    review_count: hospitalData.review_count || 0,
    is_featured: hospitalData.is_featured,
    is_verified: hospitalData.is_verified,
  };

  return (
    <HospitalDetailClient
      hospital={hospital}
      doctors={getMockDoctors()}
      procedures={finalProcedures}
      reviews={getMockReviews()}
      locale={locale as Locale}
    />
  );
}

// Mock functions for when DB has no data
function getMockDoctors() {
  return [
    {
      id: '1',
      name: 'Dr. Kim Min-jun',
      title: 'Chief Surgeon',
      specialty: 'Facial Contouring',
      experience: 15,
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      procedures: 3500,
      rating: 4.9,
    },
    {
      id: '2',
      name: 'Dr. Park Ji-yeon',
      title: 'Senior Surgeon',
      specialty: 'Rhinoplasty',
      experience: 12,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
      procedures: 2800,
      rating: 4.8,
    },
    {
      id: '3',
      name: 'Dr. Lee Sung-ho',
      title: 'Specialist',
      specialty: 'Double Eyelid',
      experience: 10,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
      procedures: 2100,
      rating: 4.9,
    },
  ];
}

function getMockProcedures() {
  return [
    {
      id: '1',
      name: 'Rhinoplasty (Nose Job)',
      price: '$2,500 - $5,000',
      duration: '1-3 hours',
      recovery: '1-2 weeks',
      description: 'Reshape your nose to achieve natural-looking results.',
    },
    {
      id: '2',
      name: 'Facial Contouring',
      price: '$4,000 - $8,000',
      duration: '2-4 hours',
      recovery: '2-3 weeks',
      description: 'V-line surgery for a slimmer facial structure.',
    },
    {
      id: '3',
      name: 'Double Eyelid Surgery',
      price: '$1,500 - $3,000',
      duration: '1-2 hours',
      recovery: '1 week',
      description: 'Create natural-looking double eyelids.',
    },
  ];
}

function getMockReviews() {
  return [
    {
      id: '1',
      author: 'Sarah M.',
      rating: 5,
      date: 'January 15, 2024',
      content: 'Amazing experience! The staff was incredibly professional.',
      procedure: 'Rhinoplasty',
      verified: true,
    },
    {
      id: '2',
      author: 'James L.',
      rating: 5,
      date: 'January 10, 2024',
      content: 'World-class facility with cutting-edge technology.',
      procedure: 'Health Checkup',
      verified: true,
    },
    {
      id: '3',
      author: 'Emma T.',
      rating: 4,
      date: 'December 28, 2023',
      content: 'Great results from my double eyelid surgery.',
      procedure: 'Double Eyelid',
      verified: true,
    },
  ];
}

async function getFallbackHospital(slug: string) {
  const hospitals: Record<string, ReturnType<typeof createMockHospital>> = {
    'grand-plastic-surgery': createMockHospital(
      '1',
      'grand-plastic-surgery',
      'Grand Plastic Surgery',
      'Premier plastic surgery clinic in Gangnam, Seoul.',
      ['Plastic Surgery', 'Dermatology'],
      ['JCI'],
      4.9,
      1250,
      []
    ),
    'seoul-wellness-clinic': createMockHospital(
      '2',
      'seoul-wellness-clinic',
      'Seoul Wellness Clinic',
      'Comprehensive health checkup center.',
      ['Health Checkup', 'Internal Medicine'],
      ['JCI', 'KHA'],
      4.8,
      890,
      []
    ),
    'smile-dental-korea': createMockHospital(
      '3',
      'smile-dental-korea',
      'Smile Dental Korea',
      'Award-winning dental clinic.',
      ['Dental', 'Orthodontics'],
      ['JCI'],
      4.9,
      2100,
      []
    ),
    'gangnam-eye-center': createMockHospital(
      '4',
      'gangnam-eye-center',
      'Gangnam Eye Center',
      'Leading LASIK and vision correction center.',
      ['Ophthalmology', 'LASIK'],
      ['JCI'],
      4.8,
      1500,
      []
    ),
    'hair-revival-clinic': createMockHospital(
      '5',
      'hair-revival-clinic',
      'Hair Revival Clinic',
      'Specialized hair transplant center.',
      ['Hair Transplant', 'Dermatology'],
      ['KHA'],
      4.7,
      680,
      []
    ),
    'seoul-fertility-center': createMockHospital(
      '6',
      'seoul-fertility-center',
      'Seoul Fertility Center',
      'Premier fertility clinic.',
      ['Fertility', 'Gynecology'],
      ['JCI'],
      4.9,
      450,
      []
    ),
  };

  return hospitals[slug] || null;
}

function createMockHospital(
  id: string,
  slug: string,
  name: string,
  description: string,
  specialties: string[],
  certifications: string[],
  rating: number,
  reviews: number,
  gallery: string[] = []
) {
  return {
    id,
    slug,
    name_en: name,
    description_en: description,
    logo_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop',
    gallery,
    address: '123 Gangnam-daero, Gangnam-gu',
    city: 'Seoul',
    phone: '+82-2-1234-5678',
    email: 'contact@hospital.com',
    website: 'https://hospital.com',
    specialties,
    languages: ['English', 'Chinese', 'Japanese', 'Korean'],
    certifications,
    has_cctv: true,
    has_female_doctor: true,
    avg_rating: rating,
    review_count: reviews,
    is_featured: true,
    is_verified: true,
  };
}
