'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  X,
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

// Specialty keys for translation lookup
const specialtyKeys = ['all', 'plastic-surgery', 'dermatology', 'dental', 'ophthalmology', 'hair-transplant', 'health-checkup', 'fertility'];

// Helper to convert specialty name to translation key
function specialtyToKey(specialty: string): string {
  return specialty
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Known specialty keys that have translations
const knownSpecialtyKeys = [
  'plastic-surgery', 'dermatology', 'dental', 'ophthalmology',
  'hair-transplant', 'health-checkup', 'fertility', 'all'
];

export function HospitalsPageClient({ hospitals, locale }: HospitalsPageClientProps) {
  const t = useTranslations('hospitals');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Apply search when button clicked or Enter pressed
  const handleSearch = () => {
    setAppliedSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Filter hospitals
  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      appliedSearch === '' ||
      hospital.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      hospital.description.toLowerCase().includes(appliedSearch.toLowerCase());
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      hospital.specialties.some((s) =>
        s.toLowerCase().includes(selectedSpecialty.replace('-', ' '))
      );
    return matchesSearch && matchesSpecialty;
  });

  // Sort hospitals by rating (default)
  const sortedHospitals = [...filteredHospitals].sort((a, b) => b.rating - a.rating);

  const hasActiveFilters = selectedSpecialty !== 'all';

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
                {t('listing.aiBadge')}
              </span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              <span className="block">{t('listing.heroTitle1')}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                {t('listing.heroTitle2')}
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
                { icon: Building2, value: '200+', label: t('listing.stats.hospitals') },
                { icon: Award, value: 'JCI', label: t('listing.stats.accredited') },
                { icon: CheckCircle2, value: '100%', label: t('listing.stats.verified') },
                { icon: HeartPulse, value: '24/7', label: t('listing.stats.support') },
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-14 rounded-xl border-0 bg-background/50 pl-12 pr-24 text-base shadow-inner focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-lg"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                className="h-14 gap-2 rounded-xl px-6 transition-all hover:shadow-lg"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('listing.filters.button')}
                {hasActiveFilters && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
                    1
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
                        <SelectValue placeholder={t('filters.specialty')} />
                      </SelectTrigger>
                      <SelectContent>
                        {specialtyKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`listing.specialties.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground"
                        onClick={() => setSelectedSpecialty('all')}
                      >
                        <X className="h-3 w-3" />
                        {t('listing.clearFilters')}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('listing.showing')} <span className="font-semibold text-foreground">{sortedHospitals.length}</span> {t('listing.hospitalsCount')}
          </p>
        </div>

        {/* Hospital Grouped View */}
        <GroupedHospitalsView
          hospitals={sortedHospitals}
          locale={locale}
        />

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
            <h3 className="mb-2 text-lg font-semibold">{t('listing.noResults.title')}</h3>
            <p className="text-muted-foreground">
              {t('listing.noResults.description')}
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
                {t('listing.aiCta.title')}
              </h3>
              <p className="mx-auto mb-6 max-w-xl text-white/70">
                {t('listing.aiCta.description')}
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t('listing.aiCta.button')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
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
  'general': {
    name: 'General Hospital',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-950 border-teal-200 dark:border-teal-800',
    emoji: '🏥'
  },
  'general-hospital': {
    name: 'General Hospital',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-950 border-teal-200 dark:border-teal-800',
    emoji: '🏥'
  },
  'other': {
    name: 'Other Clinics',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    emoji: '🏨'
  },
};

// Grouped View Component - Category only
function GroupedHospitalsView({
  hospitals,
  locale,
}: {
  hospitals: Hospital[];
  locale: Locale;
}) {
  const t = useTranslations('hospitals');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Helper to get translated specialty name
  const getSpecialtyName = (specialty: string) => {
    const key = specialtyToKey(specialty);
    if (knownSpecialtyKeys.includes(key)) {
      return t(`listing.specialties.${key}`);
    }
    return specialty;
  };

  // Group hospitals by category
  const groupedHospitals = hospitals.reduce((acc, hospital) => {
    const key = hospital.category || 'other';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(hospital);
    return acc;
  }, {} as Record<string, Hospital[]>);

  // Get all categories from categoryConfig and merge with actual data
  // This ensures all categories are shown even with 0 hospitals
  const allCategories = Object.keys(categoryConfig);
  const allGroups: [string, Hospital[]][] = allCategories.map((cat) => [
    cat,
    groupedHospitals[cat] || [],
  ]);

  // Sort groups by count (most hospitals first), keeping 0-count categories at the end
  const sortedGroups = allGroups.sort((a, b) => {
    // Both have hospitals - sort by count
    if (a[1].length > 0 && b[1].length > 0) {
      return b[1].length - a[1].length;
    }
    // One has hospitals, one doesn't - hospitals first
    if (a[1].length > 0) return -1;
    if (b[1].length > 0) return 1;
    // Both have 0 - maintain original order
    return 0;
  });

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
      {/* Quick Stats - Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedGroups.map(([group, groupHospitals]) => {
          const config = categoryConfig[group] || categoryConfig['other'];
          const categoryKey = group === 'traditional-medicine' ? 'traditional-korean-medicine' : group;
          const displayName = t(`listing.categories.${categoryKey}`);

          return (
            <motion.button
              key={group}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const element = document.getElementById(`group-${group}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`p-4 rounded-2xl border-2 transition-all text-left shadow-sm hover:shadow-md cursor-pointer ${config.bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{config.emoji}</span>
                <span className={`font-bold text-2xl ${config.color}`}>
                  {groupHospitals.length}
                </span>
              </div>
              <p className={`font-semibold truncate ${config.color}`}>
                {displayName}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Grouped Sections */}
      {sortedGroups.map(([group, groupHospitals]) => {
        const config = categoryConfig[group] || categoryConfig['other'];
        const categoryKey = group === 'traditional-medicine' ? 'traditional-korean-medicine' : group;
        const displayName = t(`listing.categories.${categoryKey}`);
        const isExpanded = expandedGroups.has(group);
        const visibleHospitals = isExpanded ? groupHospitals : groupHospitals.slice(0, 8);

        return (
        <motion.div
          key={group}
          id={`group-${group}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 scroll-mt-24"
        >
          {/* Group Header */}
          <div className={`rounded-2xl p-5 border-2 ${config.bgColor}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{config.emoji}</span>
                <div>
                  <h3 className={`text-xl font-bold ${config.color}`}>
                    {displayName}
                  </h3>
                </div>
              </div>
              <Badge className={`text-sm px-3 py-1 ${config.bgColor} ${config.color} border`}>
                {t('listing.hospitalCount', { count: groupHospitals.length })}
              </Badge>
            </div>
          </div>

          {/* Hospital Cards */}
          {groupHospitals.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t('listing.noHospitalsInCategory') || 'No hospitals in this category yet'}</p>
            </div>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleHospitals.map((hospital) => (
              <Link
                key={hospital.id}
                href={`/hospitals/${hospital.slug}`}
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
                      sizes="(max-width: 768px) 50vw, 200px"
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
                          {getSpecialtyName(spec)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          )}

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
                    {t('listing.showLess')}
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('listing.viewAll', { count: groupHospitals.length })}
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
