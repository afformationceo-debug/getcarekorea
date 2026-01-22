import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { InterpreterDetailClient } from './InterpreterDetailClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function InterpreterDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Mock interpreter data - in production, fetch from Supabase
  const interpreter = await getInterpreter(id);

  if (!interpreter) {
    notFound();
  }

  // Mock reviews data
  const reviews = [
    {
      id: '1',
      author: 'Emily W.',
      rating: 5,
      date: 'January 18, 2024',
      content: 'Sarah was absolutely amazing! She made my rhinoplasty consultation so much easier. Her medical knowledge and warm personality put me at ease throughout the entire process.',
      procedure: 'Rhinoplasty',
      hospital: 'Grand Plastic Surgery',
    },
    {
      id: '2',
      author: 'Michael C.',
      rating: 5,
      date: 'January 10, 2024',
      content: 'Professional and punctual. She translated everything accurately and even helped me understand the aftercare instructions. Highly recommend!',
      procedure: 'Facial Contouring',
      hospital: 'Seoul Beauty Clinic',
    },
    {
      id: '3',
      author: 'Lisa T.',
      rating: 5,
      date: 'December 28, 2023',
      content: 'Could not have asked for a better interpreter. She was patient, knowledgeable, and went above and beyond to ensure I was comfortable.',
      procedure: 'Health Checkup',
      hospital: 'Seoul Wellness Clinic',
    },
    {
      id: '4',
      author: 'David K.',
      rating: 4,
      date: 'December 15, 2023',
      content: 'Great service overall. Very professional and helpful with navigating the hospital system. Only minor issue was scheduling, but she was flexible.',
      procedure: 'Dental Implants',
      hospital: 'Smile Dental Korea',
    },
  ];

  return (
    <InterpreterDetailClient
      interpreter={interpreter}
      reviews={reviews}
      locale={locale as Locale}
    />
  );
}

