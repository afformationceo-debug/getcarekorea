'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Languages,
  Shield,
  Heart,
  Camera,
  User,
  X,
  Grid3X3,
  List,
  Layers,
  ArrowRight,
  Sparkles,
  Building2,
  Award,
  CheckCircle2,
  HeartPulse,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Locale } from '@/lib/i18n/config';

interface Hospital {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  city: string;
  district?: string;
  specialties: string[];
  languages: string[];
  rating: number;
  reviews: number;
  certifications: string[];
  badges: string[];
  priceRange: string;
  hasCCTV: boolean;
  hasFemaleDoctor: boolean;
  category?: string;
  source?: string;
}

interface HospitalsPageClientProps {
  hospitals: Hospital[];
  locale: Locale;
}

const specialties = [
  { value: 'all', label: 'All Specialties' },
  { value: 'plastic-surgery', label: 'Plastic Surgery' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'dental', label: 'Dental' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'hair-transplant', label: 'Hair Transplant' },
  { value: 'health-checkup', label: 'Health Checkup' },
  { value: 'fertility', label: 'Fertility' },
];

const cities = [
  { value: 'all', label: 'All Cities' },
  { value: 'gangnam', label: 'Gangnam' },
  { value: 'seoul', label: 'Seoul' },
  { value: 'busan', label: 'Busan' },
  { value: 'incheon', label: 'Incheon' },
];

