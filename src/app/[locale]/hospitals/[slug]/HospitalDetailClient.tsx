'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Languages,
  BadgeCheck,
  Cctv,
  User,
  ChevronRight,
  ChevronLeft,
  Heart,
  MessageCircle,
  Calendar,
  Award,
  Shield,
  Sparkles,
  Play,
  Check,
  ArrowRight,
  Timer,
  Stethoscope,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PhotoCarousel, CarouselPhoto } from '@/components/ui/photo-carousel';
import { getCTAForLocale, CTAConfig } from '@/lib/settings/cta';
import type { Locale } from '@/lib/i18n/config';

interface GoogleReview {
  author: string;
  rating: number;
  content: string;
  date?: string;
  response?: string;
}

interface Hospital {
  id: string;
  slug: string;
  name: string;
  name_ko?: string;
  name_en?: string;
  description: string;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery: string[];
  address: string;
  city: string;
  district?: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  specialties: string[];
  languages: string[];
  certifications: string[];
  has_cctv: boolean;
  has_female_doctor: boolean;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  is_verified: boolean;
  // Google Places specific data
  google_maps_url?: string;
  google_place_id?: string;
  google_reviews?: GoogleReview[];  // Actual reviews from Google
  opening_hours?: string[];
  latitude?: number;
  longitude?: number;
  category?: string;
  source?: string;
  ai_summary?: string;
  // SEO meta
  meta_title?: string;
  meta_description?: string;
  crawled_at?: string;
}

interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: number;
  image: string;
  procedures: number;
  rating: number;
}

interface Procedure {
  id: string;
  name: string;
  price: string;
  duration: string;
  recovery: string;
  description: string;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  procedure: string;
  images?: string[];
  verified: boolean;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  featured_image: string | null;
  published_at: string | null;
  view_count: number;
}

interface HospitalDetailClientProps {
  hospital: Hospital;
  relatedBlogPosts?: BlogPost[];
  locale: Locale;
}

// Generate Schema.org JSON-LD markup for SEO
function generateSchemaMarkup(hospital: Hospital, locale: Locale) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://getcarekorea.com';

  // MedicalOrganization schema
  const medicalOrgSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    '@id': `${baseUrl}/${locale}/hospitals/${hospital.slug}`,
    name: hospital.name,
    alternateName: hospital.name_ko || hospital.name,
    description: hospital.description,
    url: `${baseUrl}/${locale}/hospitals/${hospital.slug}`,
    logo: hospital.logo_url,
    image: hospital.cover_image_url || hospital.gallery?.[0],
    telephone: hospital.phone,
    email: hospital.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hospital.address,
      addressLocality: hospital.district || hospital.city,
      addressRegion: hospital.city,
      addressCountry: 'KR',
    },
    geo: hospital.latitude && hospital.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    } : undefined,
    aggregateRating: hospital.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: hospital.avg_rating.toFixed(1),
      reviewCount: hospital.review_count,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
    medicalSpecialty: hospital.specialties?.map(s => ({
      '@type': 'MedicalSpecialty',
      name: s,
    })),
    availableLanguage: hospital.languages?.map(lang => ({
      '@type': 'Language',
      name: lang,
    })),
    hasCredential: hospital.certifications?.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: cert,
    })),
    sameAs: [
      hospital.website,
      hospital.google_maps_url,
    ].filter(Boolean),
    priceRange: '$$-$$$$',
    currenciesAccepted: 'KRW, USD',
    paymentAccepted: 'Cash, Credit Card',
  };

  // BreadcrumbList schema
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
      {
        '@type': 'ListItem',
        position: 3,
        name: hospital.name,
        item: `${baseUrl}/${locale}/hospitals/${hospital.slug}`,
      },
    ],
  };

  return [medicalOrgSchema, breadcrumbSchema];
}

