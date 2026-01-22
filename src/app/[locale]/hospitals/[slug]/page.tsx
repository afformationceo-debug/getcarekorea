import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { HospitalDetailClient } from './HospitalDetailClient';
import { getLocalizedContent, type Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function HospitalDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Mock hospital data - in production, fetch from Supabase
  const hospitalData = await getHospital(slug);

  if (!hospitalData) {
    notFound();
  }

  const name = getLocalizedContent(hospitalData, 'name', locale as Locale);
  const description = getLocalizedContent(hospitalData, 'description', locale as Locale);

  // Transform to client-friendly format
  const hospital = {
    id: hospitalData.id,
    slug: hospitalData.slug,
    name,
    description,
    logo_url: hospitalData.logo_url,
    cover_image_url: hospitalData.cover_image_url,
    gallery: hospitalData.gallery,
    address: hospitalData.address,
    city: hospitalData.city,
    phone: hospitalData.phone,
    email: hospitalData.email,
    website: hospitalData.website,
    specialties: hospitalData.specialties,
    languages: hospitalData.languages,
    certifications: hospitalData.certifications,
    has_cctv: hospitalData.has_cctv,
    has_female_doctor: hospitalData.has_female_doctor,
    avg_rating: hospitalData.avg_rating,
    review_count: hospitalData.review_count,
    is_featured: hospitalData.is_featured,
    is_verified: hospitalData.is_verified,
  };

  // Mock doctors data
  const doctors = [
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
    {
      id: '4',
      name: 'Dr. Choi Yuna',
      title: 'Consultant',
      specialty: 'Dermatology',
      experience: 8,
      image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
      procedures: 1500,
      rating: 4.7,
    },
  ];

  // Mock procedures data
  const procedures = [
    {
      id: '1',
      name: 'Rhinoplasty (Nose Job)',
      price: '$2,500 - $5,000',
      duration: '1-3 hours',
      recovery: '1-2 weeks',
      description: 'Reshape your nose to achieve natural-looking results with our advanced techniques. Includes consultation, surgery, and follow-up care.',
    },
    {
      id: '2',
      name: 'Facial Contouring',
      price: '$4,000 - $8,000',
      duration: '2-4 hours',
      recovery: '2-3 weeks',
      description: 'V-line surgery, jaw reduction, and cheekbone reduction for a slimmer, more defined facial structure.',
    },
    {
      id: '3',
      name: 'Double Eyelid Surgery',
      price: '$1,500 - $3,000',
      duration: '1-2 hours',
      recovery: '1 week',
      description: 'Create natural-looking double eyelids with minimal scarring. Both incisional and non-incisional methods available.',
    },
    {
      id: '4',
      name: 'Lip Filler',
      price: '$500 - $1,200',
      duration: '30 mins',
      recovery: '2-3 days',
      description: 'Enhance lip volume and shape with premium hyaluronic acid fillers. Natural-looking results.',
    },
    {
      id: '5',
      name: 'Botox Treatment',
      price: '$300 - $800',
      duration: '15-30 mins',
      recovery: 'Same day',
      description: 'Reduce wrinkles and fine lines with premium botulinum toxin. Face, neck, and body treatments available.',
    },
  ];

  // Mock reviews data
  const reviews = [
    {
      id: '1',
      author: 'Sarah M.',
      rating: 5,
      date: 'January 15, 2024',
      content: 'Amazing experience! The staff was incredibly professional and the results exceeded my expectations. Dr. Kim took the time to understand exactly what I wanted and delivered perfectly. The recovery was smooth with great follow-up care.',
      procedure: 'Rhinoplasty',
      verified: true,
    },
    {
      id: '2',
      author: 'James L.',
      rating: 5,
      date: 'January 10, 2024',
      content: 'World-class facility with cutting-edge technology. The interpreter service was invaluable - made the whole process so much easier. Would highly recommend to anyone considering medical tourism in Korea.',
      procedure: 'Health Checkup',
      verified: true,
    },
    {
      id: '3',
      author: 'Emma T.',
      rating: 4,
      date: 'December 28, 2023',
      content: 'Great results from my double eyelid surgery. The doctor was very experienced and the clinic was spotlessly clean. Only minor issue was waiting time, but the results made it worth it.',
      procedure: 'Double Eyelid',
      verified: true,
    },
    {
      id: '4',
      author: 'Michael K.',
      rating: 5,
      date: 'December 15, 2023',
      content: 'Came from Singapore for facial contouring. The transformation is incredible! The team took care of everything from airport pickup to hotel recommendations. Can\'t thank them enough.',
      procedure: 'Facial Contouring',
      verified: true,
    },
  ];

  return (
    <HospitalDetailClient
      hospital={hospital}
      doctors={doctors}
      procedures={procedures}
      reviews={reviews}
      locale={locale as Locale}
    />
  );
}

