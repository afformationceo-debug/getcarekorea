'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Search,
  Star,
  Languages,
  Calendar,
  Video,
  Filter,
  Grid,
  List,
  BadgeCheck,
  MessageCircle,
  Clock,
  Sparkles,
  Users,
  Award,
  Shield,
  ChevronRight,
  Play,
  MapPin,
  Zap,
  Globe,
  Heart,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '@/lib/i18n/config';

interface Language {
  code: string;
  name: string;
  level: string;
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
}

interface InterpretersPageClientProps {
  interpreters: Interpreter[];
  locale: Locale;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    }
  },
};

export function InterpretersPageClient({ interpreters, locale }: InterpretersPageClientProps) {
  const t = useTranslations('interpreters');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const languages = [
    'English',
    'Chinese',
    'Japanese',
    'Thai',
    'Russian',
    'Mongolian',
    'Vietnamese',
    'Arabic',
  ];

  const specialties = [
    'Plastic Surgery',
    'Dermatology',
    'Dental',
    'Health Checkup',
    'Fertility',
    'Hair Transplant',
    'Ophthalmology',
  ];

  // Filter interpreters
  const filteredInterpreters = interpreters.filter((interpreter) => {
    const matchesSearch =
      interpreter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interpreter.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage =
      selectedLanguage === 'all' ||
      interpreter.languages.some((l) => l.name.toLowerCase() === selectedLanguage.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      interpreter.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    const matchesAvailability =
      selectedAvailability === 'all' ||
      (selectedAvailability === 'available' && interpreter.is_available);

    return matchesSearch && matchesLanguage && matchesSpecialty && matchesAvailability;
  });

  return (
    <div className="min-h-screen bg-ai-mesh">
      {/* Hero Section - Full Width Immersive */}
      <section className="relative overflow-hidden pb-16 pt-12">
        {/* Animated background orbs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1.2, 1, 1.2],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-pink-500/20 to-rose-600/15 blur-3xl"
          />
        </div>

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-6 py-3 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-semibold text-primary">AI-Powered Matching</span>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                {interpreters.length}+ Interpreters
              </Badge>
            </motion.div>

            {/* Main Title with 3D Effect */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-5xl font-black tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="text-ai-gradient">Medical</span>
              <br />
              <span className="relative">
                Interpreters
                <motion.span
                  className="absolute -right-8 top-0 text-2xl"
                  animate={{ rotate: [0, 15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground"
            >
              Connect with certified medical interpreters who speak your language.
              <span className="font-semibold text-foreground"> Free platform service.</span>
            </motion.p>

            {/* Stats Cards with 3D Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12 flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Globe, value: '10+', label: 'Languages', color: 'from-violet-500 to-purple-600' },
                { icon: Award, value: '100%', label: 'Certified', color: 'from-cyan-500 to-blue-600' },
                { icon: Clock, value: '24/7', label: 'Support', color: 'from-emerald-500 to-green-600' },
                { icon: Shield, value: 'Free', label: 'Service Fee', color: 'from-amber-500 to-orange-600' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, rotateX: -20 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{
                    y: -8,
                    rotateY: 5,
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-xl backdrop-blur-xl transition-all dark:bg-gray-900/80"
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-10`} />
                  <div className="relative flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-black">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters - Floating Glass Card */}
      <section className="sticky top-16 z-40 py-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:bg-gray-900/90"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  placeholder="Search interpreters by name, language, specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-xl border-2 border-primary/20 bg-white pl-12 text-lg transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 dark:bg-gray-800"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-12 w-[150px] rounded-xl border-2 border-primary/20 bg-white dark:bg-gray-800">
                    <Globe className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang.toLowerCase()}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="h-12 w-[170px] rounded-xl border-2 border-primary/20 bg-white dark:bg-gray-800">
                    <Award className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty.toLowerCase()}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                  <SelectTrigger className="h-12 w-[150px] rounded-xl border-2 border-primary/20 bg-white dark:bg-gray-800">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex gap-1 rounded-xl border-2 border-primary/20 bg-white p-1 dark:bg-gray-800">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-10 w-10 rounded-lg"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    className="h-10 w-10 rounded-lg"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="container py-12">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-lg text-muted-foreground">
            Found <span className="font-bold text-foreground">{filteredInterpreters.length}</span> interpreters
          </p>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredInterpreters.map((interpreter) => (
                <InterpreterCard3D
                  key={interpreter.id}
                  interpreter={interpreter}
                  locale={locale}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {filteredInterpreters.map((interpreter) => (
                <InterpreterListCard
                  key={interpreter.id}
                  interpreter={interpreter}
                  locale={locale}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredInterpreters.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-bold">No interpreters found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search term
            </p>
          </motion.div>
        )}
      </section>

      {/* CTA Section with 3D Effect */}
      <section className="container pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] p-1"
          style={{
            background: 'linear-gradient(135deg, oklch(0.55 0.25 270), oklch(0.65 0.2 200), oklch(0.6 0.22 290))',
          }}
        >
          <div className="relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-8 py-16 text-center text-white lg:px-16">
            {/* Animated orbs inside */}
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl"
            />
            <motion.div
              animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
            />

            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Sparkles className="mx-auto mb-6 h-16 w-16 opacity-80" />
            </motion.div>
            <h2 className="mb-4 text-3xl font-black lg:text-5xl">
              Can't find the right interpreter?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
              Our AI will match you with the perfect interpreter based on your specific needs, language, and medical specialty.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="h-14 gap-3 rounded-2xl bg-white px-10 text-lg font-bold text-purple-700 shadow-2xl hover:bg-white/90"
                asChild
              >
                <Link href={`/${locale}/inquiry`}>
                  <Zap className="h-5 w-5" />
                  Get AI-Matched Interpreter
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function InterpreterCard3D({
  interpreter,
  locale,
}: {
  interpreter: Interpreter;
  locale: Locale;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        y: -12,
        rotateY: 3,
        rotateX: -3,
      }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      className="group"
    >
      <div className="relative h-full overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl transition-shadow duration-500 hover:shadow-2xl dark:bg-gray-900">
        {/* Gradient overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 z-10 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none"
        />

        {/* Image Section - Much Larger */}
        <div className="relative h-72 overflow-hidden">
          <Image
            src={interpreter.photo_url}
            alt={interpreter.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Video badge */}
          {interpreter.video_url && (
            <motion.div
              whileHover={{ scale: 1.15 }}
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm"
            >
              <Play className="h-6 w-6 fill-primary text-primary" />
            </motion.div>
          )}

          {/* Availability badge */}
          <div className="absolute left-4 top-4">
            {interpreter.is_available ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge className="border-0 bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
                  Available
                </Badge>
              </motion.div>
            ) : (
              <Badge variant="secondary" className="bg-black/60 px-4 py-2 text-white backdrop-blur-sm">
                Unavailable
              </Badge>
            )}
          </div>

          {/* Name and location overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="mb-1 text-2xl font-bold text-white drop-shadow-lg">
                  {interpreter.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <MapPin className="h-4 w-4" />
                  {interpreter.location}
                </div>
              </div>
              {interpreter.is_verified && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <BadgeCheck className="h-6 w-6 text-cyan-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Rating & Experience */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 dark:bg-amber-900/30">
              <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {interpreter.avg_rating.toFixed(1)}
              </span>
              <span className="text-sm text-amber-600/70 dark:text-amber-400/70">
                ({interpreter.review_count})
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {interpreter.experience_years}+ yrs
            </span>
          </div>

          {/* Languages */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {interpreter.languages.slice(0, 3).map((lang) => (
                <Badge
                  key={lang.code}
                  variant="outline"
                  className="border-2 border-primary/30 bg-primary/5 px-3 py-1 font-medium"
                >
                  {lang.name}
                  {lang.level === 'native' && (
                    <Star className="ml-1 h-3 w-3 fill-primary text-primary" />
                  )}
                </Badge>
              ))}
              {interpreter.languages.length > 3 && (
                <Badge variant="outline" className="border-2 px-3 py-1">
                  +{interpreter.languages.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Specialties */}
          <div className="mb-5 flex flex-wrap gap-2">
            {interpreter.specialties.slice(0, 2).map((specialty) => (
              <Badge
                key={specialty}
                className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300"
              >
                {specialty}
              </Badge>
            ))}
          </div>

          {/* Pricing */}
          <div className="mb-5 flex items-baseline justify-between rounded-2xl bg-gradient-to-r from-primary/5 to-purple-500/5 p-4">
            <div>
              <span className="text-3xl font-black text-primary">
                ${interpreter.hourly_rate}
              </span>
              <span className="text-muted-foreground">/hr</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold">${interpreter.daily_rate}</span>
              <span className="text-sm text-muted-foreground">/day</span>
            </div>
          </div>

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-base font-semibold shadow-lg hover:shadow-xl"
              asChild
            >
              <Link href={`/${locale}/interpreters/${interpreter.id}`}>
                View Profile
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function InterpreterListCard({
  interpreter,
  locale,
}: {
  interpreter: Interpreter;
  locale: Locale;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 8, scale: 1.01 }}
      className="group"
    >
      <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl transition-all hover:shadow-2xl dark:bg-gray-900">
        <div className="flex flex-col lg:flex-row">
          {/* Image section - Larger */}
          <div className="relative h-64 w-full lg:h-auto lg:w-80">
            <Image
              src={interpreter.photo_url}
              alt={interpreter.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30 lg:bg-gradient-to-b" />

            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {interpreter.is_available ? (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
                  Available
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                  Unavailable
                </Badge>
              )}
              {interpreter.is_verified && (
                <Badge className="bg-cyan-500/90 text-white">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>

            {interpreter.video_url && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl"
              >
                <Play className="h-6 w-6 fill-primary text-primary" />
              </motion.div>
            )}
          </div>

          {/* Content section */}
          <div className="flex flex-1 flex-col p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="mb-2 text-2xl font-bold">{interpreter.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary" />
                      {interpreter.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      {interpreter.experience_years}+ years
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      {interpreter.total_bookings} bookings
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="mb-4 line-clamp-2 text-muted-foreground">
                  {interpreter.bio}
                </p>

                {/* Languages & Specialties */}
                <div className="flex flex-wrap gap-6">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Languages
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interpreter.languages.map((lang) => (
                        <Badge
                          key={lang.code}
                          variant="outline"
                          className="border-2 border-primary/30 bg-primary/5"
                        >
                          {lang.name}
                          {lang.level === 'native' && (
                            <Star className="ml-1 h-3 w-3 fill-primary text-primary" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Specialties
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interpreter.specialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-row items-center gap-8 lg:flex-col lg:items-end lg:gap-4">
                {/* Rating */}
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 dark:bg-amber-900/30">
                  <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {interpreter.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({interpreter.review_count})
                  </span>
                </div>

                {/* Pricing */}
                <div className="text-right">
                  <div>
                    <span className="text-3xl font-black text-primary">
                      ${interpreter.hourly_rate}
                    </span>
                    <span className="text-muted-foreground">/hr</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${interpreter.daily_rate}/day
                  </div>
                </div>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-8 shadow-lg"
                    asChild
                  >
                    <Link href={`/${locale}/interpreters/${interpreter.id}`}>
                      View Profile
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