async function getInterpreter(id: string) {
  const interpreters: Record<string, ReturnType<typeof createMockInterpreter>> = {
    '1': createMockInterpreter(
      '1',
      'Sarah Kim',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      [
        { code: 'en', name: 'English', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'native' },
        { code: 'zh', name: 'Chinese', level: 'fluent' },
      ],
      ['Plastic Surgery', 'Dermatology'],
      'Experienced medical interpreter with 8+ years of experience in Korean healthcare. I specialize in plastic surgery and dermatology translations, ensuring clear communication between patients and doctors for the best medical outcomes. My background includes working with major hospitals in Gangnam and I am committed to providing personalized support throughout your medical journey.',
      50,
      350,
      4.9,
      156,
      423,
      8,
      'Seoul, Gangnam',
      'Seoul National University - Healthcare Interpretation',
      ['NAATI Certified', 'Medical Interpreter Certificate (KHA)']
    ),
    '2': createMockInterpreter(
      '2',
      'Yuki Tanaka',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      [
        { code: 'ja', name: 'Japanese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      ['Health Checkup', 'General Medical'],
      'Bilingual Japanese-Korean interpreter with a medical background. Certified in healthcare interpretation with a focus on preventive medicine. I have been helping Japanese patients navigate the Korean medical system since 2018, with particular expertise in comprehensive health checkups and general medical consultations.',
      60,
      400,
      4.8,
      89,
      201,
      6,
      'Seoul, Myeongdong',
      'Yonsei University - Medical Translation',
      ['Japanese Medical Interpreter Certification', 'JMIP Certified']
    ),
    '3': createMockInterpreter(
      '3',
      'Ploy Suwannapong',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      [
        { code: 'th', name: 'Thai', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      ['Plastic Surgery', 'Dental'],
      'Thai-Korean medical interpreter with 5 years of experience. I am passionate about helping Thai patients navigate their medical journey in Korea. My expertise lies in dental and plastic surgery terminology, and I take pride in making patients feel comfortable and informed throughout their treatment.',
      45,
      300,
      4.7,
      67,
      145,
      5,
      'Seoul, Gangnam',
      'Chulalongkorn University - Korean Studies',
      ['Medical Interpreter Certificate (KHA)', 'Thai Language Proficiency']
    ),
    '4': createMockInterpreter(
      '4',
      'Alex Wang',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      [
        { code: 'zh', name: 'Chinese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'native' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      ['Fertility', 'Gynecology', 'Health Checkup'],
      'Specialized in fertility and gynecology medical interpretation. Native Chinese speaker with Korean dual citizenship. I have dedicated my career to helping Chinese couples achieve their dreams of parenthood in Korea. My sensitivity and understanding of the emotional aspects of fertility treatments set me apart.',
      70,
      450,
      4.9,
      112,
      287,
      10,
      'Seoul, Jamsil',
      'Korea University - Healthcare Administration',
      ['Certified Healthcare Interpreter', 'Fertility Treatment Specialist']
    ),
    '5': createMockInterpreter(
      '5',
      'Maria Ivanova',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      [
        { code: 'ru', name: 'Russian', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      ['Plastic Surgery', 'Hair Transplant'],
      'Russian medical interpreter specializing in cosmetic procedures. Former nurse with a deep understanding of medical terminology. I ensure Russian-speaking patients feel comfortable and informed throughout their treatment, providing detailed explanations and emotional support.',
      55,
      380,
      4.8,
      78,
      165,
      7,
      'Seoul, Sinsa',
      'Moscow State University - Medical Translation',
      ['Nursing License (Russia)', 'Medical Interpreter Certificate (KHA)']
    ),
    '6': createMockInterpreter(
      '6',
      'Nguyen Minh',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      [
        { code: 'vi', name: 'Vietnamese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'conversational' },
      ],
      ['Dental', 'Ophthalmology'],
      'Vietnamese-Korean interpreter focused on dental and eye care treatments. Graduate of Seoul National University with a healthcare management degree. I am dedicated to providing seamless communication for Vietnamese patients, making their medical experience in Korea stress-free.',
      40,
      280,
      4.6,
      45,
      98,
      4,
      'Seoul, Hongdae',
      'Seoul National University - Healthcare Management',
      ['Vietnamese Medical Interpreter Certification', 'Dental Terminology Specialist']
    ),
    '7': createMockInterpreter(
      '7',
      'Bataa Boldbaatar',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      [
        { code: 'mn', name: 'Mongolian', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'conversational' },
      ],
      ['Health Checkup', 'Orthopedics'],
      'Mongolian medical interpreter with extensive experience in health checkups and orthopedic procedures. Having lived in Korea for 12 years, I have a deep cultural understanding of both countries, which helps me bridge communication gaps effectively.',
      45,
      320,
      4.7,
      34,
      76,
      6,
      'Seoul, Itaewon',
      'Mongolian State University - Korean Language',
      ['Medical Interpreter Certificate (KHA)', 'Orthopedic Terminology Specialist']
    ),
    '8': createMockInterpreter(
      '8',
      'Jennifer Chen',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      [
        { code: 'zh-tw', name: 'Chinese (Traditional)', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'native' },
        { code: 'ja', name: 'Japanese', level: 'conversational' },
      ],
      ['Plastic Surgery', 'Dermatology', 'Anti-aging'],
      'Taiwanese-American interpreter specializing in aesthetic medicine. MBA from Yonsei University. Fluent in 4 languages with expertise in luxury medical tourism services. I provide VIP-level service for discerning clients seeking the best cosmetic procedures in Korea.',
      80,
      500,
      5.0,
      203,
      512,
      12,
      'Seoul, Cheongdam',
      'Yonsei University - MBA',
      ['Certified Healthcare Interpreter', 'Luxury Medical Tourism Specialist', 'NAATI Certified']
    ),
  };

  return interpreters[id] || null;
}

function createMockInterpreter(
  id: string,
  name: string,
  photo_url: string,
  languages: Array<{ code: string; name: string; level: string }>,
  specialties: string[],
  bio: string,
  hourly_rate: number,
  daily_rate: number,
  avg_rating: number,
  review_count: number,
  total_bookings: number,
  experience_years: number,
  location: string,
  education: string,
  certifications: string[]
) {
  return {
    id,
    name,
    photo_url,
    languages,
    specialties,
    bio,
    hourly_rate,
    daily_rate,
    avg_rating,
    review_count,
    total_bookings,
    is_verified: true,
    is_available: id !== '3' && id !== '7', // Some unavailable for realism
    video_url: ['1', '3', '4', '6', '8'].includes(id) ? 'https://youtube.com/example' : null,
    experience_years,
    location,
    education,
    certifications,
    services: [
      'Medical Consultation Interpretation',
      'Surgery Accompaniment',
      'Hospital Coordination',
      'Post-operative Care Support',
      'Document Translation',
      'Pharmacy Assistance',
      'Follow-up Appointment Scheduling',
      'Emergency Support',
    ],
    availability: {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [{ start: '09:00', end: '18:00' }],
      wednesday: [{ start: '09:00', end: '18:00' }],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [{ start: '10:00', end: '15:00' }],
    },
  };
}
