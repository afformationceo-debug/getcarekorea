'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import {
  Search,
  Sparkles,
  TrendingUp,
  BookOpen,
  Eye,
  MessageCircle,
  Bookmark,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Locale } from '@/lib/i18n/config';
import { getCategoryName } from '@/lib/i18n/translations';

// Types
interface BlogPost {
  id: string;
  slug: string;
  title: string;
  title_en: string;
  excerpt: string | null;
  excerpt_en: string | null;
  category: string;
  categoryDisplayName?: string;
  tags: string[] | null;
  author_id: string | null;
  featured_image: string | null;
  published_at: string | null;
  view_count: number;
  status: string;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800';

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

export default function BlogPage() {
  const t = useTranslations('blog');
  const locale = useLocale() as Locale;

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Categories - dynamically computed from posts
  const [categories, setCategories] = useState<Category[]>([
    { id: 'all', name: t('allPosts'), count: 0 },
  ]);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        locale,
        page: pageNum.toString(),
        limit: '12',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/blog?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch posts');
      }

      if (append) {
        setPosts(prev => [...prev, ...data.data]);
      } else {
        setPosts(data.data);
      }

      setTotal(data.meta.total);
      setHasMore(data.meta.hasMore);

      // Update categories with actual counts
      if (pageNum === 1 && !selectedCategory) {
        const categoryMap = new Map<string, number>();
        data.data.forEach((post: BlogPost) => {
          if (post.category) {
            categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
          }
        });

        const newCategories: Category[] = [
          { id: 'all', name: t('allPosts'), count: data.meta.total },
        ];

        categoryMap.forEach((count, cat) => {
          newCategories.push({
            id: cat,
            name: formatCategoryName(cat),
            count,
          });
        });

        setCategories(newCategories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [locale, selectedCategory, searchQuery]);

  // Initial fetch and when filters change
  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Load more
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  // Format category name with locale-specific translation
  const formatCategoryName = (category: string): string => {
    return getCategoryName(category, locale);
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-violet-950 via-purple-900 to-background py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-500/30 to-purple-600/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-cyan-500/25 to-blue-600/20 blur-3xl"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </motion.div>
              <span className="text-sm font-medium text-white/90">{t('heroTagline')}</span>
            </motion.div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white lg:text-6xl">
              <span className="block">{t('heroTitle1')}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-white/70 lg:text-xl">
              {t('heroDescription')}
            </p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mx-auto grid max-w-2xl grid-cols-3 gap-4"
            >
              {[
                { icon: BookOpen, value: total > 0 ? `${total}+` : '...', label: t('stats.articles') },
                { icon: Eye, value: '500K+', label: t('stats.readers') },
                { icon: TrendingUp, value: '#1', label: t('stats.ranked') },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
                >
                  <stat.icon className="mx-auto mb-2 h-6 w-6 text-cyan-400" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container py-8">
        {/* Search & Categories */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="-mt-16 relative z-20 mb-12"
        >
          <div className="glass mx-auto max-w-4xl rounded-2xl p-6 shadow-2xl">
            <div className="mb-4 relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-xl border-0 bg-background/50 pl-12 text-base shadow-inner"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                  <Badge variant="secondary" className="ml-2 bg-background/50">
                    {cat.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="mb-8 flex items-center justify-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => fetchPosts(1, false)}>
              {t('retry')}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="xl" color="secondary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-bold">{t('noArticles')}</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? t('noArticlesSearch')
                : t('noArticlesEmpty')}
            </p>
          </div>
        )}

        {/* Posts Grid */}
        {!loading && posts.length > 0 && (
          <>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {posts.map((post) => (
                <motion.div key={post.id} variants={itemVariants}>
                  <Link href={`/blog/${post.slug}`}>
                    <motion.div
                      whileHover={{ y: -8 }}
                      className="group h-full flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg transition-all hover:border-violet-500/30 hover:shadow-xl"
                    >
                      <div className="relative h-48 overflow-hidden flex-shrink-0">
                        <Image
                          src={post.featured_image || DEFAULT_IMAGE}
                          alt={post.title || post.title_en}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDAwUBAAAAAAAAAAAAAQIDAAQRBRIhBhMiMUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQADAAMAAAAAAAAAAAAAAAAAAQIDESH/2gAMAwEAAhEDEQA/ANW6Vntxpca2rSLEpKhZW3EZOTnHsnyHyarjSNNOMWFr/EV/v3SlQW04sGn/2Q=="
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {post.category && (
                          <Badge className="absolute left-3 top-3 bg-white/90 text-gray-900">
                            {post.categoryDisplayName || formatCategoryName(post.category)}
                          </Badge>
                        )}
                        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-violet-600">
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        {/* Content area - grows to fill space */}
                        <div className="flex-1">
                          <h3 className="mb-2 font-bold line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title || post.title_en}
                          </h3>
                          {(post.excerpt || post.excerpt_en) && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.excerpt || post.excerpt_en}
                            </p>
                          )}
                        </div>

                        {/* Footer - always at bottom */}
                        <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(post.published_at)}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {post.view_count?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full gap-2"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <LoadingSpinner size="sm" color="secondary" />
                      {t('loading')}
                    </>
                  ) : (
                    <>
                      {t('loadMore')}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
