'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Languages,
  Calendar,
  Video,
  BadgeCheck,
  MessageCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Play,
  Heart,
  Share2,
  Check,
  Award,
  Shield,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Locale } from '@/lib/i18n/config';

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
  photo_url: string;
  languages: Language[];
  specialties: string[];
  bio: string;
  hourly_rate: number;
  daily_rate: number;
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
  availability: {
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
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);

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
            <Link href={`/${locale}`} className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/${locale}/interpreters`} className="hover:text-foreground transition-colors">
              Interpreters
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
                <Image
                  src={interpreter.photo_url}
                  alt={interpreter.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Video play button */}
                {interpreter.video_url && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-medium shadow-lg backdrop-blur-sm"
                  >
                    <Play className="h-5 w-5 fill-violet-600 text-violet-600" />
                    Watch Intro
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
                    Available Now
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-4 py-2 text-sm shadow-lg">
                    Currently Unavailable
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
                    Verified
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
                  {interpreter.experience_years}+ years experience
                </div>
                <span className="hidden lg:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {interpreter.total_bookings} bookings completed
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
                    ({interpreter.review_count} reviews)
                  </span>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Languages</div>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {interpreter.languages.map((lang) => (
                    <Badge
                      key={lang.code}
                      variant="outline"
                      className="border-2 px-3 py-1.5 text-sm"
                    >
                      {lang.name}
                      {lang.level === 'native' && (
                        <span className="ml-1.5 text-violet-500">★</span>
                      )}
                      {lang.level === 'fluent' && (
                        <span className="ml-1.5 text-xs text-muted-foreground">(Fluent)</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">Specialties</div>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {interpreter.specialties.map((specialty) => (
                    <Badge
                      key={specialty}
                      className="bg-violet-100 px-3 py-1.5 text-sm text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                <div>
                  <span className="text-3xl font-bold text-violet-600">
                    ${interpreter.hourly_rate}
                  </span>
                  <span className="text-muted-foreground">/hour</span>
                </div>
                <div className="text-muted-foreground">
                  or <span className="font-semibold text-foreground">${interpreter.daily_rate}</span>/day
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <Button
                  size="lg"
                  className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 hover:opacity-90"
                  asChild
                >
                  <Link href={`/${locale}/inquiry?interpreter=${interpreter.id}`}>
                    <MessageCircle className="h-5 w-5" />
                    Book Now
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-xl border-2 px-6"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  Save
                </Button>
                <Button size="lg" variant="outline" className="gap-2 rounded-xl border-2 px-6">
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
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
                  {['about', 'services', 'reviews'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="relative rounded-full px-6 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="about" className="mt-8">
                  <AboutSection interpreter={interpreter} />
                </TabsContent>

                <TabsContent value="services" className="mt-8">
                  <ServicesSection interpreter={interpreter} />
                </TabsContent>

                <TabsContent value="reviews" className="mt-8">
                  <ReviewsSection reviews={reviews} interpreter={interpreter} />
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Bio */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/5 to-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-violet-500" />
            About Me
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="leading-relaxed text-muted-foreground">{interpreter.bio}</p>
        </CardContent>
      </Card>

      {/* Education & Certifications */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/5 to-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-violet-500" />
            Education & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <GraduationCap className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium">Education</p>
                <p className="text-sm text-muted-foreground">{interpreter.education}</p>
              </div>
            </div>
            {interpreter.certifications.map((cert, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{cert}</p>
                  <p className="text-sm text-muted-foreground">Certified Professional</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Proficiency */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/5 to-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-violet-500" />
            Language Proficiency
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {interpreter.languages.map((lang, index) => (
              <motion.div
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <span className="font-medium">{lang.name}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-6 rounded ${
                          level <= (lang.level === 'native' ? 5 : lang.level === 'fluent' ? 4 : 3)
                            ? 'bg-violet-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {lang.level === 'native' ? 'Native' : lang.level === 'fluent' ? 'Fluent' : 'Conversational'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ServicesSection({ interpreter }: { interpreter: Interpreter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Services */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/5 to-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-violet-500" />
            Services Offered
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {interpreter.services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 rounded-xl bg-violet-50 p-4 dark:bg-violet-950/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
                  <Check className="h-4 w-4 text-violet-600" />
                </div>
                <span className="font-medium">{service}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/5 to-purple-500/10">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-6 dark:border-violet-800 dark:bg-violet-950/30"
            >
              <div className="mb-2 text-sm font-medium text-muted-foreground">Hourly Rate</div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-violet-600">${interpreter.hourly_rate}</span>
                <span className="text-muted-foreground">/hour</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Minimum 2 hours
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Medical terminology
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Written summary included
                </li>
              </ul>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-6 dark:border-purple-800 dark:bg-purple-950/30"
            >
              <Badge className="mb-2 bg-purple-500">Best Value</Badge>
              <div className="mb-2 text-sm font-medium text-muted-foreground">Daily Rate</div>
              <div className="mb-4">
                <span className="text-4xl font-bold text-purple-600">${interpreter.daily_rate}</span>
                <span className="text-muted-foreground">/day</span>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Up to 8 hours
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Transportation included
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Hospital coordination
                </li>
              </ul>
            </motion.div>
          </div>
        </CardContent>
      </Card>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Rating Summary */}
      <Card className="overflow-hidden border-0 shadow-lg">
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
                {interpreter.review_count} reviews
              </p>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="mb-2 text-lg font-semibold">Excellent Service</h3>
              <p className="text-muted-foreground">
                Highly rated by patients for professionalism, accuracy, and patient care.
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
            <Card className="overflow-hidden border-0 shadow-lg">
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
              Book Your Interpreter
            </motion.div>
            <h3 className="mb-2 text-xl font-bold">Ready to Assist</h3>
            <p className="text-sm text-muted-foreground">
              Professional interpretation for your medical journey in Korea.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-6 text-lg hover:opacity-90"
              asChild
            >
              <Link href={`/${locale}/inquiry?interpreter=${interpreter.id}`}>
                <MessageCircle className="h-5 w-5" />
                Book Now
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl border-2 py-6 text-lg"
              asChild
            >
              <Link href={`/${locale}/inquiry?interpreter=${interpreter.id}&type=inquiry`}>
                <Mail className="h-5 w-5" />
                Send Message
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Free Cancellation
            </div>
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              24h Response
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Choose Me */}
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="text-base">Why Choose Me?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Shield, text: 'Verified Professional' },
            { icon: Languages, text: 'Multi-lingual Expert' },
            { icon: Award, text: 'Medical Certified' },
            { icon: Clock, text: 'Flexible Schedule' },
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
