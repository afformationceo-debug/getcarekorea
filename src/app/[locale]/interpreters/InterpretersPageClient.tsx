'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Search,
  Star,
  Calendar,
  Grid,
  List,
  BadgeCheck,
  Clock,
  Sparkles,
  Users,
  Award,
  Shield,
  ChevronRight,
  ChevronDown,
  Play,
  MapPin,
  Zap,
  Globe,
  Loader2,
} from 'lucide-react';

const ITEMS_PER_PAGE = 16;
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

interface Language {
  code: string;
  name: string;
  level: string;
}

interface Interpreter {
  id: string;
  slug?: string;
  name: string;
  photo_url: string | null;
  languages: Language[];
  specialties: string[];
  bio: string;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  total_posts?: number;
  is_verified: boolean;
  is_available: boolean;
  is_featured?: boolean;
  video_url: string | null;
  experience_years: number;
  location: string;
  language_codes?: string[];
}

interface InterpretersPageClientProps {
  initialInterpreters: Interpreter[];
  initialTotal: number;
  locale: Locale;
}

export function InterpretersPageClient({ initialInterpreters, initialTotal, locale }: InterpretersPageClientProps) {
  const t = useTranslations('interpreters');
  // Deduplicate initial data (only on mount using initializer function)
  const [interpreters, setInterpreters] = useState<Interpreter[]>(() =>
    initialInterpreters.filter(
      (interpreter, index, self) => self.findIndex(i => i.id === interpreter.id) === index
    )
  );
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(locale);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false); // Only enable after first "Load More" click
  const [hasMore, setHasMore] = useState(initialInterpreters.length < initialTotal); // Track hasMore as state
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // Ref to prevent race conditions in infinite scroll

  const languages = [
    { code: 'all', name: t('filters.allLanguages') },
    { code: 'en', name: t('languages.en') },
    { code: 'ko', name: t('languages.ko') },
    { code: 'zh-CN', name: t('languages.zh-CN') },
    { code: 'zh-TW', name: t('languages.zh-TW') },
    { code: 'ja', name: t('languages.ja') },
    { code: 'th', name: t('languages.th') },
    { code: 'ru', name: t('languages.ru') },
    { code: 'mn', name: t('languages.mn') },
  ];

  const specialties = [
    { key: 'all', name: t('filters.allSpecialties') },
    { key: 'Plastic Surgery', name: t('specialties.Plastic Surgery') },
    { key: 'Dermatology', name: t('specialties.Dermatology') },
    { key: 'Dental', name: t('specialties.Dental') },
    { key: 'Health Checkup', name: t('specialties.Health Checkup') },
    { key: 'Fertility', name: t('specialties.Fertility') },
    { key: 'Hair Transplant', name: t('specialties.Hair Transplant') },
    { key: 'Ophthalmology', name: t('specialties.Ophthalmology') },
  ];

  // Fetch interpreters from API with filters
  const fetchInterpreters = useCallback(async (pageNum: number, append: boolean = false) => {
    // Prevent concurrent fetches using ref (for race condition prevention)
    if (append && isFetchingRef.current) {
      return;
    }

    if (append) {
      isFetchingRef.current = true;
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = new URLSearchParams({
        locale,
        page: String(pageNum),
        limit: String(ITEMS_PER_PAGE),
        ...(selectedLanguage !== 'all' && { language: selectedLanguage }),
        ...(selectedSpecialty !== 'all' && { specialty: selectedSpecialty }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/interpreters?${params}`);

      if (!response.ok) {
        console.error('API error:', response.status);
        // Stop further loading attempts on error
        setHasMore(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const newTotal = result.meta?.total || result.data.length;
        const apiHasMore = result.meta?.hasMore ?? false;

        if (append) {
          // Deduplicate when appending
          setInterpreters(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const duplicates = result.data.filter((i: Interpreter) => existingIds.has(i.id));
            const newItems = result.data.filter((i: Interpreter) => !existingIds.has(i.id));

            // Log duplicates for debugging
            if (duplicates.length > 0) {
              console.warn(`[Pagination] Found ${duplicates.length} duplicate(s) on page ${pageNum}:`,
                duplicates.map((d: Interpreter) => ({ id: d.id, name: d.name }))
              );
            }
            console.log(`[Pagination] Page ${pageNum}: ${result.data.length} fetched, ${newItems.length} new, ${duplicates.length} duplicates, total: ${prev.length + newItems.length}/${newTotal}`);

            const updated = [...prev, ...newItems];
            // If no new items were added or API says no more, stop loading
            if (newItems.length === 0) {
              setHasMore(false);
            } else {
              setHasMore(apiHasMore);
            }
            return updated;
          });
        } else {
          setInterpreters(result.data);
          setInfiniteScrollEnabled(false); // Reset on filter change
          setHasMore(apiHasMore);
        }
        setTotal(newTotal);
        setPage(pageNum);
      } else {
        // API returned error, stop further loading
        console.error('API returned error:', result.error);
        if (append) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch interpreters:', error);
      // Stop further loading attempts on error
      if (append) {
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [locale, selectedLanguage, selectedSpecialty, searchQuery]);

  // Fetch when filters change (reset to page 1)
  useEffect(() => {
    const isInitialState = selectedLanguage === locale && selectedSpecialty === 'all' && searchQuery === '';
    if (!isInitialState) {
      fetchInterpreters(1, false);
    }
  }, [selectedLanguage, selectedSpecialty, searchQuery, fetchInterpreters, locale]);

  // Load more function (first click enables infinite scroll)
  const loadMore = useCallback(() => {
    // Use ref to check for concurrent fetches (prevents race condition)
    if (isFetchingRef.current || isLoadingMore || !hasMore) {
      return;
    }
    fetchInterpreters(page + 1, true);
    // Enable infinite scroll after first manual load
    if (!infiniteScrollEnabled) {
      setInfiniteScrollEnabled(true);
    }
  }, [fetchInterpreters, page, isLoadingMore, hasMore, infiniteScrollEnabled]);

  // Intersection Observer for infinite scroll (only active after first "Load More" click)
  useEffect(() => {
    if (!infiniteScrollEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Use ref check to prevent race conditions (ref always has current value)
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current && !isLoadingMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isLoading, infiniteScrollEnabled]);

  const filteredInterpreters = interpreters;

  // Helper to get translated specialty name
  const getSpecialtyName = (specialty: string) => {
    const found = specialties.find(s => s.key.toLowerCase() === specialty.toLowerCase());
    return found ? found.name : specialty;
  };

  // Helper to get translated language name from code
  const getLanguageName = (code: string) => {
    const found = languages.find(l => l.code === code);
    return found ? found.name : code;
  };

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
              <span className="font-semibold text-primary">{t('aiPoweredMatching')}</span>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                {interpreters.length}+ {t('title')}
              </Badge>
            </motion.div>

            {/* Main Title with 3D Effect */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-5xl font-black tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="text-ai-gradient">{t('heroTitle1')}</span>
              <br />
              <span className="relative">
                {t('heroTitle2')}
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
              {t('heroDescription')}
              <span className="font-semibold text-foreground"> {t('freeService')}</span>
            </motion.p>

            {/* Stats Cards with 3D Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12 flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Globe, value: '10+', label: t('stats.languages'), color: 'from-violet-500 to-purple-600' },
                { icon: Award, value: '100%', label: t('stats.certified'), color: 'from-cyan-500 to-blue-600' },
                { icon: Clock, value: '24/7', label: t('stats.support'), color: 'from-emerald-500 to-green-600' },
                { icon: Shield, value: 'Free', label: t('stats.serviceFee'), color: 'from-amber-500 to-orange-600' },
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
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 rounded-xl border-2 border-primary/20 bg-white pl-12 text-lg transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 dark:bg-gray-800"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="!h-14 w-[180px] rounded-xl border-2 border-primary/20 bg-white text-sm dark:bg-gray-800">
                    <Globe className="mr-2 h-5 w-5 text-primary" />
                    <SelectValue placeholder={t('filters.language')} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="!h-14 w-[180px] rounded-xl border-2 border-primary/20 bg-white text-sm dark:bg-gray-800">
                    <Award className="mr-2 h-5 w-5 text-primary" />
                    <SelectValue placeholder={t('filters.specialty')} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.key} value={specialty.key}>
                        {specialty.name}
                      </SelectItem>
                    ))}
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
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('filters.all')}...
              </span>
            ) : (
              <>
                {t('found', { count: total })}
                {hasMore && (
                  <span className="ml-2 text-sm">
                    ({filteredInterpreters.length} / {total})
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[400px] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInterpreters.map((interpreter) => (
              <InterpreterCard3D
                key={interpreter.id}
                interpreter={interpreter}
                locale={locale}
                getLanguageName={getLanguageName}
                getSpecialtyName={getSpecialtyName}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredInterpreters.map((interpreter) => (
              <InterpreterListCard
                key={interpreter.id}
                interpreter={interpreter}
                locale={locale}
                getLanguageName={getLanguageName}
                getSpecialtyName={getSpecialtyName}
              />
            ))}
          </div>
        )}

        {/* Load More / Infinite Scroll Trigger */}
        {hasMore && !isLoading && (
          <div ref={loadMoreRef} className="mt-16 flex flex-col items-center gap-4">
            {isLoadingMore ? (
              <div className="flex items-center gap-3 rounded-full bg-violet-100 px-8 py-4 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="font-medium">{t('filters.all')}...</span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <p className="text-sm text-muted-foreground">
                  {filteredInterpreters.length} / {total} {t('filters.all')}
                </p>
                <Button
                  size="lg"
                  onClick={loadMore}
                  className="group gap-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-10 py-6 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30"
                >
                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                  {t('loadMore')}
                  <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {filteredInterpreters.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-bold">{t('noResults.title')}</h3>
            <p className="text-muted-foreground">
              {t('noResults.description')}
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
              {t('cta.title')}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
              {t('cta.description')}
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="h-14 gap-3 rounded-2xl bg-white px-10 text-lg font-bold text-purple-700 shadow-2xl hover:bg-white/90"
                asChild
              >
                <Link href={`/inquiry`}>
                  <Zap className="h-5 w-5" />
                  {t('cta.button')}
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
  getLanguageName,
  getSpecialtyName,
}: {
  interpreter: Interpreter;
  locale: Locale;
  getLanguageName: (code: string) => string;
  getSpecialtyName: (specialty: string) => string;
}) {
  const t = useTranslations('interpreters');
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl transition-shadow duration-500 hover:shadow-2xl dark:bg-gray-900">
        {/* Gradient overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 z-10 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none"
        />

        {/* Image Section - Much Larger */}
        <div className="relative h-72 overflow-hidden">
          {interpreter.photo_url ? (
            <Image
              src={interpreter.photo_url}
              alt={interpreter.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              unoptimized={interpreter.photo_url.includes('.svg') || interpreter.photo_url.includes('dicebear')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
              <span className="text-6xl font-bold text-primary/40">
                {interpreter.name[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}

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
                  {t('card.available')}
                </Badge>
              </motion.div>
            ) : (
              <Badge variant="secondary" className="bg-black/60 px-4 py-2 text-white backdrop-blur-sm">
                {t('card.unavailable')}
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
        <div className="flex flex-1 flex-col p-5">
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
              {interpreter.experience_years}+ {t('card.yearsExp')}
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
                  {getLanguageName(lang.code)}
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
                {getSpecialtyName(specialty)}
              </Badge>
            ))}
          </div>

          {/* CTA - Always at bottom */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-auto pt-2">
            <Button
              className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-base font-semibold shadow-lg hover:shadow-xl"
              asChild
            >
              <Link href={`/interpreters/${interpreter.slug || interpreter.id}`}>
                {t('card.viewProfile')}
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
  getLanguageName,
  getSpecialtyName,
}: {
  interpreter: Interpreter;
  locale: Locale;
  getLanguageName: (code: string) => string;
  getSpecialtyName: (specialty: string) => string;
}) {
  const t = useTranslations('interpreters');
  return (
    <motion.div
      whileHover={{ x: 4, scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group"
    >
      <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-xl transition-all hover:shadow-2xl dark:bg-gray-900">
        <div className="flex flex-col lg:flex-row">
          {/* Image section - Larger */}
          <div className="relative h-64 w-full lg:h-auto lg:w-80">
            {interpreter.photo_url ? (
              <Image
                src={interpreter.photo_url}
                alt={interpreter.name}
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized={interpreter.photo_url.includes('.svg') || interpreter.photo_url.includes('dicebear')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                <span className="text-6xl font-bold text-primary/40">
                  {interpreter.name[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30 lg:bg-gradient-to-b" />

            {/* Badges */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {interpreter.is_available ? (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                  <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-white" />
                  {t('card.available')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-sm">
                  {t('card.unavailable')}
                </Badge>
              )}
              {interpreter.is_verified && (
                <Badge className="bg-cyan-500/90 text-white">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  {t('card.verified')}
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
                      {interpreter.experience_years}+ {t('card.years')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      {interpreter.total_bookings} {t('card.bookings')}
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
                      {t('card.languagesLabel')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interpreter.languages.map((lang) => (
                        <Badge
                          key={lang.code}
                          variant="outline"
                          className="border-2 border-primary/30 bg-primary/5"
                        >
                          {getLanguageName(lang.code)}
                          {lang.level === 'native' && (
                            <Star className="ml-1 h-3 w-3 fill-primary text-primary" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('card.specialtiesLabel')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interpreter.specialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                        >
                          {getSpecialtyName(specialty)}
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

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-8 shadow-lg"
                    asChild
                  >
                    <Link href={`/interpreters/${interpreter.slug || interpreter.id}`}>
                      {t('card.viewProfile')}
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
