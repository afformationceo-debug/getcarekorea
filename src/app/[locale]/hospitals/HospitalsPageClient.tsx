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
  ArrowRight,
  Sparkles,
  Building2,
  Award,
  CheckCircle2,
  HeartPulse,
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
  specialties: string[];
  languages: string[];
  rating: number;
  reviews: number;
  certifications: string[];
  badges: string[];
  priceRange: string;
  hasCCTV: boolean;
  hasFemaleDoctor: boolean;
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

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
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`rounded-lg p-2 transition-colors ${
                          viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'
                        }`}
                      >
                        <List className="h-4 w-4" />
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

        {/* Hospital Grid/List */}
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
                  <HospitalCard3D hospital={hospital} />
                ) : (
                  <HospitalListCard hospital={hospital} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

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

function HospitalCard3D({ hospital }: { hospital: Hospital }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/hospitals/${hospital.slug}`} className="group block h-full">
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

function HospitalListCard({ hospital }: { hospital: Hospital }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/hospitals/${hospital.slug}`} className="group block">
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