export function HospitalDetailClient({
  hospital,
  relatedBlogPosts = [],
  locale,
}: HospitalDetailClientProps) {
  const t = useTranslations('hospitals');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const [activeTab, setActiveTab] = useState('overview');
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | null>(null);

  // Fetch CTA config for current locale
  useEffect(() => {
    getCTAForLocale(locale).then(setCtaConfig);
  }, [locale]);

  // External CTA link (WhatsApp/Line/Kakao/Telegram)
  const externalCtaLink = ctaConfig?.url || '/contact';

  // Convert images to CarouselPhoto format
  const carouselPhotos: CarouselPhoto[] = [
    hospital.cover_image_url,
    ...hospital.gallery,
  ].filter(Boolean).map((url, index) => ({
    id: `photo-${index}`,
    image_url: url as string,
    alt: `${hospital.name} - Photo ${index + 1}`,
  }));

  // Generate schema markup
  const schemaMarkup = generateSchemaMarkup(hospital, locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* JSON-LD Schema.org markup for SEO */}
      <Script
        id="hospital-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaMarkup),
        }}
      />
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-background/80 backdrop-blur-sm"
      >
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
            <Link href="/" className="hover:text-foreground transition-colors shrink-0">
              {tNav('home')}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link href="/hospitals" className="hover:text-foreground transition-colors shrink-0">
              {tNav('hospitals')}
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground truncate">{hospital.name}</span>
          </nav>
        </div>
      </motion.div>

      {/* Hero Section with Gallery */}
      {/* Option 2: 블러 배경 (인스타그램 스타일) */}
      <section className="relative">
        {carouselPhotos.length > 0 ? (
          <PhotoCarousel
            photos={carouselPhotos}
            height="md"
            objectFit="blur"
            showLightbox={true}
            showArrows={true}
            showDots={true}
            loop={true}
            activeDotColor="bg-primary"
          />
        ) : (
          <div className="flex h-[300px] sm:h-[400px] md:h-[500px] w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">{t('detail.noImageAvailable')}</span>
          </div>
        )}
      </section>

      {/* Hospital Info Section */}
      <section className="border-b bg-background">
        <div className="container py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {hospital.logo_url && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="relative h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-xl sm:rounded-2xl border-2 bg-white shadow-lg shrink-0"
                >
                  <Image
                    src={hospital.logo_url}
                    alt={`${hospital.name} logo`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </motion.div>
              )}
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-1 sm:mb-2 flex flex-wrap gap-1.5 sm:gap-2"
                >
                  {hospital.is_featured && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-xs">
                      <Sparkles className="mr-1 h-3 w-3" />
                      {t('badges.featured')}
                    </Badge>
                  )}
                  {hospital.certifications.includes('JCI') && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-xs">
                      <Award className="mr-1 h-3 w-3" />
                      {t('badges.jci')}
                    </Badge>
                  )}
                  {hospital.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      {t('badges.verified')}
                    </Badge>
                  )}
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl sm:text-3xl lg:text-4xl font-bold"
                >
                  {hospital.name}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    {hospital.city}{hospital.district ? `, ${hospital.district}` : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{hospital.avg_rating.toFixed(1)}</span>
                    <span className="hidden sm:inline">({hospital.review_count} reviews)</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    {hospital.languages.slice(0, 3).join(', ')}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-8 pb-28 lg:pb-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto flex-wrap">
                  {['overview', 'reviews'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="relative rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                    >
                      {tab === 'overview' ? t('detail.overview') : t('detail.reviewsCount', { count: hospital.review_count })}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="mt-8">
                  <OverviewSection hospital={hospital} locale={locale} relatedBlogPosts={relatedBlogPosts} />
                </TabsContent>

                <TabsContent value="reviews" className="mt-8">
                  <ReviewsSection hospital={hospital} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarSection hospital={hospital} locale={locale} />
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom CTA Bar */}
      <MobileBottomCTA hospital={hospital} locale={locale} />
    </div>
  );
}

