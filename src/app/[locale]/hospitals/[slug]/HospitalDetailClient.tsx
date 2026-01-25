'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Share2,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import type { Locale } from '@/lib/i18n/config';

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

interface HospitalDetailClientProps {
  hospital: Hospital;
  doctors: Doctor[];
  procedures: Procedure[];
  reviews: Review[];
  locale: Locale;
}

export function HospitalDetailClient({
  hospital,
  doctors,
  procedures,
  reviews,
  locale,
}: HospitalDetailClientProps) {
  const t = useTranslations('hospitals');
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const allImages = [
    hospital.cover_image_url,
    ...hospital.gallery,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-background/80 backdrop-blur-sm"
      >
        <div className="container py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link href={`/${locale}/hospitals`} className="hover:text-foreground transition-colors shrink-0">
              Hospitals
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="font-medium text-foreground truncate">{hospital.name}</span>
          </nav>
        </div>
      </motion.div>

      {/* Hero Section with Gallery */}
      <section className="relative">
        <div className="relative h-[350px] lg:h-[500px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {allImages[currentImageIndex] ? (
                <Image
                  src={allImages[currentImageIndex]}
                  alt={hospital.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Gallery navigation */}
          {allImages.length > 1 && (
            <>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>

              {/* Image dots */}
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
                {allImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top actions */}
          <div className="absolute right-4 top-4 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className={`rounded-full p-3 backdrop-blur-sm transition-colors ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <Share2 className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Hospital Info Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white"
          >
            <div className="container">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {hospital.logo_url && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="relative h-14 w-14 sm:h-20 sm:w-20 overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white bg-white shadow-xl shrink-0"
                    >
                      <Image
                        src={hospital.logo_url}
                        alt={`${hospital.name} logo`}
                        fill
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
                          Featured
                        </Badge>
                      )}
                      {hospital.certifications.includes('JCI') && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-xs">
                          <Award className="mr-1 h-3 w-3" />
                          JCI
                        </Badge>
                      )}
                      {hospital.is_verified && (
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-xs">
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-xl sm:text-3xl lg:text-4xl font-bold line-clamp-2"
                    >
                      {hospital.name}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/90"
                    >
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        {hospital.city}{hospital.district ? `, ${hospital.district}` : ''}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{hospital.avg_rating.toFixed(1)}</span>
                        <span className="text-white/70 hidden sm:inline">({hospital.review_count} reviews)</span>
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
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-8">
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
                  {['overview', 'doctors', 'procedures', 'reviews'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="relative rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-8">
                    <OverviewSection hospital={hospital} locale={locale} />
                  </TabsContent>

                  <TabsContent value="doctors" className="mt-8">
                    <DoctorsSection doctors={doctors} />
                  </TabsContent>

                  <TabsContent value="procedures" className="mt-8">
                    <ProceduresSection procedures={procedures} hospitalId={hospital.id} locale={locale} />
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-8">
                    <ReviewsSection reviews={reviews} hospital={hospital} />
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <SidebarSection hospital={hospital} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewSection({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const displayImages = showAllImages ? hospital.gallery : hospital.gallery.slice(0, 6);

  // Format category for display
  const formatCategory = (cat?: string) => {
    if (!cat) return null;
    const categoryMap: Record<string, string> = {
      'plastic-surgery': 'Plastic Surgery Clinic',
      'dermatology': 'Dermatology Clinic',
      'dental': 'Dental Clinic',
      'ophthalmology': 'Eye Clinic',
      'traditional-medicine': 'Korean Medicine Clinic',
      'university-hospital': 'University Hospital',
      'hair-transplant': 'Hair Transplant Clinic',
      'health-checkup': 'Health Checkup Center',
    };
    return categoryMap[cat] || cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
            <CardHeader className="bg-gradient-to-r from-primary/10 to-violet-500/10">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Summary
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
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              About {hospital.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Main Description */}
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed text-base">{hospital.description}</p>

              {/* Auto-generated Extended Description based on hospital data */}
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                {hospital.category && (
                  <p>
                    <span className="font-medium text-foreground">{hospital.name}</span> is a renowned {formatCategory(hospital.category)?.toLowerCase()}
                    {hospital.district && ` located in the heart of ${hospital.district}, ${hospital.city}`}.
                    {hospital.avg_rating >= 4.5 && ` With an outstanding rating of ${hospital.avg_rating.toFixed(1)} stars from ${hospital.review_count.toLocaleString()} patient reviews, this clinic has established itself as one of the most trusted medical facilities in Korea.`}
                    {hospital.avg_rating >= 4.0 && hospital.avg_rating < 4.5 && ` Maintaining a solid rating of ${hospital.avg_rating.toFixed(1)} stars from ${hospital.review_count.toLocaleString()} reviews, this clinic is well-regarded for its quality care.`}
                  </p>
                )}

                {hospital.specialties && hospital.specialties.length > 0 && (
                  <p>
                    The clinic specializes in <span className="font-medium text-foreground">{hospital.specialties.slice(0, 3).join(', ')}</span>
                    {hospital.specialties.length > 3 && ` and ${hospital.specialties.length - 3} more specialties`},
                    offering world-class treatments that attract patients from all over the world.
                    Each procedure is performed by experienced specialists using state-of-the-art equipment and techniques.
                  </p>
                )}

                {hospital.certifications && hospital.certifications.length > 0 && (
                  <p>
                    As a {hospital.certifications.includes('JCI') ? 'JCI-accredited' : 'certified'} medical institution,
                    {hospital.name} meets the highest international standards for patient safety and quality of care.
                    This accreditation ensures that international patients receive the same level of excellence as they would expect from top hospitals worldwide.
                  </p>
                )}

                {hospital.languages && hospital.languages.length > 1 && (
                  <p>
                    To better serve international patients, the clinic provides multilingual support in {hospital.languages.slice(0, 4).join(', ')}
                    {hospital.languages.length > 4 && ` and more`}.
                    This ensures smooth communication throughout your medical journey, from initial consultation to post-treatment care.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Quick Facts - Enhanced Grid */}
            <div>
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Facts
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {hospital.category && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">Type</p>
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
                      <p className="text-muted-foreground text-xs">Location</p>
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
                      <p className="text-muted-foreground text-xs">Rating</p>
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
                      <p className="text-muted-foreground text-xs">Verified</p>
                      <p className="font-medium text-sm">Google Data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hospital Highlights */}
            <div className="pt-2">
              <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Why Patients Choose {hospital.name}
              </h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {hospital.avg_rating >= 4.5 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">Highly Rated</p>
                      <p className="text-xs text-muted-foreground">Top-rated clinic with {hospital.avg_rating.toFixed(1)}★ from {hospital.review_count.toLocaleString()} reviews</p>
                    </div>
                  </div>
                )}
                {hospital.certifications.includes('JCI') && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-700 dark:text-blue-400">JCI Accredited</p>
                      <p className="text-xs text-muted-foreground">International gold standard for healthcare quality</p>
                    </div>
                  </div>
                )}
                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                    <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Stethoscope className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-violet-700 dark:text-violet-400">Expert Specialists</p>
                      <p className="text-xs text-muted-foreground">Specialized in {hospital.specialties[0]} and more</p>
                    </div>
                  </div>
                )}
                {hospital.languages && hospital.languages.length >= 2 && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Languages className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Multilingual Support</p>
                      <p className="text-xs text-muted-foreground">{hospital.languages.length} languages available</p>
                    </div>
                  </div>
                )}
                {hospital.has_cctv && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-green-700 dark:text-green-400">Safety First</p>
                      <p className="text-xs text-muted-foreground">Full CCTV monitoring in operation rooms</p>
                    </div>
                  </div>
                )}
                {hospital.has_female_doctor && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
                    <div className="h-8 w-8 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-pink-700 dark:text-pink-400">Female Doctor</p>
                      <p className="text-xs text-muted-foreground">Available upon request for your comfort</p>
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
                    <h3 className="font-bold text-lg text-sky-900 dark:text-sky-100">Planning to Visit {hospital.name}?</h3>
                    <p className="text-sm text-sky-700 dark:text-sky-300">Let GetCareKorea help you with your medical journey</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span><strong>FREE</strong> professional medical interpreter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Direct hospital appointment booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Price comparison & best deals</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200">
                    <Check className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>24/7 support during your stay</span>
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
                  <Link href={`/${locale}/inquiry?hospital=${hospital.id}`}>
                    <Calendar className="h-5 w-5" />
                    Get Free Quote
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-sky-300 text-sky-700 hover:bg-sky-100 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/50"
                  asChild
                >
                  <Link href={`/${locale}/inquiry?hospital=${hospital.id}&service=interpreter`}>
                    <Languages className="h-5 w-5" />
                    Book with Interpreter
                  </Link>
                </Button>
                <p className="text-center text-xs text-sky-600 dark:text-sky-400">
                  No fees • Response within 24h
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
            <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-indigo-500/10">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-indigo-500" />
                  Photo Gallery
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {hospital.gallery.length} photos
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
                  {showAllImages ? 'Show Less' : `View All ${hospital.gallery.length} Photos`}
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
          <CardHeader className="bg-gradient-to-r from-violet-500/5 to-violet-500/10">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-violet-500" />
              Specialties
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
                    {specialty}
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
            <CardHeader className="bg-gradient-to-r from-teal-500/5 to-teal-500/10">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-500" />
                Location & Directions
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
                    Open in Google Maps
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
          <CardHeader className="bg-gradient-to-r from-emerald-500/5 to-emerald-500/10">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Trust & Safety
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
                    <p className="font-semibold">Certifications</p>
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
                    <p className="font-semibold">CCTV Monitoring</p>
                    <p className="text-sm text-muted-foreground">
                      Full operation room monitoring
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
                    <p className="font-semibold">Female Doctor Available</p>
                    <p className="text-sm text-muted-foreground">Upon request</p>
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
                  <p className="font-semibold">Languages</p>
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
                  <h3 className="text-xl font-bold">Need Help Communicating?</h3>
                </div>
                <p className="text-white/90">
                  We provide FREE interpreter service for your hospital visit. Book your consultation with us and get professional medical interpretation support.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 rounded-full bg-white text-primary hover:bg-white/90"
                  asChild
                >
                  <Link href={`/${locale}/inquiry?hospital=${hospital.id}&service=interpreter`}>
                    <MessageCircle className="h-5 w-5" />
                    Request Interpreter
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href={`/${locale}/inquiry?hospital=${hospital.id}`}>
                    <Calendar className="h-5 w-5" />
                    Book Consultation
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
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
                    <Link href={`/${locale}/inquiry?hospital=${hospitalId}&procedure=${procedure.id}`}>
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

function ReviewsSection({ reviews, hospital }: { reviews: Review[]; hospital: Hospital }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Google-Style Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-500/5 to-orange-500/10">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              Patient Reviews
              {hospital.source === 'google_places' && (
                <Badge variant="outline" className="ml-2 text-xs gap-1">
                  <svg className="h-3 w-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  via Google
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
                  {hospital.review_count.toLocaleString()} reviews
                </p>
                {hospital.google_maps_url && (
                  <a
                    href={`${hospital.google_maps_url}#reviews`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    See all on Google
                    <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Separator orientation="vertical" className="hidden md:block h-32" />
              <div className="flex-1 space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter((r) => r.rating === rating).length;
                  const percentage = (count / reviews.length) * 100 || 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-3">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3 + rating * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{count > 0 ? `${count} reviews` : '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Featured Reviews (if high rating) */}
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
                  <h4 className="font-semibold text-green-700 dark:text-green-400">Highly Rated Clinic</h4>
                  <p className="text-sm text-muted-foreground">
                    This clinic maintains an excellent rating of {hospital.avg_rating.toFixed(1)} stars from {hospital.review_count.toLocaleString()} patient reviews.
                    Patients particularly appreciate the professional staff and quality of care.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white font-bold text-lg">
                      {review.author[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{review.author}</p>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <Check className="mr-1 h-3 w-3" />
                            Verified Patient
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
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
                {review.procedure && (
                  <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary">
                    {review.procedure}
                  </Badge>
                )}
                <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {review.images.map((img, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
                        <Image src={img} alt="" fill className="object-cover hover:scale-110 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* View More on Google */}
      {hospital.google_maps_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Want to see more reviews?</p>
                    <p className="text-sm text-muted-foreground">Read all {hospital.review_count.toLocaleString()} reviews on Google</p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2" asChild>
                  <a href={`${hospital.google_maps_url}`} target="_blank" rel="noopener noreferrer">
                    View on Google Maps
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

function SidebarSection({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
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
      <Card className="sticky top-24 overflow-hidden border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-purple-500/5" />
        <CardContent className="relative p-6">
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
              <Link href={`/${locale}/inquiry?hospital=${hospital.id}`}>
                <MessageCircle className="h-5 w-5" />
                {cta.cta1}
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl py-6 text-lg border-2 hover:bg-primary/5"
              asChild
            >
              <Link href={`/${locale}/inquiry?hospital=${hospital.id}&service=interpreter`}>
                <Languages className="h-5 w-5" />
                {cta.cta2}
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Free Service
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              24h Response
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Verified by GetCareKorea</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30">
          <CardTitle className="text-base">Contact Information</CardTitle>
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
                <p className="text-xs text-muted-foreground">Phone</p>
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
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="font-medium">Visit Website</p>
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
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{hospital.address}</p>
                <p className="text-sm text-muted-foreground">{hospital.city}{hospital.district ? `, ${hospital.district}` : ''}</p>
                {hospital.google_maps_url && (
                  <a
                    href={hospital.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    View on Google Maps
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
                <p className="text-xs text-muted-foreground">Opening Hours</p>
                <div className="text-sm space-y-0.5 mt-1">
                  {hospital.opening_hours.slice(0, 7).map((hour, idx) => {
                    // Parse JSON string if needed
                    try {
                      const parsed = typeof hour === 'string' && hour.startsWith('{')
                        ? JSON.parse(hour)
                        : hour;
                      if (typeof parsed === 'object' && parsed.day && parsed.hours) {
                        return (
                          <p key={idx} className="text-muted-foreground">
                            <span className="font-medium">{parsed.day}:</span> {parsed.hours}
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
            Why Book Through Us?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: MessageCircle, text: 'Free Interpreter Service', desc: 'Professional medical interpreters' },
            { icon: Shield, text: 'Verified Hospitals', desc: 'All clinics vetted by us' },
            { icon: Award, text: 'Best Price Guarantee', desc: 'No hidden fees' },
            { icon: Clock, text: '24/7 Support', desc: 'We\'re here when you need us' },
            { icon: Heart, text: 'Aftercare Included', desc: 'Follow-up consultations' },
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
                <p className="font-medium text-sm">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
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
              <p className="font-semibold text-sm">Have Questions?</p>
              <p className="text-xs text-muted-foreground">Chat with us directly</p>
            </div>
            <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
              <Link href={`/${locale}/contact`}>
                Chat
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
