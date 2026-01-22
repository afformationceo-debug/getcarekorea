import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { InterpretersPageClient } from './InterpretersPageClient';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InterpretersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Mock data - in production, fetch from Supabase
  const interpreters = [
    {
      id: '1',
      name: 'Sarah Kim',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
      languages: [
        { code: 'en', name: 'English', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'native' },
        { code: 'zh', name: 'Chinese', level: 'fluent' },
      ],
      specialties: ['Plastic Surgery', 'Dermatology'],
      bio: 'Experienced medical interpreter with 8+ years of experience in Korean healthcare. Specializing in plastic surgery and dermatology translations. I ensure clear communication between patients and doctors for the best medical outcomes.',
      hourly_rate: 50,
      daily_rate: 350,
      avg_rating: 4.9,
      review_count: 156,
      total_bookings: 423,
      is_verified: true,
      is_available: true,
      video_url: 'https://youtube.com/example',
      experience_years: 8,
      location: 'Seoul, Gangnam',
    },
    {
      id: '2',
      name: 'Yuki Tanaka',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      languages: [
        { code: 'ja', name: 'Japanese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      specialties: ['Health Checkup', 'General Medical'],
      bio: 'Bilingual Japanese-Korean interpreter with medical background. Certified in healthcare interpretation with focus on preventive medicine. Helping Japanese patients navigate Korean medical system since 2018.',
      hourly_rate: 60,
      daily_rate: 400,
      avg_rating: 4.8,
      review_count: 89,
      total_bookings: 201,
      is_verified: true,
      is_available: true,
      video_url: null,
      experience_years: 6,
      location: 'Seoul, Myeongdong',
    },
    {
      id: '3',
      name: 'Ploy Suwannapong',
      photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      languages: [
        { code: 'th', name: 'Thai', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      specialties: ['Plastic Surgery', 'Dental'],
      bio: 'Thai-Korean medical interpreter with 5 years of experience. Passionate about helping Thai patients navigate their medical journey in Korea. Expert in dental and plastic surgery terminology.',
      hourly_rate: 45,
      daily_rate: 300,
      avg_rating: 4.7,
      review_count: 67,
      total_bookings: 145,
      is_verified: true,
      is_available: false,
      video_url: 'https://youtube.com/example',
      experience_years: 5,
      location: 'Seoul, Gangnam',
    },
    {
      id: '4',
      name: 'Alex Wang',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      languages: [
        { code: 'zh', name: 'Chinese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'native' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      specialties: ['Fertility', 'Gynecology', 'Health Checkup'],
      bio: 'Specialized in fertility and gynecology medical interpretation. Native Chinese speaker with Korean dual citizenship. Helping Chinese couples achieve their dreams of parenthood in Korea.',
      hourly_rate: 70,
      daily_rate: 450,
      avg_rating: 4.9,
      review_count: 112,
      total_bookings: 287,
      is_verified: true,
      is_available: true,
      video_url: 'https://youtube.com/example',
      experience_years: 10,
      location: 'Seoul, Jamsil',
    },
    {
      id: '5',
      name: 'Maria Ivanova',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      languages: [
        { code: 'ru', name: 'Russian', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'fluent' },
      ],
      specialties: ['Plastic Surgery', 'Hair Transplant'],
      bio: 'Russian medical interpreter specializing in cosmetic procedures. Former nurse with deep understanding of medical terminology. Ensuring Russian-speaking patients feel comfortable and informed throughout their treatment.',
      hourly_rate: 55,
      daily_rate: 380,
      avg_rating: 4.8,
      review_count: 78,
      total_bookings: 165,
      is_verified: true,
      is_available: true,
      video_url: null,
      experience_years: 7,
      location: 'Seoul, Sinsa',
    },
    {
      id: '6',
      name: 'Nguyen Minh',
      photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      languages: [
        { code: 'vi', name: 'Vietnamese', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'conversational' },
      ],
      specialties: ['Dental', 'Ophthalmology'],
      bio: 'Vietnamese-Korean interpreter focused on dental and eye care treatments. Graduate of Seoul National University with healthcare management degree. Dedicated to providing seamless communication for Vietnamese patients.',
      hourly_rate: 40,
      daily_rate: 280,
      avg_rating: 4.6,
      review_count: 45,
      total_bookings: 98,
      is_verified: true,
      is_available: true,
      video_url: 'https://youtube.com/example',
      experience_years: 4,
      location: 'Seoul, Hongdae',
    },
    {
      id: '7',
      name: 'Bataa Boldbaatar',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      languages: [
        { code: 'mn', name: 'Mongolian', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'conversational' },
      ],
      specialties: ['Health Checkup', 'Orthopedics'],
      bio: 'Mongolian medical interpreter with extensive experience in health checkups and orthopedic procedures. Living in Korea for 12 years with deep cultural understanding of both countries.',
      hourly_rate: 45,
      daily_rate: 320,
      avg_rating: 4.7,
      review_count: 34,
      total_bookings: 76,
      is_verified: true,
      is_available: false,
      video_url: null,
      experience_years: 6,
      location: 'Seoul, Itaewon',
    },
    {
      id: '8',
      name: 'Jennifer Chen',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      languages: [
        { code: 'zh-tw', name: 'Chinese (Traditional)', level: 'native' },
        { code: 'ko', name: 'Korean', level: 'fluent' },
        { code: 'en', name: 'English', level: 'native' },
        { code: 'ja', name: 'Japanese', level: 'conversational' },
      ],
      specialties: ['Plastic Surgery', 'Dermatology', 'Anti-aging'],
      bio: 'Taiwanese-American interpreter specializing in aesthetic medicine. MBA from Yonsei University. Fluent in 4 languages with expertise in luxury medical tourism services.',
      hourly_rate: 80,
      daily_rate: 500,
      avg_rating: 5.0,
      review_count: 203,
      total_bookings: 512,
      is_verified: true,
      is_available: true,
      video_url: 'https://youtube.com/example',
      experience_years: 12,
      location: 'Seoul, Cheongdam',
    },
  ];

  return (
    <Suspense fallback={<InterpretersPageSkeleton />}>
      <InterpretersPageClient interpreters={interpreters} locale={locale as Locale} />
    </Suspense>
  );
}

function InterpretersPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-12">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mb-8 h-12 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[400px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