function OverviewSection({ hospital, locale, relatedBlogPosts = [] }: { hospital: Hospital; locale: Locale; relatedBlogPosts?: BlogPost[] }) {
  const t = useTranslations('hospitals');
  const tBlog = useTranslations('blog');
  const [showAllImages, setShowAllImages] = useState(false);
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | null>(null);
  const displayImages = showAllImages ? hospital.gallery : hospital.gallery.slice(0, 6);

  useEffect(() => {
    getCTAForLocale(locale).then(setCtaConfig);
  }, [locale]);

  const externalCtaLink = ctaConfig?.url || '/contact';

  // Format category for display using translations
  const formatCategory = (cat?: string) => {
    if (!cat) return null;
    const key = `detail.categoryTypes.${cat}` as const;
    const translated = t(key as Parameters<typeof t>[0]);
    // If translation key doesn't exist, fallback to formatted string
    if (translated === key) {
      return cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return translated;
  };

  // Known specialty keys for translation
  const knownSpecialtyKeys = [
    'plastic-surgery', 'dermatology', 'dental', 'ophthalmology',
    'hair-transplant', 'health-checkup', 'fertility', 'all'
  ];

  // Helper to translate specialty names
  const getSpecialtyName = (specialty: string) => {
    const key = specialty.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (knownSpecialtyKeys.includes(key)) {
      return t(`listing.specialties.${key}` as Parameters<typeof t>[0]);
    }
    return specialty;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* AI Summary Section (if available) */}
      {hospital.ai_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg border-l-4 border-l-primary">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('detail.aiSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed italic">
                &ldquo;{hospital.ai_summary}&rdquo;
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* About This Hospital - Enhanced & Extended */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {t('detail.aboutHospital', { name: hospital.name })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Main Description */}
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed text-base">{hospital.description}</p>

              {/* Hospital Info Summary */}
              <div className="flex flex-wrap gap-4 pt-2">
                {hospital.category && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{formatCategory(hospital.category)}</span>
                  </div>
                )}
                {hospital.district && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{hospital.district}, {hospital.city}</span>
                  </div>
                )}
                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span>{hospital.specialties.slice(0, 3).map(s => getSpecialtyName(s)).join(', ')}</span>
                  </div>
                )}
                {hospital.languages && hospital.languages.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Languages className="h-4 w-4 text-primary" />
                    <span>{hospital.languages.slice(0, 4).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Quick Facts - Enhanced Grid */}
            <div>
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('detail.quickFacts')}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {hospital.category && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{t('detail.type')}</p>
                      <p className="font-medium text-sm truncate">{formatCategory(hospital.category)}</p>
                    </div>
                  </div>
                )}
                {hospital.district && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{t('detail.location')}</p>
                      <p className="font-medium text-sm truncate">{hospital.district}</p>
                    </div>
                  </div>
                )}
                {hospital.avg_rating > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{t('detail.rating')}</p>
                      <p className="font-medium text-sm">{hospital.avg_rating.toFixed(1)} ({hospital.review_count})</p>
                    </div>
                  </div>
                )}
                {hospital.source === 'google_places' && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <BadgeCheck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">{t('detail.verified')}</p>
                      <p className="font-medium text-sm">{t('detail.googleVerified')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hospital Highlights */}
            <div className="pt-2">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                {t('detail.whyPatientsChoose', { name: hospital.name })}
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {hospital.avg_rating >= 4.5 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">{t('detail.highlyRated')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.highlyRatedDesc', { rating: hospital.avg_rating.toFixed(1), count: hospital.review_count.toLocaleString() })}</p>
                    </div>
                  </div>
                )}
                {hospital.certifications.includes('JCI') && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">{t('detail.jciAccredited')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.jciAccreditedDesc')}</p>
                    </div>
                  </div>
                )}
                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Stethoscope className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-violet-700 dark:text-violet-400">{t('detail.expertSpecialists')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.expertSpecialistsDesc', { specialty: hospital.specialties[0] })}</p>
                    </div>
                  </div>
                )}
                {hospital.languages && hospital.languages.length >= 2 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Languages className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">{t('detail.multilingualSupport')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.multilingualSupportDesc', { count: hospital.languages.length })}</p>
                    </div>
                  </div>
                )}
                {hospital.has_cctv && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-green-700 dark:text-green-400">{t('detail.safetyFirst')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.safetyFirstDesc')}</p>
                    </div>
                  </div>
                )}
                {hospital.has_female_doctor && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
                    <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-pink-700 dark:text-pink-400">{t('detail.femaleDoctor')}</p>
                      <p className="text-xs text-muted-foreground">{t('detail.femaleDoctorDesc')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GetCareKorea Service Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/50 dark:via-blue-950/50 dark:to-indigo-950/50 border-2 border-sky-200/50 dark:border-sky-800/50">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Left: Message */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-sky-900 dark:text-sky-100">{t('detail.planningToVisit', { name: hospital.name })}</h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">{t('detail.letUsHelp')}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>{t('detail.freeInterpreterService')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>{t('detail.directBooking')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>{t('detail.priceComparison')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>{t('detail.support247During')}</span>
                  </div>
                </div>
              </div>

              {/* Right: CTA Buttons */}
              <div className="flex flex-col gap-3 lg:w-64 shrink-0">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25"
                  asChild
                >
                  <Link href={`/inquiry?hospital=${hospital.id}`}>
                    <Calendar className="h-5 w-5" />
                    {t('detail.getFreeQuote')}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-sky-300 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/50"
                  asChild
                >
                  <a href={externalCtaLink} target="_blank" rel="noopener noreferrer">
                    <Languages className="h-5 w-5" />
                    {t('detail.bookWithInterpreter')}
                  </a>
                </Button>
                <p className="text-center text-xs text-sky-600 dark:text-sky-400">
                  {t('detail.noFeesResponse')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Photo Gallery Section */}
      {hospital.gallery && hospital.gallery.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-indigo-500" />
                  {t('detail.photoGallery')}
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {t('detail.photos', { count: hospital.gallery.length })}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {displayImages.map((img, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                  >
                    <Image
                      src={img}
                      alt={`${hospital.name} photo ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </motion.div>
                ))}
              </div>
              {hospital.gallery.length > 6 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setShowAllImages(!showAllImages)}
                >
                  {showAllImages ? t('detail.showLess') : t('detail.viewAllPhotos', { count: hospital.gallery.length })}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Specialties */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-500" />
              {t('detail.specialties')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {hospital.specialties.map((specialty, index) => (
                <motion.div
                  key={specialty}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Badge
                    variant="secondary"
                    className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 transition-colors"
                  >
                    {getSpecialtyName(specialty)}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Location & Map Section */}
      {hospital.latitude && hospital.longitude && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-500" />
                {t('detail.locationDirections')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Address */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                <MapPin className="h-5 w-5 text-teal-500 mt-0.5" />
                <div>
                  <p className="font-medium">{hospital.address}</p>
                  <p className="text-sm text-muted-foreground">{hospital.city}{hospital.district ? `, ${hospital.district}` : ''}</p>
                </div>
              </div>

              {/* Map Embed */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'}&q=${encodeURIComponent(hospital.address)}&zoom=15`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>

              {/* Google Maps Link */}
              {hospital.google_maps_url && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                >
                  <a href={hospital.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" />
                    {t('detail.openInGoogleMaps')}
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              {t('detail.trustSafety')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {hospital.certifications.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <BadgeCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('detail.certifications')}</p>
                    <p className="text-sm text-muted-foreground">
                      {hospital.certifications.join(', ')}
                    </p>
                  </div>
                </motion.div>
              )}
              {hospital.has_cctv && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 rounded-xl bg-green-50 p-4 dark:bg-green-950/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Cctv className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('detail.cctvMonitoring')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('detail.cctvMonitoringDesc')}
                    </p>
                  </div>
                </motion.div>
              )}
              {hospital.has_female_doctor && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 rounded-xl bg-pink-50 p-4 dark:bg-pink-950/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900">
                    <User className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{t('detail.femaleDoctorAvailable')}</p>
                    <p className="text-sm text-muted-foreground">{t('detail.uponRequest')}</p>
                  </div>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 rounded-xl bg-purple-50 p-4 dark:bg-purple-950/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Languages className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">{t('detail.languages')}</p>
                  <p className="text-sm text-muted-foreground">
                    {hospital.languages.join(', ')}
                  </p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA Banner - Interpreter Service */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary via-violet-600 to-purple-700 text-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  <h3 className="text-xl font-bold">{t('detail.needHelpCommunicating')}</h3>
                </div>
                <p className="text-white/90">
                  {t('detail.interpreterServiceDesc')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-white text-violet-700 hover:bg-white/90 font-semibold shadow-lg"
                  asChild
                >
                  <a href={externalCtaLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    {t('detail.requestInterpreter')}
                  </a>
                </Button>
                <Button
                  size="lg"
                  className="gap-2 rounded-full bg-white/20 text-white hover:bg-white/30 border-2 border-white/50 font-semibold"
                  asChild
                >
                  <Link href={`/inquiry?hospital=${hospital.id}`}>
                    <Calendar className="h-5 w-5" />
                    {t('detail.bookConsultation')}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Related Blog Articles Section */}
      {relatedBlogPosts && relatedBlogPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-rose-500" />
                  {t('detail.relatedArticles')}
                </div>
                <Link
                  href={`/blog${hospital.category ? `?category=${hospital.category}` : ''}`}
                  className="text-sm font-normal text-primary hover:underline flex items-center gap-1"
                >
                  {t('detail.viewAllArticles')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBlogPosts.slice(0, 3).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:shadow-lg transition-all">
                        {/* Image */}
                        <div className="relative h-32 overflow-hidden bg-muted">
                          {post.featured_image && !post.featured_image.includes('undefined') ? (
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover transition-transform group-hover:scale-110"
                              onError={(e) => {
                                // Hide image on error and show fallback
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          {/* Fallback gradient background - always shown as layer behind image */}
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-violet-100 dark:from-rose-900/40 dark:via-pink-900/30 dark:to-violet-900/40">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-12 w-12 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-rose-500" />
                              </div>
                              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Medical Guide</span>
                            </div>
                          </div>
                          {post.featured_image && !post.featured_image.includes('undefined') && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                          )}
                          {post.category && (
                            <Badge className="absolute left-2 top-2 bg-white/90 text-gray-900 text-xs z-20">
                              {post.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Badge>
                          )}
                        </div>
                        {/* Content */}
                        <div className="p-3">
                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                            {post.title}
                          </h4>
                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                            <span>
                              {post.published_at
                                ? new Date(post.published_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
                                : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {tBlog('readMore')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              {/* More articles link */}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <Link href={`/blog${hospital.specialties?.[0] ? `?search=${encodeURIComponent(hospital.specialties[0])}` : ''}`}>
                    <BookOpen className="h-4 w-4" />
                    {tBlog('exploreMoreGuides')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

function DoctorsSection({ doctors }: { doctors: Doctor[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {doctors.map((doctor, index) => (
          <motion.div
            key={doctor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ y: -5 }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-bold text-lg">{doctor.name}</h3>
                    <p className="text-sm text-white/80">{doctor.title}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {doctor.specialty}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {doctor.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{doctor.experience} years experience</span>
                    <span>{doctor.procedures}+ procedures</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ProceduresSection({
  procedures,
  hospitalId,
  locale,
}: {
  procedures: Procedure[];
  hospitalId: string;
  locale: Locale;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {procedures.map((procedure, index) => (
        <motion.div
          key={procedure.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ x: 5 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{procedure.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {procedure.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="h-4 w-4 text-primary" />
                      {procedure.duration}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-emerald-500" />
                      Recovery: {procedure.recovery}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                      {procedure.price}
                    </p>
                  </div>
                  <Button
                    className="gap-2 rounded-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
                    asChild
                  >
                    <Link href={`/inquiry?hospital=${hospitalId}&procedure=${procedure.id}`}>
                      Get Quote
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ReviewsSection({ hospital }: { hospital: Hospital }) {
  const t = useTranslations('hospitals');
  const tReviews = useTranslations('reviews');
  // Get actual Google reviews from hospital data
  const googleReviews = hospital.google_reviews || [];

  // Generate estimated rating distribution based on average rating and review count
  const generateRatingDistribution = () => {
    const avg = hospital.avg_rating || 4.5;
    const total = hospital.review_count || 100;

    // Create a realistic distribution based on the average
    // Higher average = more 5-star reviews
    let distribution: Record<number, number>;

    if (avg >= 4.8) {
      distribution = { 5: 0.75, 4: 0.18, 3: 0.04, 2: 0.02, 1: 0.01 };
    } else if (avg >= 4.5) {
      distribution = { 5: 0.60, 4: 0.25, 3: 0.10, 2: 0.03, 1: 0.02 };
    } else if (avg >= 4.0) {
      distribution = { 5: 0.45, 4: 0.30, 3: 0.15, 2: 0.07, 1: 0.03 };
    } else if (avg >= 3.5) {
      distribution = { 5: 0.30, 4: 0.25, 3: 0.25, 2: 0.12, 1: 0.08 };
    } else {
      distribution = { 5: 0.20, 4: 0.20, 3: 0.25, 2: 0.20, 1: 0.15 };
    }

    return Object.entries(distribution).map(([rating, percent]) => ({
      rating: parseInt(rating),
      count: Math.round(total * percent),
      percent: percent * 100,
    }));
  };

  const ratingDistribution = generateRatingDistribution();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Google-Style Rating Summary - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              {tReviews('title')}
              {hospital.source === 'google_places' && (
                <Badge variant="outline" className="ml-2 text-xs gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('detail.fromGoogle')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="text-center shrink-0">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-3 shadow-lg"
                >
                  <span className="text-5xl font-bold">{hospital.avg_rating.toFixed(1)}</span>
                </motion.div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= Math.round(hospital.avg_rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('detail.basedOnReviews', { count: hospital.review_count.toLocaleString() })}
                </p>
                {hospital.google_maps_url && (
                  <a
                    href={`${hospital.google_maps_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    {t('detail.seeAllOnGoogleMaps')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Separator orientation="vertical" className="hidden md:block h-32" />
              <div className="flex-1 space-y-3">
                {ratingDistribution.sort((a, b) => b.rating - a.rating).map((item) => (
                  <div key={item.rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-3">{item.rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ delay: 0.3 + item.rating * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Highly Rated Badge Card */}
      {hospital.avg_rating >= 4.5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">{t('detail.highlyRated')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('detail.highlyRatedDesc', { rating: hospital.avg_rating.toFixed(1), count: hospital.review_count.toLocaleString() })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Google Reviews CTA - Primary */}
      {hospital.google_maps_url && hospital.review_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-16 w-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                    <svg className="h-10 w-10" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t('detail.readRealReviews') || 'Read Real Patient Reviews'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('detail.viewAllReviews', { count: hospital.review_count.toLocaleString() }) || `View all ${hospital.review_count.toLocaleString()} verified reviews on Google Maps`}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(hospital.avg_rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm font-medium">{hospital.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg" asChild>
                  <a href={hospital.google_maps_url} target="_blank" rel="noopener noreferrer">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    View on Google Maps
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Real Google Reviews */}
      {googleReviews.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Reviews
            </h3>
            <span className="text-sm text-muted-foreground">{googleReviews.length} reviews shown</span>
          </div>
          <div className="space-y-4">
            {googleReviews.map((review, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                          {review.author[0]?.toUpperCase() || 'G'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">{review.author}</p>
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              </svg>
                              Google Review
                            </Badge>
                          </div>
                          {review.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                    {/* Owner Response */}
                    {review.response && (
                      <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-3">
                        <p className="text-xs font-semibold text-primary mb-1">{t('detail.response')}</p>
                        <p className="text-sm text-muted-foreground">{review.response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Final CTA - View More on Google */}
      {hospital.google_maps_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg border-2 border-dashed border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">{t('detail.lookingForMoreReviews') || 'Looking for more patient experiences?'}</p>
                    <p className="text-sm text-muted-foreground">{t('detail.readReviewsOnGoogle', { count: hospital.review_count.toLocaleString() }) || `Read ${hospital.review_count.toLocaleString()} reviews on Google Maps for detailed insights`}</p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2" asChild>
                  <a href={hospital.google_maps_url} target="_blank" rel="noopener noreferrer">
                    {t('detail.readAllReviews') || 'Read All Reviews'}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// Mobile Fixed Bottom CTA Bar - Only visible on mobile
function MobileBottomCTA({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | null>(null);

  useEffect(() => {
    getCTAForLocale(locale).then(setCtaConfig);
  }, [locale]);

  const externalCtaLink = ctaConfig?.url || '/contact';

  const getCTAText = () => {
    const ctaMap: Record<string, { cta1: string; cta2: string }> = {
      'en': { cta1: 'Free Quote', cta2: 'Chat Now' },
      'ja': { cta1: '無料見積', cta2: '今すぐチャット' },
      'zh_cn': { cta1: '免费报价', cta2: '立即咨询' },
      'zh_tw': { cta1: '免費報價', cta2: '立即諮詢' },
      'th': { cta1: 'ขอใบเสนอราคา', cta2: 'แชทเลย' },
      'ru': { cta1: 'Бесплатный расчет', cta2: 'Написать' },
      'mn': { cta1: 'Үнэ авах', cta2: 'Чатлах' },
    };
    const normalizedLocale = locale.replace('-', '_').toLowerCase();
    return ctaMap[normalizedLocale] || ctaMap['en'];
  };

  const cta = getCTAText();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-md border-t shadow-2xl px-4 py-3 safe-area-bottom">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button
            className="flex-1 gap-1.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 py-5 text-sm font-semibold shadow-lg"
            asChild
          >
            <Link href={`/inquiry?hospital=${hospital.id}`}>
              <MessageCircle className="h-4 w-4" />
              {cta.cta1}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5 rounded-xl py-5 text-sm font-semibold border-2 hover:bg-primary/5"
            asChild
          >
            <a href={externalCtaLink} target="_blank" rel="noopener noreferrer">
              <Languages className="h-4 w-4" />
              {cta.cta2}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  const t = useTranslations('hospitals.detail');
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | null>(null);

  useEffect(() => {
    getCTAForLocale(locale).then(setCtaConfig);
  }, [locale]);

  const externalCtaLink = ctaConfig?.url || '/contact';

  // Get locale-specific CTA text
  const getCTAText = () => {
    const ctaMap: Record<string, { title: string; subtitle: string; cta1: string; cta2: string; interpreter: string }> = {
      'en': {
        title: 'Ready to Book?',
        subtitle: 'Get a FREE consultation with professional interpreter support.',
        cta1: 'Get Free Quote',
        cta2: 'Book with Interpreter',
        interpreter: 'Includes FREE interpreter',
      },
      'ja': {
        title: '予約の準備はできましたか？',
        subtitle: '無料相談と通訳サポートをご利用ください。',
        cta1: '無料見積もり',
        cta2: '通訳付きで予約',
        interpreter: '無料通訳サービス付き',
      },
      'zh_cn': {
        title: '准备预约？',
        subtitle: '获取免费咨询和专业翻译支持。',
        cta1: '免费报价',
        cta2: '带翻译预约',
        interpreter: '包含免费翻译',
      },
      'zh_tw': {
        title: '準備預約？',
        subtitle: '獲取免費諮詢和專業翻譯支持。',
        cta1: '免費報價',
        cta2: '帶翻譯預約',
        interpreter: '包含免費翻譯',
      },
      'th': {
        title: 'พร้อมจองแล้ว?',
        subtitle: 'รับคำปรึกษาฟรีพร้อมล่ามมืออาชีพ',
        cta1: 'ขอใบเสนอราคา',
        cta2: 'จองพร้อมล่าม',
        interpreter: 'ล่ามฟรี',
      },
      'ru': {
        title: 'Готовы к записи?',
        subtitle: 'Получите бесплатную консультацию с переводчиком.',
        cta1: 'Бесплатный расчет',
        cta2: 'Записаться с переводчиком',
        interpreter: 'Бесплатный переводчик',
      },
      'mn': {
        title: 'Захиалга хийхэд бэлэн үү?',
        subtitle: 'Орчуулагчтай үнэгүй зөвлөгөө авах.',
        cta1: 'Үнэ авах',
        cta2: 'Орчуулагчтай захиалах',
        interpreter: 'Үнэгүй орчуулагч',
      },
    };
    const normalizedLocale = locale.replace('-', '_').toLowerCase();
    return ctaMap[normalizedLocale] || ctaMap['en'];
  };

  const cta = getCTAText();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      {/* Main CTA Card - Interpreter Focus */}
      {/* Desktop: sticky in sidebar, Mobile: hidden (shown at bottom via MobileBottomCTA) */}
      {/* Desktop CTA - NOT sticky to avoid covering content */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 mb-4"
            >
              <MessageCircle className="h-4 w-4" />
              {cta.interpreter}
            </motion.div>
            <h3 className="text-xl font-bold mb-2">{cta.title}</h3>
            <p className="text-sm text-muted-foreground">
              {cta.subtitle}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 py-6 text-lg shadow-lg"
              asChild
            >
              <Link href={`/inquiry?hospital=${hospital.id}`}>
                <MessageCircle className="h-5 w-5" />
                {cta.cta1}
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl py-6 text-lg border-2 hover:bg-primary/5"
              asChild
            >
              <a href={externalCtaLink} target="_blank" rel="noopener noreferrer">
                <Languages className="h-5 w-5" />
                {cta.cta2}
              </a>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {t('freeService')}
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {t('response24h')}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>{t('verifiedByGetCareKorea')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">{t('contactInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {hospital.phone && (
            <motion.a
              href={`tel:${hospital.phone}`}
              whileHover={{ x: 5 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('phone')}</p>
                <p className="font-medium">{hospital.phone}</p>
              </div>
            </motion.a>
          )}
          {hospital.website && (
            <motion.a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ x: 5 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                <Globe className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('website')}</p>
                <p className="font-medium">{t('visitWebsite')}</p>
              </div>
            </motion.a>
          )}
          {hospital.address && (
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <MapPin className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('address')}</p>
                <p className="font-medium">{hospital.address}</p>
                <p className="text-sm text-muted-foreground">{hospital.city}{hospital.district ? `, ${hospital.district}` : ''}</p>
                {hospital.google_maps_url && (
                  <a
                    href={hospital.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    {t('viewOnGoogleMaps')}
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
          {/* Opening Hours */}
          {hospital.opening_hours && hospital.opening_hours.length > 0 && (
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('operatingHours')}</p>
                <div className="text-sm space-y-0.5 mt-1">
                  {hospital.opening_hours.slice(0, 7).map((hour, idx) => {
                    // Day name translations
                    const dayTranslations: Record<string, Record<string, string>> = {
                      '월요일': { en: 'Monday', ja: '月曜日', 'zh-CN': '星期一', 'zh-TW': '星期一', th: 'วันจันทร์', ru: 'Понедельник', mn: 'Даваа', ko: '월요일' },
                      '화요일': { en: 'Tuesday', ja: '火曜日', 'zh-CN': '星期二', 'zh-TW': '星期二', th: 'วันอังคาร', ru: 'Вторник', mn: 'Мягмар', ko: '화요일' },
                      '수요일': { en: 'Wednesday', ja: '水曜日', 'zh-CN': '星期三', 'zh-TW': '星期三', th: 'วันพุธ', ru: 'Среда', mn: 'Лхагва', ko: '수요일' },
                      '목요일': { en: 'Thursday', ja: '木曜日', 'zh-CN': '星期四', 'zh-TW': '星期四', th: 'วันพฤหัสบดี', ru: 'Четверг', mn: 'Пүрэв', ko: '목요일' },
                      '금요일': { en: 'Friday', ja: '金曜日', 'zh-CN': '星期五', 'zh-TW': '星期五', th: 'วันศุกร์', ru: 'Пятница', mn: 'Баасан', ko: '금요일' },
                      '토요일': { en: 'Saturday', ja: '土曜日', 'zh-CN': '星期六', 'zh-TW': '星期六', th: 'วันเสาร์', ru: 'Суббота', mn: 'Бямба', ko: '토요일' },
                      '일요일': { en: 'Sunday', ja: '日曜日', 'zh-CN': '星期日', 'zh-TW': '星期日', th: 'วันอาทิตย์', ru: 'Воскресенье', mn: 'Ням', ko: '일요일' },
                    };
                    const hoursTranslations: Record<string, Record<string, string>> = {
                      '휴무일': { en: 'Closed', ja: '定休日', 'zh-CN': '休息', 'zh-TW': '休息', th: 'ปิด', ru: 'Выходной', mn: 'Амарна', ko: '휴무일' },
                    };
                    const translateDay = (day: string) => dayTranslations[day]?.[locale] || day;
                    const translateHours = (hours: string) => hoursTranslations[hours]?.[locale] || hours;

                    // Parse JSON string if needed
                    try {
                      const parsed = typeof hour === 'string' && hour.startsWith('{')
                        ? JSON.parse(hour)
                        : hour;
                      if (typeof parsed === 'object' && parsed.day && parsed.hours) {
                        return (
                          <p key={idx} className="text-muted-foreground">
                            <span className="font-medium">{translateDay(parsed.day)}:</span> {translateHours(parsed.hours)}
                          </p>
                        );
                      }
                      return <p key={idx} className="text-muted-foreground">{String(hour)}</p>;
                    } catch {
                      return <p key={idx} className="text-muted-foreground">{String(hour)}</p>;
                    }
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Why Book Through Us - Enhanced */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('whyBookWithUs')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: MessageCircle, textKey: 'freeInterpreter', descKey: 'freeInterpreterDesc' },
            { icon: Shield, textKey: 'verifiedHospitals', descKey: 'verifiedHospitalsDesc' },
            { icon: Award, textKey: 'bestPrice', descKey: 'bestPriceDesc' },
            { icon: Clock, textKey: 'support247', descKey: 'support247Desc' },
            { icon: Heart, textKey: 'aftercare', descKey: 'aftercareDesc' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                <item.icon className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">{t(item.textKey)}</p>
                <p className="text-xs text-muted-foreground">{t(item.descKey)}</p>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Contact - WhatsApp/LINE */}
      <Card className="overflow-hidden border-0 shadow-lg border-2 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('haveQuestions')}</p>
              <p className="text-xs text-muted-foreground">{t('chatWithUs')}</p>
            </div>
            <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
              <a href={externalCtaLink} target="_blank" rel="noopener noreferrer">
                {t('chat')}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
