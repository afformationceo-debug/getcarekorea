'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  MessageCircle,
  Share2,
  Bookmark,
  Heart,
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  Sparkles,
  User,
  Tag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Locale } from '@/lib/i18n/config';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  cover_image_url: string | null;
  category: string;
  tags: string[] | null;
  published_at: string | null;
  view_count: number;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  relatedPosts?: Array<{
    id: string;
    slug: string;
    title: string;
    cover_image_url: string | null;
    published_at: string | null;
  }>;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200';

export default function BlogDetailPage() {
  const locale = useLocale() as Locale;
  const params = useParams();
  const slug = params.slug as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/blog/${slug}?locale=${locale}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Post not found');
        }

        setPost(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchPost();
    }
  }, [slug, locale]);

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format category name
  const formatCategoryName = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate read time
  const getReadTime = (content: string | null): string => {
    if (!content) return '1 min read';
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The article you are looking for does not exist or has been removed.'}
          </p>
          <Button asChild>
            <Link href={`/${locale}/blog`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-[400px] lg:h-[500px]">
        <Image
          src={post.cover_image_url || DEFAULT_IMAGE}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute left-4 top-4 lg:left-8 lg:top-8"
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-white/90 backdrop-blur-sm"
            asChild
          >
            <Link href={`/${locale}/blog`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </motion.div>
      </div>

      <div className="container relative -mt-32 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* Article Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="overflow-hidden border-0 shadow-2xl">
              <CardContent className="p-8 lg:p-12">
                {/* Category & Tags */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {post.category && (
                    <Badge className="bg-violet-500 hover:bg-violet-600">
                      {formatCategoryName(post.category)}
                    </Badge>
                  )}
                  {post.tags?.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h1 className="mb-6 text-3xl font-bold lg:text-4xl">
                  {post.title}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="mb-6 text-lg text-muted-foreground">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta Info */}
                <div className="mb-6 flex flex-wrap items-center gap-4 text-muted-foreground">
                  {post.author && (
                    <>
                      <div className="flex items-center gap-2">
                        {post.author.avatar_url ? (
                          <Image
                            src={post.author.avatar_url}
                            alt={post.author.full_name || 'Author'}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {post.author.full_name || 'GetCareKorea Team'}
                          </p>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-8" />
                    </>
                  )}
                  {post.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.published_at)}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getReadTime(post.content)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.view_count.toLocaleString()} views
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <Heart className="h-4 w-4" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-2">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Share:</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <CardContent className="p-8 lg:p-12">
                <div
                  className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary"
                  dangerouslySetInnerHTML={{
                    __html: post.content
                      ?.replace(/\n/g, '<br />')
                      .replace(/#{3} (.*)/g, '<h3>$1</h3>')
                      .replace(/#{2} (.*)/g, '<h2>$1</h2>')
                      .replace(/#{1} (.*)/g, '<h1>$1</h1>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      || '<p>No content available.</p>'
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-12"
            >
              <h2 className="mb-6 text-2xl font-bold">Related Articles</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {post.relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/${locale}/blog/${relatedPost.slug}`}>
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="group overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg transition-all hover:border-violet-500/30 hover:shadow-xl"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={relatedPost.cover_image_url || DEFAULT_IMAGE}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(relatedPost.published_at)}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-purple-900/50 to-violet-950/50 p-8">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-xl font-bold text-white">Ready to Start Your Journey?</h3>
                  <p className="text-white/70">Get a free consultation with our medical tourism experts.</p>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                  asChild
                >
                  <Link href={`/${locale}/inquiry`}>
                    Get Free Quote
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