// Mock function to get hospital data
async function getHospital(slug: string) {
  // In production, fetch from Supabase
  const hospitals: Record<string, ReturnType<typeof createMockHospital>> = {
    'grand-plastic-surgery': createMockHospital(
      '1',
      'grand-plastic-surgery',
      'Grand Plastic Surgery',
      'Premier plastic surgery clinic in Gangnam, Seoul. Specializing in facial contouring, rhinoplasty, and body contouring procedures with over 20 years of experience. Our team of board-certified surgeons has performed over 50,000 successful procedures with a 99.5% patient satisfaction rate.',
      ['Plastic Surgery', 'Dermatology', 'Anti-aging'],
      ['JCI', 'KFDA'],
      4.9,
      1250,
      [
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800&h=600&fit=crop',
      ]
    ),
    'seoul-wellness-clinic': createMockHospital(
      '2',
      'seoul-wellness-clinic',
      'Seoul Wellness Clinic',
      'Comprehensive health checkup center offering premium screening packages with the latest medical technology and experienced physicians. We provide VIP health examinations, cancer screenings, and personalized wellness programs.',
      ['Health Checkup', 'Internal Medicine', 'Cardiology'],
      ['JCI', 'KHA'],
      4.8,
      890,
      [
        'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&h=600&fit=crop',
      ]
    ),
    'smile-dental-korea': createMockHospital(
      '3',
      'smile-dental-korea',
      'Smile Dental Korea',
      'Award-winning dental clinic specializing in implants, veneers, and orthodontics. State-of-the-art equipment and bilingual staff ensure a comfortable experience for international patients.',
      ['Dental', 'Orthodontics', 'Implants'],
      ['JCI'],
      4.9,
      2100,
      [
        'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&h=600&fit=crop',
      ]
    ),
    'gangnam-eye-center': createMockHospital(
      '4',
      'gangnam-eye-center',
      'Gangnam Eye Center',
      'Leading LASIK and vision correction center with over 50,000 successful procedures. Advanced laser technology and experienced ophthalmologists provide safe, effective treatments.',
      ['Ophthalmology', 'LASIK', 'Cataract Surgery'],
      ['JCI'],
      4.8,
      1500,
      [
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop',
      ]
    ),
    'hair-revival-clinic': createMockHospital(
      '5',
      'hair-revival-clinic',
      'Hair Revival Clinic',
      'Specialized hair transplant center using FUE and DHI techniques. Natural-looking results with minimal downtime. Over 10,000 successful procedures performed.',
      ['Hair Transplant', 'Dermatology'],
      ['KHA'],
      4.7,
      680,
      [
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=600&fit=crop',
      ]
    ),
    'seoul-fertility-center': createMockHospital(
      '6',
      'seoul-fertility-center',
      'Seoul Fertility Center',
      'Premier fertility clinic offering IVF, egg freezing, and comprehensive reproductive health services with high success rates. Our compassionate team supports you through every step of your journey.',
      ['Fertility', 'Gynecology', 'IVF'],
      ['JCI'],
      4.9,
      450,
      [
        'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      ]
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
    name_zh_tw: name,
    name_zh_cn: name,
    name_ja: name,
    name_th: name,
    name_mn: name,
    name_ru: name,
    description_en: description,
    description_zh_tw: description,
    description_zh_cn: description,
    description_ja: description,
    description_th: description,
    description_mn: description,
    description_ru: description,
    logo_url: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop`,
    cover_image_url: `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=800&fit=crop`,
    gallery,
    address: '123 Gangnam-daero, Gangnam-gu',
    city: 'Seoul',
    latitude: null,
    longitude: null,
    phone: '+82-2-1234-5678',
    email: 'contact@hospital.com',
    website: 'https://hospital.com',
    specialties,
    languages: ['English', 'Chinese', 'Japanese', 'Korean'],
    certifications,
    has_cctv: true,
    has_female_doctor: true,
    operating_hours: {},
    avg_rating: rating,
    review_count: reviews,
    is_featured: true,
    is_verified: true,
    status: 'published' as const,
    admin_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
