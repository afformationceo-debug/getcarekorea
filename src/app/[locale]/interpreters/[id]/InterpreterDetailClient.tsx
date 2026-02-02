'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Star,
  MapPin,
  Languages,
  Calendar,
  BadgeCheck,
  MessageCircle,
  Clock,
  ChevronRight,
  Play,
  Check,
  Award,
  Shield,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Locale } from '@/lib/i18n/config';
import { getCTAForLocale, type CTAConfig } from '@/lib/settings/cta';

interface Language {
  code: string;
  name: string;
  level: string;
}

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  procedure: string;
  hospital: string;
}

interface Interpreter {
  id: string;
  name: string;
  photo_url: string | null;
  languages: Language[];
  specialties: string[];
  bio: string;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  is_verified: boolean;
  is_available: boolean;
  video_url: string | null;
  experience_years: number;
  location: string;
  education: string;
  certifications: string[];
  services: string[];
  availability?: {
    [key: string]: { start: string; end: string }[];
  };
}

interface InterpreterDetailClientProps {
  interpreter: Interpreter;
  reviews: Review[];
  locale: Locale;
}

export function InterpreterDetailClient({
  interpreter,
  reviews,
  locale,
}: InterpreterDetailClientProps) {
  const t = useTranslations('interpreters');
  const [activeTab, setActiveTab] = useState('about');

  // Helper to get translated language name
  const getLanguageName = (code: string) => {
    try {
      return t(`languages.${code}`);
    } catch {
      return code.toUpperCase();
    }
  };

  // Helper to get translated specialty name
  const getSpecialtyName = (specialty: string) => {
    try {
      return t(`specialties.${specialty}`);
    } catch {
      return specialty;
    }
  };

  // Helper to get translated service name
  const getServiceName = (service: string) => {
    const serviceKey = service.toLowerCase().replace(/\s+/g, '');
    try {
      return t(`detail.services.${serviceKey}`);
    } catch {
      return service;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-background to-background dark:from-violet-950/20">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-background/80 backdrop-blur-sm"
      >
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              {t('detail.home')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/interpreters`} className="hover:text-foreground transition-colors">
              {t('detail.interpreters')}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{interpreter.name}</span>
          </nav>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-8 lg:py-12">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
          />
        </div>

        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mx-auto lg:mx-0"
            >
              <div className="relative h-64 w-64 overflow-hidden rounded-3xl shadow-2xl lg:h-80 lg:w-80">
                {interpreter.photo_url ? (
                  <Image
                    src={interpreter.photo_url}
                    alt={interpreter.name}
                    fill
                    sizes="(max-width: 1024px) 256px, 320px"
                    className="object-cover"
                    priority
                    unoptimized={interpreter.photo_url.includes('.svg') || interpreter.photo_url.includes('dicebear')}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-8xl font-bold text-primary/40">
                      {interpreter.name[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Video play button */}
                {interpreter.video_url && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-medium shadow-lg backdrop-blur-sm"
                  >
                    <Play className="h-5 w-5 fill-violet-600 text-violet-600" />
                    {t('detail.watchIntro')}
                  </motion.button>
                )}
              </div>

              {/* Availability badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -right-4 top-4"
              >
                {interpreter.is_available ? (
                  <Badge className="bg-green-500 px-4 py-2 text-sm text-white shadow-lg">
                    <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
                    {t('detail.availableNow')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-4 py-2 text-sm shadow-lg">
                    {t('detail.unavailable')}
                  </Badge>
                )}
              </motion.div>
            </motion.div>

            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 text-center lg:text-left"
            >
              {/* Name and badges */}
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <h1 className="text-3xl font-bold lg:text-4xl">{interpreter.name}</h1>
                {interpreter.is_verified && (
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    <BadgeCheck className="mr-1 h-4 w-4" />
                    {t('detail.verified')}
                  </Badge>
                )}
              </div>

              {/* Location and experience */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-muted-foreground lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  {interpreter.location}
                </div>
                <span className="hidden lg:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-violet-500" />
                  {interpreter.experience_years}{t('detail.experience')}
                </div>
                <span className="hidden lg:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {interpreter.total_bookings} {t('detail.bookingsCompleted')}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6 flex items-center justify-center gap-4 lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 dark:bg-amber-900/30">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="font-bold text-amber-700 dark:text-amber-300">
                      {interpreter.avg_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    ({interpreter.review_count} {t('detail.reviews')})
                  </span>
                </div>
              </div>

              {/* Languages - sorted by proficiency */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">{t('card.languagesLabel')}</div>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {[...interpreter.languages]
                    .sort((a, b) => {
                      const order = { native: 0, fluent: 1, conversational: 2 };
                      return (order[a.level as keyof typeof order] ?? 2) - (order[b.level as keyof typeof order] ?? 2);
                    })
                    .map((lang) => (
                    <Badge
                      key={lang.code}
                      variant="outline"
                      className={`border-2 px-3 py-1.5 text-sm ${
                        lang.level === 'native'
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                          : ''
                      }`}
                    >
                      {getLanguageName(lang.code)}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({lang.level === 'native' ? t('detail.native') : lang.level === 'fluent' ? t('detail.fluent') : t('detail.conversational')})
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">{t('card.specialtiesLabel')}</div>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {interpreter.specialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      className="bg-violet-100 px-3 py-1.5 text-sm text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    >
                      {getSpecialtyName(specialty)}
                    </Badge>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container pb-16">
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
                  {[
                    { key: 'about', label: t('detail.about') },
                    { key: 'services', label: t('detail.servicesTab') },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="relative rounded-full px-6 py-2.5 border-2 border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:border-violet-300 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:border-violet-600 data-[state=active]:shadow-lg dark:bg-violet-950/30 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/50 dark:data-[state=active]:bg-violet-600 transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="about" className="mt-8">
                  <AboutSection interpreter={interpreter} />
                </TabsContent>

                <TabsContent value="services" className="mt-8">
                  <ServicesSection interpreter={interpreter} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarSection interpreter={interpreter} locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}

function AboutSection({ interpreter }: { interpreter: Interpreter }) {
  const t = useTranslations('interpreters');

  // Helper to get translated language name
  const getLanguageName = (code: string) => {
    try {
      return t(`languages.${code}`);
    } catch {
      return code.toUpperCase();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Bio - only show if bio exists */}
      {interpreter.bio && (
        <Card className="border shadow-sm">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <User className="h-3.5 w-3.5 text-violet-600" />
              </div>
              {t('detail.aboutMe')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{interpreter.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Education & Certifications - only show if education or certifications exist */}
      {(interpreter.education || interpreter.certifications.length > 0) && (
        <Card className="border shadow-sm">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
              </div>
              {t('detail.education')} & {t('detail.certifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="space-y-2.5">
              {interpreter.education && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('detail.education')}</p>
                    <p className="text-xs text-muted-foreground">{interpreter.education}</p>
                  </div>
                </div>
              )}
              {interpreter.certifications.map((cert, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Award className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cert}</p>
                    <p className="text-xs text-muted-foreground">{t('detail.certifiedProfessional')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Language Proficiency - only show if languages exist */}
      {interpreter.languages.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="border-b py-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Languages className="h-3.5 w-3.5 text-violet-600" />
              </div>
              {t('detail.languageProficiency')}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <div className="space-y-3">
              {[...interpreter.languages]
                .sort((a, b) => {
                  const order = { native: 0, fluent: 1, conversational: 2 };
                  return (order[a.level as keyof typeof order] ?? 2) - (order[b.level as keyof typeof order] ?? 2);
                })
                .map((lang, index) => (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{getLanguageName(lang.code)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {lang.level === 'native' ? t('detail.native') : lang.level === 'fluent' ? t('detail.fluent') : t('detail.conversational')}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 w-5 rounded ${
                          level <= (lang.level === 'native' ? 5 : lang.level === 'fluent' ? 4 : 3)
                            ? 'bg-violet-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </motion.div>
  );
}

function ServicesSection({ interpreter }: { interpreter: Interpreter }) {
  const t = useTranslations('interpreters');

  // Service keys for translation
  const serviceKeys: Record<string, string> = {
    'Medical Consultation Interpretation': 'medicalConsultation',
    'Surgery Accompaniment': 'surgeryAccompaniment',
    'Hospital Coordination': 'hospitalCoordination',
    'Post-operative Care Support': 'postOperativeCare',
    'Document Translation': 'documentTranslation',
  };

  const getServiceName = (service: string) => {
    const key = serviceKeys[service];
    if (key) {
      try {
        return t(`detail.services.${key}`);
      } catch {
        return service;
      }
    }
    return service;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Services */}
      {interpreter.services.length > 0 && (
      <Card className="border shadow-sm">
        <CardHeader className="border-b py-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Briefcase className="h-3.5 w-3.5 text-violet-600" />
            </div>
            {t('detail.servicesOffered')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {interpreter.services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 rounded-lg bg-violet-50 p-3 dark:bg-violet-950/30"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
                  <Check className="h-3 w-3 text-violet-600" />
                </div>
                <span className="text-sm">{getServiceName(service)}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </motion.div>
  );
}

function ReviewsSection({
  reviews,
  interpreter,
}: {
  reviews: Review[];
  interpreter: Interpreter;
}) {
  const t = useTranslations('interpreters');
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Rating Summary */}
      <Card className="border shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white"
              >
                <span className="text-4xl font-bold">{interpreter.avg_rating.toFixed(1)}</span>
              </motion.div>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(interpreter.avg_rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {interpreter.review_count} {t('detail.reviews')}
              </p>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="mb-2 text-lg font-semibold">{t('detail.excellentService')}</h3>
              <p className="text-muted-foreground">
                {t('detail.ratingDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 font-bold text-white">
                      {review.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                    {review.procedure}
                  </Badge>
                  <Badge variant="outline">{review.hospital}</Badge>
                </div>
                <p className="text-muted-foreground">{review.content}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SidebarSection({ interpreter, locale }: { interpreter: Interpreter; locale: Locale }) {
  const t = useTranslations('interpreters');
  const [ctaConfig, setCTAConfig] = useState<CTAConfig | null>(null);

  useEffect(() => {
    async function loadCTA() {
      try {
        const config = await getCTAForLocale(locale);
        setCTAConfig(config);
      } catch (error) {
        console.error('Failed to load CTA config:', error);
      }
    }
    loadCTA();
  }, [locale]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      {/* Booking Card */}
      <Card className="sticky top-24 overflow-hidden border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5" />
        <CardContent className="relative p-6">
          <div className="mb-6 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            >
              <Sparkles className="h-4 w-4" />
              {t('detail.bookYourInterpreter')}
            </motion.div>
            <h3 className="mb-2 text-xl font-bold">{t('detail.readyToAssist')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('detail.professionalInterpretation')}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className={`w-full gap-2 rounded-xl bg-gradient-to-r ${ctaConfig?.color || 'from-violet-600 to-purple-600'} py-6 text-lg hover:opacity-90`}
              asChild
            >
              <a
                href={ctaConfig?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                {t('detail.sendMessage')}
              </a>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {t('detail.freeCancellation')}
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {t('detail.response24h')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Choose Me */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-base">{t('detail.whyChooseMe')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Shield, text: t('detail.verifiedProfessional') },
            { icon: Languages, text: t('detail.multiLingualExpert') },
            { icon: Award, text: t('detail.medicalCertified') },
            { icon: Clock, text: t('detail.flexibleSchedule') },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 text-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <item.icon className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span>{item.text}</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