const sortOptions = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export function HospitalsPageClient({ hospitals, locale }: HospitalsPageClientProps) {
  const t = useTranslations('hospitals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped'>('grouped');
  const [showFilters, setShowFilters] = useState(false);
  const [groupBy, setGroupBy] = useState<'category' | 'district'>('category');

  // Filter hospitals
  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      hospital.specialties.some((s) =>
        s.toLowerCase().includes(selectedSpecialty.replace('-', ' '))
      );
    const matchesCity =
      selectedCity === 'all' ||
      hospital.city.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesSearch && matchesSpecialty && matchesCity;
  });

  // Sort hospitals
  const sortedHospitals = [...filteredHospitals].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return b.reviews - a.reviews;
      default:
        return 0;
    }
  });

  const activeFiltersCount =
    (selectedSpecialty !== 'all' ? 1 : 0) + (selectedCity !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-20 lg:py-28">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
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
              y: [0, 60, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            className="absolute -bottom-20 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-purple-500/20 to-pink-500/15 blur-3xl"
          />
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            {/* AI Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-white/90">
                AI-Curated Medical Excellence
              </span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              <span className="block">World-Class</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Healthcare in Korea
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 lg:text-xl">
              {t('subtitle')}
            </p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
            >
              {[
                { icon: Building2, value: '200+', label: 'Hospitals' },
                { icon: Award, value: 'JCI', label: 'Accredited' },
                { icon: CheckCircle2, value: '100%', label: 'Verified' },
                { icon: HeartPulse, value: '24/7', label: 'Support' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{
                    y: -5,
                    rotateY: 5,
                    rotateX: -5,
                  }}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-cyan-400 transition-transform group-hover:scale-110" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container py-8">
        {/* Floating Glass Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="-mt-16 relative z-20 mb-8"
        >
          <div className="glass mx-auto max-w-4xl rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-xl border-0 bg-background/50 pl-12 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                className="h-14 gap-2 rounded-xl px-6 transition-all hover:shadow-lg"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Filters Row */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
                    <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                      <SelectTrigger className="w-[180px] rounded-xl bg-background/50">
                        <SelectValue placeholder="Specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.value} value={specialty.value}>
                            {specialty.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="w-[160px] rounded-xl bg-background/50">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px] rounded-xl bg-background/50">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground"
                        onClick={() => {
                          setSelectedSpecialty('all');
                          setSelectedCity('all');
                        }}
                      >
                        <X className="h-3 w-3" />
                        Clear filters
                      </Button>
                    )}

                    <div className="ml-auto flex items-center gap-1 rounded-xl border bg-background/50 p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`rounded-lg p-2 transition-colors ${
                          viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'
                        }`}
                        title="Grid View"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`rounded-lg p-2 transition-colors ${
                          viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'
                        }`}
                        title="List View"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grouped')}
                        className={`rounded-lg p-2 transition-colors ${
                          viewMode === 'grouped' ? 'bg-primary text-white' : 'hover:bg-muted'
                        }`}
                        title="Grouped View"
                      >
                        <Layers className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{sortedHospitals.length}</span> hospitals
          </p>
        </div>

        {/* Hospital Grid/List/Grouped */}
        {viewMode === 'grouped' ? (
          <GroupedHospitalsView
            hospitals={sortedHospitals}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            locale={locale}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={
              viewMode === 'grid'
                ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col gap-4'
            }
          >
            <AnimatePresence mode="popLayout">
              {sortedHospitals.map((hospital) => (
                <motion.div
                  key={hospital.id}
                  layout
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {viewMode === 'grid' ? (
                    <HospitalCard3D hospital={hospital} locale={locale} />
                  ) : (
                    <HospitalListCard hospital={hospital} locale={locale} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* No results */}
        {sortedHospitals.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <Search className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No hospitals found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}

        {/* AI CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50 p-8 lg:p-12">
            {/* Glow Effect */}
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="mb-3 text-2xl font-bold text-white lg:text-3xl">
                Not sure where to start?
              </h3>
              <p className="mx-auto mb-6 max-w-xl text-white/70">
                Our AI-powered consultation will analyze your needs and recommend the perfect hospital for your medical journey.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Recommendation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function HospitalCard3D({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/${locale}/hospitals/${hospital.slug}`} className="group block h-full">
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{
          y: -12,
          rotateY: 3,
          rotateX: -3,
        }}
        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        className="h-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg transition-all duration-500 hover:border-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/10"
      >
        {/* Large Image Section */}
        <div className="relative h-64 overflow-hidden">
          <Image
            src={hospital.image}
            alt={hospital.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />

          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Animated Shine Effect on Hover */}
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: isHovered ? '100%' : '-100%', opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />

          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {hospital.certifications.includes('JCI') && (
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg">
                <Shield className="mr-1 h-3 w-3" />
                JCI
              </Badge>
            )}
            {hospital.badges.map((badge) => (
              <Badge
                key={badge}
                className={
                  badge === 'Featured'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg'
                    : badge === 'Top Rated'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg'
                }
              >
                {badge}
              </Badge>
            ))}
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-red-500"
          >
            <Heart className="h-5 w-5" />
          </motion.button>

          {/* Trust Badges */}
          <div className="absolute bottom-16 left-3 flex gap-2">
            {hospital.hasCCTV && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm" title="CCTV Monitored">
                <Camera className="h-4 w-4 text-gray-700" />
              </div>
            )}
            {hospital.hasFemaleDoctor && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm" title="Female Doctor Available">
                <User className="h-4 w-4 text-pink-500" />
              </div>
            )}
          </div>

          {/* Rating Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 shadow-xl backdrop-blur-sm"
          >
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900">{hospital.rating}</span>
            <span className="text-sm text-gray-500">({hospital.reviews})</span>
          </motion.div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">
              {hospital.name}
            </h3>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{hospital.city}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {hospital.description}
          </p>

          {/* Specialties */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {hospital.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                {specialty}
              </Badge>
            ))}
            {hospital.specialties.length > 3 && (
              <Badge variant="secondary" className="bg-muted">
                +{hospital.specialties.length - 3}
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {hospital.languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: isHovered ? 0 : -10, opacity: isHovered ? 1 : 0 }}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              View
              <ArrowRight className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function HospitalListCard({ hospital, locale }: { hospital: Hospital; locale: Locale }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/${locale}/hospitals/${hospital.slug}`} className="group block">
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ x: 8 }}
        className="flex gap-6 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-lg transition-all duration-300 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5"
      >
        {/* Image */}
        <div className="relative h-48 w-72 shrink-0 overflow-hidden rounded-xl">
          <Image
            src={hospital.image}
            alt={hospital.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {hospital.certifications.includes('JCI') && (
            <Badge className="absolute left-2 top-2 bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg">
              <Shield className="mr-1 h-3 w-3" />
              JCI
            </Badge>
          )}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-sm shadow-lg">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{hospital.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold transition-colors group-hover:text-primary">
                  {hospital.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {hospital.city}
                  <span className="text-muted-foreground/50">•</span>
                  <span>{hospital.reviews} reviews</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              >
                <Heart className="h-4 w-4" />
              </motion.button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
              {hospital.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {hospital.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{hospital.languages.join(', ')}</span>
              </div>
              <div className="text-sm font-semibold text-primary">{hospital.priceRange}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full transition-all hover:bg-primary hover:text-primary-foreground"
            >
              View Details
              <motion.span
                animate={{ x: isHovered ? 4 : 0 }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.span>
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Category display name and styling mapping
const categoryConfig: Record<string, { name: string; color: string; bgColor: string; emoji: string }> = {
  'plastic-surgery': {
    name: 'Plastic Surgery',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-950 border-pink-200 dark:border-pink-800',
    emoji: '💎'
  },
  'dermatology': {
    name: 'Dermatology',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    emoji: '✨'
  },
  'dental': {
    name: 'Dental',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800',
    emoji: '🦷'
  },
  'ophthalmology': {
    name: 'Ophthalmology',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    emoji: '👁️'
  },
  'traditional-medicine': {
    name: 'Traditional Korean Medicine',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800',
    emoji: '🌿'
  },
  'university-hospital': {
    name: 'University Hospital',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
    emoji: '🏥'
  },
  'hair-transplant': {
    name: 'Hair Transplant',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    emoji: '💇'
  },
  'health-checkup': {
    name: 'Health Checkup',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    emoji: '🩺'
  },
  'other': {
    name: 'Other Clinics',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    emoji: '🏨'
  },
};

// Legacy mapping for compatibility
const categoryDisplayNames: Record<string, string> = Object.fromEntries(
  Object.entries(categoryConfig).map(([key, value]) => [key, value.name])
);

// Group by options
type GroupByOption = 'category' | 'district' | 'rating' | 'popularity';

const groupByLabels: Record<GroupByOption, { label: string; icon: React.ReactNode }> = {
  category: { label: 'Category', icon: <Building2 className="h-4 w-4" /> },
  district: { label: 'District', icon: <MapPin className="h-4 w-4" /> },
  rating: { label: 'Rating', icon: <Star className="h-4 w-4" /> },
  popularity: { label: 'Popularity', icon: <HeartPulse className="h-4 w-4" /> },
};

// Grouped View Component
function GroupedHospitalsView({
  hospitals,
  groupBy,
  setGroupBy,
  locale,
}: {
  hospitals: Hospital[];
  groupBy: 'category' | 'district';
  setGroupBy: (value: 'category' | 'district') => void;
  locale: Locale;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [localGroupBy, setLocalGroupBy] = useState<GroupByOption>(groupBy);

  // Update parent state when local changes
  const handleGroupByChange = (value: GroupByOption) => {
    setLocalGroupBy(value);
    if (value === 'category' || value === 'district') {
      setGroupBy(value);
    }
  };

  // Group hospitals based on groupBy option
  const groupedHospitals = hospitals.reduce((acc, hospital) => {
    let key: string;

    switch (localGroupBy) {
      case 'category':
        key = hospital.category || 'other';
        break;
      case 'district':
        key = hospital.district || 'Seoul';
        break;
      case 'rating':
        if (hospital.rating >= 4.8) key = 'excellent';
        else if (hospital.rating >= 4.5) key = 'very-good';
        else if (hospital.rating >= 4.0) key = 'good';
        else key = 'standard';
        break;
      case 'popularity':
        if (hospital.reviews >= 500) key = 'most-popular';
        else if (hospital.reviews >= 100) key = 'popular';
        else if (hospital.reviews >= 50) key = 'moderate';
        else key = 'new';
        break;
      default:
        key = hospital.category || 'other';
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(hospital);
    return acc;
  }, {} as Record<string, Hospital[]>);

  // Sort groups
  const sortedGroups = Object.entries(groupedHospitals).sort((a, b) => {
    if (localGroupBy === 'rating') {
      const ratingOrder = ['excellent', 'very-good', 'good', 'standard'];
      return ratingOrder.indexOf(a[0]) - ratingOrder.indexOf(b[0]);
    }
    if (localGroupBy === 'popularity') {
      const popOrder = ['most-popular', 'popular', 'moderate', 'new'];
      return popOrder.indexOf(a[0]) - popOrder.indexOf(b[0]);
    }
    return b[1].length - a[1].length;
  });

  // Group display names
  const getGroupDisplayName = (key: string): { name: string; description?: string } => {
    if (localGroupBy === 'category') {
      return { name: categoryDisplayNames[key] || key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
    }
    if (localGroupBy === 'district') {
      return { name: key };
    }
    if (localGroupBy === 'rating') {
      const ratingNames: Record<string, { name: string; description: string }> = {
        'excellent': { name: 'Excellent', description: '4.8+ Rating' },
        'very-good': { name: 'Very Good', description: '4.5-4.8 Rating' },
        'good': { name: 'Good', description: '4.0-4.5 Rating' },
        'standard': { name: 'Standard', description: 'Below 4.0' },
      };
      return ratingNames[key] || { name: key };
    }
    if (localGroupBy === 'popularity') {
      const popNames: Record<string, { name: string; description: string }> = {
        'most-popular': { name: 'Most Popular', description: '500+ Reviews' },
        'popular': { name: 'Popular', description: '100-500 Reviews' },
        'moderate': { name: 'Growing', description: '50-100 Reviews' },
        'new': { name: 'New & Promising', description: 'Under 50 Reviews' },
      };
      return popNames[key] || { name: key };
    }
    return { name: key };
  };

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="space-y-8">
      {/* Group By Toggle - Enhanced */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
        <span className="text-sm text-muted-foreground font-medium">Group by:</span>
        <div className="flex flex-wrap justify-center rounded-xl border bg-muted/30 p-1.5 gap-1">
          {(Object.keys(groupByLabels) as GroupByOption[]).map((option) => (
            <button
              key={option}
              onClick={() => handleGroupByChange(option)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                localGroupBy === option
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {groupByLabels[option].icon}
              {groupByLabels[option].label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats - Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedGroups.map(([group, groupHospitals]) => {
          const displayInfo = getGroupDisplayName(group);
          const config = localGroupBy === 'category' ? (categoryConfig[group] || categoryConfig['other']) : null;

          return (
            <motion.button
              key={group}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const element = document.getElementById(`group-${group}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`p-4 rounded-2xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
                config ? config.bgColor : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {config && <span className="text-2xl">{config.emoji}</span>}
                <span className={`font-bold text-2xl ${config ? config.color : 'text-foreground'}`}>
                  {groupHospitals.length}
                </span>
              </div>
              <p className={`font-semibold truncate ${config ? config.color : 'text-foreground'}`}>
                {displayInfo.name}
              </p>
              {displayInfo.description && (
                <p className="text-xs text-muted-foreground mt-1">{displayInfo.description}</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Grouped Sections */}
      {sortedGroups.map(([group, groupHospitals]) => {
        const displayInfo = getGroupDisplayName(group);
        const isExpanded = expandedGroups.has(group);
        const visibleHospitals = isExpanded ? groupHospitals : groupHospitals.slice(0, 8);
        const config = localGroupBy === 'category' ? (categoryConfig[group] || categoryConfig['other']) : null;

        return (
        <motion.div
          key={group}
          id={`group-${group}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 scroll-mt-24"
        >
          {/* Group Header - Enhanced */}
          <div className={`rounded-2xl p-5 border-2 ${config ? config.bgColor : 'bg-muted/30 border-border'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config ? (
                  <span className="text-3xl">{config.emoji}</span>
                ) : (
                  <>
                    {localGroupBy === 'district' && <MapPin className="h-6 w-6 text-primary" />}
                    {localGroupBy === 'rating' && <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />}
                    {localGroupBy === 'popularity' && <HeartPulse className="h-6 w-6 text-rose-500" />}
                  </>
                )}
                <div>
                  <h3 className={`text-xl font-bold ${config ? config.color : 'text-foreground'}`}>
                    {displayInfo.name}
                  </h3>
                  {displayInfo.description && (
                    <p className="text-sm text-muted-foreground">{displayInfo.description}</p>
                  )}
                </div>
              </div>
              <Badge className={`text-sm px-3 py-1 ${config ? `${config.bgColor} ${config.color} border` : ''}`}>
                {groupHospitals.length} {groupHospitals.length === 1 ? 'hospital' : 'hospitals'}
              </Badge>
            </div>
          </div>

          {/* Hospital Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleHospitals.map((hospital) => (
              <Link
                key={hospital.id}
                href={`/${locale}/hospitals/${hospital.slug}`}
                className="group"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="relative h-36 overflow-hidden">
                    <Image
                      src={hospital.image}
                      alt={hospital.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="font-semibold text-white text-sm truncate">{hospital.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{hospital.rating.toFixed(1)}</span>
                        <span>({hospital.reviews})</span>
                      </div>
                    </div>
                    {hospital.source === 'google_places' && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      {hospital.district || hospital.city}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs px-2 py-0">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Show More / Show Less */}
          {groupHospitals.length > 8 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground hover:text-primary"
                onClick={() => toggleGroup(group)}
              >
                {isExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    View all {groupHospitals.length} hospitals
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      );
      })}
    </div>
  );
}
