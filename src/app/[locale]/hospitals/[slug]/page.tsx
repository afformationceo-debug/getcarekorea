import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { HospitalDetailClient } from './HospitalDetailClient';
import type { Locale } from '@/lib/i18n/config';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcarekorea.com';

// Helper to get localized value from JSONB field
function getLocalizedValue(jsonField: Record<string, string> | null | undefined, locale: string, fallbackLocale = 'en'): string {
  if (!jsonField) return '';
  return jsonField[locale] || jsonField[fallbackLocale] || jsonField['en'] || '';
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const supabase = await createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospital } = await (supabase.from('hospitals') as any)
    .select('name, description, category, city, district, avg_rating, review_count, google_photos, cover_image_url, specialties, languages')
    .eq('slug', slug)
    .in('status', ['published', 'draft'])
    .single();

  if (!hospital) {
    return {
      title: 'Hospital Not Found',
    };
  }

  // Use JSONB fields
  const nameJson = hospital.name as Record<string, string> | null;
  const descJson = hospital.description as Record<string, string> | null;
  const hospitalName = getLocalizedValue(nameJson, locale);
  const description = getLocalizedValue(descJson, locale) || `${hospitalName} - Top rated medical clinic in ${hospital.city}, Korea`;
  const image = hospital.google_photos?.[0] || hospital.cover_image_url;

  // Generate keywords from available data
  const specialties = (hospital.specialties || []) as string[];
  const languages = (hospital.languages || []) as string[];
  const keywordParts = [
    hospitalName,
    ...specialties,
    hospital.category?.replace(/-/g, ' '),
    hospital.city,
    hospital.district,
    'Korea',
    'medical tourism',
    ...languages.map((l: string) => `${l} speaking`),
  ].filter(Boolean);
  const keywords = [...new Set(keywordParts)].join(', ');

  return {
    title: `${hospitalName} | GetCareKorea`,
    description: description.slice(0, 160),
    keywords,
    openGraph: {
      title: `${hospitalName} - Medical Tourism Korea`,
      description: description.slice(0, 160),
      url: `${baseUrl}/${locale}/hospitals/${slug}`,
      siteName: 'GetCareKorea',
      images: image ? [{ url: image, width: 1200, height: 630 }] : [],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: hospitalName,
      description: description.slice(0, 160),
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/hospitals/${slug}`,
      languages: {
        'en': `${baseUrl}/en/hospitals/${slug}`,
        'ko': `${baseUrl}/ko/hospitals/${slug}`,
        'ja': `${baseUrl}/ja/hospitals/${slug}`,
        'zh-CN': `${baseUrl}/zh-CN/hospitals/${slug}`,
        'zh-TW': `${baseUrl}/zh-TW/hospitals/${slug}`,
        'th': `${baseUrl}/th/hospitals/${slug}`,
        'ru': `${baseUrl}/ru/hospitals/${slug}`,
        'mn': `${baseUrl}/mn/hospitals/${slug}`,
      },
    },
  };
}

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function HospitalDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const supabase = await createAdminClient();
  // Keep localeSuffix for blog_posts and procedures tables which still use old column format
  const localeSuffix = locale.replace('-', '_').toLowerCase();

  // Fetch hospital from DB (include draft for testing, published for production)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hospitalData, error } = await (supabase.from('hospitals') as any)
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'draft'])  // Allow draft for testing
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
      name: fallbackHospital.name,
      description: fallbackHospital.description,
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
        locale={locale as Locale}
      />
    );
  }

  // Get related blog posts based on hospital category/specialties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: relatedBlogData } = await (supabase.from('blog_posts') as any)
    .select('id, slug, title_en, excerpt_en, category, cover_image_url, published_at, view_count')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(6);

  // Filter and transform blog posts to match hospital category/specialties
  const relatedBlogPosts = (relatedBlogData || [])
    .filter((post: Record<string, unknown>) => {
      // Match by category or specialty keywords
      const postCategory = (post.category as string)?.toLowerCase() || '';
      const hospitalCategory = hospitalData.category?.toLowerCase() || '';
      const hospitalSpecialties = (hospitalData.specialties || []).map((s: string) => s.toLowerCase());

      // Check if categories match or specialties are mentioned
      if (postCategory.includes(hospitalCategory) || hospitalCategory.includes(postCategory)) {
        return true;
      }

      return hospitalSpecialties.some((spec: string) =>
        postCategory.includes(spec) || spec.includes(postCategory)
      );
    })
    .slice(0, 3)
    .map((post: Record<string, unknown>) => ({
      id: post.id as string,
      slug: post.slug as string,
      title: (post[`title_${localeSuffix}`] || post.title_en) as string,
      excerpt: (post[`excerpt_${localeSuffix}`] || post.excerpt_en) as string | null,
      category: post.category as string,
      featured_image: post.cover_image_url as string | null,
      published_at: post.published_at as string | null,
      view_count: (post.view_count || 0) as number,
    }));

  // If not enough related posts, just get the latest ones
  const finalBlogPosts = relatedBlogPosts.length >= 2
    ? relatedBlogPosts
    : (relatedBlogData || []).slice(0, 3).map((post: Record<string, unknown>) => ({
        id: post.id as string,
        slug: post.slug as string,
        title: (post[`title_${localeSuffix}`] || post.title_en) as string,
        excerpt: (post[`excerpt_${localeSuffix}`] || post.excerpt_en) as string | null,
        category: post.category as string,
        featured_image: post.cover_image_url as string | null,
        published_at: post.published_at as string | null,
        view_count: (post.view_count || 0) as number,
      }));

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

  // Use Google Photos as gallery if available
  const galleryImages = hospitalData.google_photos?.length > 0
    ? hospitalData.google_photos
    : hospitalData.gallery || [];

  // Get localized name and description from JSONB fields
  const nameJson = hospitalData.name as Record<string, string> | null;
  const descJson = hospitalData.description as Record<string, string> | null;

  // Get localized name - use current locale, fallback to English, then Korean
  const hospitalName = getLocalizedValue(nameJson, locale);

  // Keep both names for display purposes
  const nameKo = nameJson?.ko || '';
  const nameEn = nameJson?.en || '';

  const hospital = {
    id: hospitalData.id,
    slug: hospitalData.slug,
    name: hospitalName,
    name_ko: nameKo,
    name_en: nameEn,
    description: getLocalizedValue(descJson, locale),
    logo_url: hospitalData.logo_url,
    cover_image_url: galleryImages[0] || hospitalData.cover_image_url,
    gallery: galleryImages,
    address: hospitalData.address,
    city: hospitalData.city,
    district: hospitalData.district,
    phone: hospitalData.phone,
    email: hospitalData.email,
    website: hospitalData.website,
    specialties: hospitalData.specialties || [],
    languages: hospitalData.languages || ['Korean', 'English'],
    certifications: hospitalData.certifications || [],
    has_cctv: hospitalData.has_cctv,
    has_female_doctor: hospitalData.has_female_doctor,
    avg_rating: hospitalData.avg_rating || 4.5,
    review_count: hospitalData.review_count || 0,
    is_featured: hospitalData.is_featured,
    is_verified: hospitalData.is_verified,
    // Google Places specific data
    google_maps_url: hospitalData.google_maps_url,
    google_place_id: hospitalData.google_place_id,
    opening_hours: hospitalData.opening_hours || [],
    latitude: hospitalData.latitude,
    longitude: hospitalData.longitude,
    category: hospitalData.category,
    source: hospitalData.source,
    // Use JSONB ai_summary
    ai_summary: (() => {
      const aiSummaryJson = hospitalData.ai_summary as Record<string, string> | null;
      return getLocalizedValue(aiSummaryJson, locale);
    })(),
    // Crawl info
    crawled_at: hospitalData.crawled_at,
    // Google reviews
    google_reviews: hospitalData.google_reviews || [],
  };

  return (
    <HospitalDetailClient
      hospital={hospital}
      relatedBlogPosts={finalBlogPosts}
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
    name: name, // Already localized for fallback
    description: description,
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
