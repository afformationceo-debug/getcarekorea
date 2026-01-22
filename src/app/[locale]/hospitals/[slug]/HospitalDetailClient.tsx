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
  description: string;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery: string[];
  address: string;
  city: string;
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
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/${locale}/hospitals`} className="hover:text-foreground transition-colors">
              Hospitals
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{hospital.name}</span>
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
            className="absolute bottom-0 left-0 right-0 p-6 text-white"
          >
            <div className="container">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  {hospital.logo_url && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl"
                    >
                      <Image
                        src={hospital.logo_url}
                        alt={`${hospital.name} logo`}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  )}
                  <div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mb-2 flex flex-wrap gap-2"
                    >
                      {hospital.is_featured && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                      {hospital.certifications.includes('JCI') && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 border-0">
                          <Award className="mr-1 h-3 w-3" />
                          JCI Accredited
                        </Badge>
                      )}
                      {hospital.is_verified && (
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm">
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-3xl font-bold lg:text-4xl"
                    >
                      {hospital.name}
                    </motion.h1>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/90"
                    >
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {hospital.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{hospital.avg_rating.toFixed(1)}</span>
                        <span className="text-white/70">({hospital.review_count} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
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
                    <OverviewSection hospital={hospital} />
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

function OverviewSection({ hospital }: { hospital: Hospital }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              About This Hospital
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground leading-relaxed">{hospital.description}</p>
          </CardContent>
        </Card>
      </motion.div>

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
      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-3"
                >
                  <span className="text-4xl font-bold">{hospital.avg_rating.toFixed(1)}</span>
                </motion.div>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(hospital.avg_rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {hospital.review_count} reviews
                </p>
              </div>
              <Separator orientation="vertical" className="hidden md:block h-24" />
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter((r) => r.rating === rating).length;
                  const percentage = (count / reviews.length) * 100 || 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm w-3">{rating}</span>
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3 + rating * 0.1 }}
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white font-bold">
                      {review.author[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{review.author}</p>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            <Check className="mr-1 h-3 w-3" />
                            Verified
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
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary">
                  {review.procedure}
                </Badge>
                <p className="text-muted-foreground">{review.content}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SidebarSection({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      {/* CTA Card */}
      <Card className="sticky top-24 overflow-hidden border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-purple-500/5" />
        <CardContent className="relative p-6">
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4"
            >
              <Sparkles className="h-4 w-4" />
              Free Consultation
            </motion.div>
            <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
            <p className="text-sm text-muted-foreground">
              Get a personalized quote and consultation from our medical tourism experts.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:opacity-90 py-6 text-lg"
              asChild
            >
              <Link href={`/${locale}/inquiry?hospital=${hospital.id}`}>
                <MessageCircle className="h-5 w-5" />
                Get Free Quote
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl py-6 text-lg border-2"
              asChild
            >
              <Link href={`/${locale}/inquiry?hospital=${hospital.id}&type=consultation`}>
                <Calendar className="h-5 w-5" />
                Book Consultation
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
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{hospital.address}</p>
                <p className="text-sm text-muted-foreground">{hospital.city}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Why Book Through Us */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardHeader>
          <CardTitle className="text-base">Why Book Through Us?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Check, text: 'Free Interpreter Service' },
            { icon: Shield, text: 'Verified Hospitals Only' },
            { icon: Award, text: 'Best Price Guarantee' },
            { icon: Clock, text: '24/7 Support' },
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
